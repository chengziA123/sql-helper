// Vercel Serverless 函数：转发到百度/有道官方翻译接口，密钥保存在 Vercel 环境变量中
const crypto = require('crypto');

function md5(s) { return crypto.createHash('md5').update(s, 'utf8').digest('hex'); }
function sha256(s) { return crypto.createHash('sha256').update(s, 'utf8').digest('hex'); }
function truncate(q) { const l = q.length; return l <= 20 ? q : (q.slice(0, 10) + l + q.slice(l - 10)); }
function yd(code) { return (code === 'zh' || code === 'zh-CN') ? 'zh-CHS' : code; }

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// 有道智云 文本翻译 v3
async function translateYoudao(q, from, to) {
    const appKey = process.env.YOUDAO_APP_KEY;
    const appSecret = process.env.YOUDAO_APP_SECRET;
    const salt = Date.now().toString();
    const curtime = Math.floor(Date.now() / 1000).toString();
    const sign = sha256(appKey + truncate(q) + salt + curtime + appSecret);
    const params = new URLSearchParams({
        q, from: yd(from), to: yd(to), appKey, salt, sign, signType: 'v3', curtime
    });
    const res = await fetch('https://openapi.youdao.com/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });
    const data = await res.json();
    if (!res.ok || (data.errorCode && String(data.errorCode) !== '0')) {
        throw new Error('youdao ' + (data.errorCode || res.status));
    }
    return {
        translation: (data.translation && data.translation[0]) || '',
        explains: (data.basic && data.basic.explains) || []
    };
}

// 百度翻译 通用文本翻译
async function translateBaidu(q, from, to) {
    const appid = process.env.BAIDU_APPID;
    const secret = process.env.BAIDU_SECRET;
    const salt = Date.now().toString();
    const sign = md5(appid + q + salt + secret);
    const params = new URLSearchParams({ q, from, to, appid, salt, sign });
    const res = await fetch('https://fanyi-api.baidu.com/api/trans/vip/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });
    const data = await res.json();
    if (data.error_code) throw new Error('baidu ' + data.error_code + ' ' + (data.error_msg || ''));
    return {
        translation: (data.trans_result && data.trans_result.map(x => x.dst).join('')) || ''
    };
}

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, CORS);
        return res.end();
    }
    if (req.method !== 'POST') {
        res.writeHead(405, CORS);
        return res.end('method not allowed');
    }

    let body = '';
    for await (const chunk of req) body += chunk;
    let p = {};
    try { p = JSON.parse(body || '{}'); } catch (_) { p = {}; }

    const text = String(p.text || '').trim();
    if (!text) {
        res.writeHead(400, { ...CORS, 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'text is required' }));
    }
    const from = p.from || 'auto';
    const to = p.to || 'zh';

    const result = { text, from, to, providers: {} };
    const tasks = [];
    if (process.env.YOUDAO_APP_KEY && process.env.YOUDAO_APP_SECRET) {
        tasks.push(translateYoudao(text, from, to).then(r => { result.providers.youdao = r; })
            .catch(e => { result.providers.youdao = { error: String(e && e.message || e) }; }));
    }
    if (process.env.BAIDU_APPID && process.env.BAIDU_SECRET) {
        tasks.push(translateBaidu(text, from, to).then(r => { result.providers.baidu = r; })
            .catch(e => { result.providers.baidu = { error: String(e && e.message || e) }; }));
    }
    await Promise.all(tasks);

    res.writeHead(200, { ...CORS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
};