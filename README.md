# sql-helper

<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SQL 批量加引号助手（支持缩进）</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            max-width: 860px;
            margin: 30px auto;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        h2 { margin-top: 0; color: #1e293b; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        h2 small { font-size: 14px; font-weight: normal; color: #64748b; }
        .row { display: flex; flex-wrap: wrap; gap: 12px 20px; margin: 12px 0; align-items: center; }
        .form-group { display: flex; align-items: center; gap: 6px 12px; flex-wrap: wrap; background: white; padding: 6px 16px; border-radius: 30px; border: 1px solid #e2e8f0; }
        .form-group label { cursor: pointer; font-weight: 500; color: #334155; display: flex; align-items: center; gap: 4px; }
        textarea {
            width: 100%;
            height: 160px;
            padding: 14px;
            font-size: 14px;
            font-family: 'Courier New', monospace;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            background: white;
            transition: 0.2s;
            resize: vertical;
        }
        textarea:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.2); }
        .btn-group { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0; }
        .btn {
            padding: 8px 20px;
            font-size: 14px;
            font-weight: 600;
            border: none;
            border-radius: 30px;
            cursor: pointer;
            transition: all 0.15s;
            background: #e2e8f0;
            color: #1e293b;
        }
        .btn-primary { background: #3b82f6; color: white; }
        .btn-primary:hover { background: #2563eb; transform: translateY(-1px); }
        .btn-success { background: #10b981; color: white; }
        .btn-success:hover { background: #059669; transform: translateY(-1px); }
        .btn-warning { background: #f59e0b; color: white; }
        .btn-warning:hover { background: #d97706; }
        .btn-outline { background: transparent; border: 2px solid #cbd5e1; }
        .btn-outline:hover { background: #f1f5f9; }
        .btn-danger { background: #ef4444; color: white; }
        .btn-danger:hover { background: #dc2626; }
        .output-box {
            background: #0f172a;
            color: #e2e8f0;
            padding: 18px;
            border-radius: 12px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            white-space: pre-wrap;
            word-break: break-all;
            min-height: 100px;
            max-height: 350px;
            overflow-y: auto;
            margin-top: 8px;
            position: relative;
        }
        .output-box .placeholder { color: #64748b; font-style: italic; }
        .status-bar { display: flex; justify-content: flex-start; align-items: center; margin-top: 8px; color: #64748b; font-size: 13px; gap: 12px; flex-wrap: wrap; }
        .badge { background: #e2e8f0; padding: 2px 12px; border-radius: 20px; font-weight: 600; color: #1e293b; }
        .inline-flex { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        input[type="radio"] { accent-color: #3b82f6; width: 16px; height: 16px; margin: 0; }
        input[type="checkbox"] { accent-color: #3b82f6; width: 16px; height: 16px; margin: 0; }
        input[type="number"] { width: 60px; padding: 4px 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; }
        hr { border: none; border-top: 2px dashed #e2e8f0; margin: 20px 0; }
        .tip { background: #fef3c7; padding: 10px 16px; border-radius: 10px; color: #92400e; font-size: 14px; border-left: 4px solid #f59e0b; margin-bottom: 12px; }
        .indent-group { display: flex; align-items: center; gap: 6px; }
        .indent-group label { font-weight: 500; color: #334155; }

        /* 结果标题行：flex 布局，让复制按钮靠右 */
        .result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 10px 0 6px;
        }
        .result-header label {
            font-weight: 600;
            margin: 0;
        }
        .result-header .btn-success {
            padding: 6px 24px;
        }
    </style>
</head>
<body>

<h2>🧰 SQL 值批量包裹工具 <small>单引号 / 双引号 · 自定义缩进</small></h2>

<div class="tip">
    💡 支持按 <strong>换行</strong>、<strong>逗号</strong>、<strong>空格</strong>、<strong>制表符</strong> 分隔的原始数据。<br>
    ✨ <strong>缩进空格数</strong>：在每行值前添加指定数量的空格，方便 SQL 格式化（设为 0 则不缩进）。
</div>

<!-- 输入区 -->
<label style="font-weight:600; display:block; margin: 15px 0 6px;">📥 粘贴原始数据：</label>
<textarea id="inputData" placeholder="例如：P76DMWPAW4, P76DMWPAW6, P76AMKTK39 ... 或每行一个"></textarea>

<!-- 操作选项栏 -->
<div class="row">
    <div class="form-group">
        <span style="font-weight:500;">引用符号：</span>
        <label><input type="radio" name="quoteType" value="single" checked> 单引号 <code>' '</code></label>
        <label><input type="radio" name="quoteType" value="double"> 双引号 <code>" "</code></label>
    </div>

    <div class="form-group">
        <label><input type="checkbox" id="wrapInClause" checked> 包裹成 <code>IN (...)</code></label>
    </div>

    <div class="form-group">
        <label><input type="checkbox" id="removeDuplicates"> 去重</label>
    </div>

    <div class="form-group indent-group">
        <label for="indentSpaces">缩进空格数：</label>
        <input type="number" id="indentSpaces" value="4" min="0" max="20" step="1">
    </div>
</div>

<!-- 操作按钮 -->
<div class="btn-group">
    <button class="btn btn-primary" onclick="convert()">✨ 生成</button>
    <button class="btn btn-warning" onclick="changeCase('upper')">🔠 转大写</button>
    <button class="btn btn-warning" onclick="changeCase('lower')">🔡 转小写</button>
    <button class="btn btn-outline" onclick="clearAll()">🗑️ 清空</button>
</div>

<!-- 结果区域：标题行 + 复制按钮 -->
<div class="result-header">
    <label>📋 结果：</label>
    <button class="btn btn-success" onclick="copyResult()">📄 一键复制</button>
</div>

<!-- 输出框 -->
<div class="output-box" id="output"><span class="placeholder">等待生成...</span></div>

<!-- 状态栏（只保留状态信息） -->
<div class="status-bar">
    <span id="statusInfo">📊 就绪</span>
</div>

<hr>
<p style="font-size:13px; color:#94a3b8; margin:0;">
    ⚡ 快捷操作：在输入框按 <kbd>Ctrl+Enter</kbd>（Mac <kbd>⌘+Enter</kbd>）快速生成。
</p>

<script>
    function getQuoteChar() {
        return document.querySelector('input[name="quoteType"]:checked').value === 'single' ? "'" : '"';
    }

    function getIndent() {
        const val = parseInt(document.getElementById('indentSpaces').value, 10);
        return isNaN(val) || val < 0 ? 0 : val;
    }

    function parseInput() {
        const raw = document.getElementById('inputData').value;
        let items = raw.split(/[\n,，、\t\s]+/).map(s => s.trim()).filter(s => s !== '');
        if (document.getElementById('removeDuplicates').checked) {
            items = [...new Set(items)];
        }
        return items;
    }

    function convert() {
        const items = parseInput();
        const outputDiv = document.getElementById('output');
        const statusSpan = document.getElementById('statusInfo');

        if (items.length === 0) {
            outputDiv.innerHTML = '<span class="placeholder">⚠️ 未检测到有效数据</span>';
            statusSpan.textContent = '📊 无数据';
            return;
        }

        const quote = getQuoteChar();
        const indent = getIndent();
        const indentStr = ' '.repeat(indent);

        const wrapped = items.map(item => `${indentStr}${quote}${item}${quote}`);
        let result = wrapped.join(',\n');

        if (document.getElementById('wrapInClause').checked) {
            result = `IN (\n${result}\n)`;
        }

        outputDiv.textContent = result;
        statusSpan.textContent = `✅ 共 ${items.length} 条记录，缩进 ${indent} 空格`;
    }

    function changeCase(type) {
        const input = document.getElementById('inputData');
        const current = input.value;
        if (!current.trim()) return;
        input.value = type === 'upper' ? current.toUpperCase() : current.toLowerCase();
        convert();
    }

    function clearAll() {
        document.getElementById('inputData').value = '';
        document.getElementById('output').innerHTML = '<span class="placeholder">等待生成...</span>';
        document.getElementById('statusInfo').textContent = '📊 就绪';
    }

    function copyResult() {
        const outputDiv = document.getElementById('output');
        const text = outputDiv.textContent;
        if (!text || text.includes('等待生成') || text.includes('未检测到')) {
            alert('没有可复制的内容，请先生成！');
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showCopyFeedback('✅ 已复制到剪贴板！');
            }).catch(() => {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const outputDiv = document.getElementById('output');
        const range = document.createRange();
        range.selectNode(outputDiv);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        try {
            document.execCommand('copy');
            showCopyFeedback('✅ 已复制到剪贴板！');
        } catch (e) {
            alert('复制失败，请手动选中结果框内容复制。');
        }
        window.getSelection().removeAllRanges();
    }

    function showCopyFeedback(msg) {
        const btn = document.querySelector('.result-header .btn-success');
        const origText = btn.textContent;
        btn.textContent = msg;
        btn.style.background = '#22c55e';
        setTimeout(() => {
            btn.textContent = origText;
            btn.style.background = '';
        }, 2000);
    }

    // 快捷键 Ctrl+Enter 生成
    document.getElementById('inputData').addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            convert();
        }
    });

    // 自动重新生成
    document.querySelectorAll('input[type="radio"], input[type="checkbox"], input[type="number"]').forEach(el => {
        el.addEventListener('change', function() {
            const outputDiv = document.getElementById('output');
            if (outputDiv.textContent && !outputDiv.textContent.includes('等待生成') && !outputDiv.textContent.includes('未检测到')) {
                convert();
            }
        });
    });
</script>

</body>
</html>
