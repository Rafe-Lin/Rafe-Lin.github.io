const params = new URLSearchParams(window.location.search);
var markdownFile = "";
if (params.get('page') == "CV") {
    markdownFile = "src/CV.md";
} else if(params.get('page') == null){
    markdownFile = "src/profile.md";
} else {
    markdownFile = "articles/" + params.get('page') + ".md"
}

// 使用 fetch API 讀取 Markdown 文件內容
fetch(markdownFile)
    .then(response => response.text())
    .then(markdownText => {
        // 將 Markdown 轉換為 HTML
        const htmlText = markdownToHtml(markdownText);

        // 顯示轉換後的 HTML
        document.getElementById('html-output').innerHTML = htmlText;
    })
    .catch(error => console.error('Error fetching the Markdown file:', error));

// 將 Markdown 轉換為 HTML 的函式
function markdownToHtml(markdown) {
    // 定義正則表達式模式和標誌
    const patterns = {
        heading6: { pattern: "^###### (.*)$", flags: "gm", replacement: "<h6>$1</h6>" },
        heading5: { pattern: "^##### (.*)$", flags: "gm", replacement: "<h5>$1</h5>" },
        heading4: { pattern: "^#### (.*)$", flags: "gm", replacement: "<h4>$1</h4>" },
        heading3: { pattern: "^### (.*)$", flags: "gm", replacement: "<h3>$1</h3>" },
        heading2: { pattern: "^## (.*)$", flags: "gm", replacement: "<h2>$1</h2>" },
        heading1: { pattern: "^# (.*)$", flags: "gm", replacement: "<h1>$1</h1>" },
        bold: { pattern: "\\*\\*(.*?)\\*\\*", flags: "gm", replacement: "<b>$1</b>" },
        italic: { pattern: "\\*(.*?)\\*", flags: "gm", replacement: "<i>$1</i>" },
        strikethrough: { pattern: "~~(.*?)~~", flags: "gm", replacement: "<del>$1</del>" },
        codeBlock: { pattern: "```([a-z]*)\\n([\\s\\S]*?)```", flags: "gm", replacement: function(match, lang, code) {
            return `<pre><code class="language-${lang}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</code></pre>`;
        }},
        inlineCode: { pattern: "`([^`]+)`", flags: "gm", replacement: "<code>$1</code>" },
        // 使用前瞻確保不是圖片
        link: { pattern: "(?<!\\!)\\\[([^\\\]]+)\\\]\\\(([^)]+)\\\)", flags: "gm", replacement: "<a href=\"$2\" target=\"_blank\">$1</a>" },        image: { pattern: "!\\\[([^\\\]]*)\\\]\\\(([^)]+)\\\)", flags: "gm", replacement: "<img src=\"$2\" alt=\"$1\" />" },
        horizontalRule: { pattern: "^---$", flags: "gm", replacement: "<hr />" },
        // 處理檢核方塊，先於無序列表
        checkboxUnchecked: { pattern: "^\\s*\\- \\\[ \\\] (.*)$", flags: "gm", replacement: "<ul class=\"checkbox\"><li><input type=\"radio\" class=\"checkbox-off\" disabled/> $1</li></ul>" },
        checkboxChecked: { pattern: "^\\s*\\- \\\[x\\\] (.*)$", flags: "gm", replacement: "<ul class=\"checkbox\"><li><input type=\"radio\" class=\"checkbox-on\" disabled checked/> $1</li></ul>" },// 處理無序列表，匹配星號、連字號和加號，允許前面有空格
        unorderedList: { pattern: "^(?!\\s*\\- \\[ \\])(?!\\s*\\- \\[x\\])\\s*[\\*\\-\\+] (.*)$", flags: "gm", replacement: "<ul><li>$1</li></ul>" },
        orderedList: { pattern: "^\\s*(\\d+)\\. (.*)$", flags: "gm", replacement: "<ol start=\"$1\"><li>$2</li></ol>" },
        blockquote: { pattern: "^> (.*)$", flags: "gm", replacement: "<blockquote>$1</blockquote>" },
        // 處理兩個或更多換行符號
        paragraphBreak: { pattern: "\n{2,}", flags: "gm", replacement: "</p><p>" },
        // 處理行尾有兩個或更多空格的換行符號
        lineBreakWithSpaces: { pattern: " {2,}\n", flags: "gm", replacement: "<br>" },
        // 處理單個換行符號
        lineBreak: { pattern: "(?<!<br>)\n", flags: "gm", replacement: " <br>" },
        table: {
            pattern: "^\\|(.+)\\|\n\\|(?:-+\\|)+\n((?:\\|.*\\|\\n)*)",
            flags: "gm",
            replacement: function(match, header, body) {
                const headers = header.split('|').map(h => `<th>${h.trim()}</th>`).join('');
                const rows = body.trim().split('\n').map(row => {
                    const cells = row.split('|').filter(c => c.trim() !== '').map(c => `<td>${c.trim()}</td>`).join('');
                    return `<tr>${cells}</tr>`;
                }).join('');
                return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
            }
        }
    };

    for (const key of ["heading6", "heading5", "heading4", "heading3", "heading2", "heading1", "horizontalRule", "blockquote", "codeBlock", "unorderedList", "orderedList", "checkboxUnchecked", "checkboxChecked", "table"]) {
        const { pattern, flags, replacement } = patterns[key];
        const regex = new RegExp(pattern, flags);
        markdown = markdown.replace(regex, replacement);
    }

    // 處理段落和換行
    const lines = markdown.split('\n');
    let inParagraph = false;
    let result = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line === '') {
            if (inParagraph) {
                result += '</p>';
                inParagraph = false;
            }
        } else if (!line.match(/^(<h[1-6]>|<hr>|<blockquote>|<pre>|<ul>|<ol>|<li>|<table>|<\/table>|<tr>|<\/tr>|<th>|<\/th>|<td>|<\/td>)/)) {
            if (!inParagraph) {
                result += '<p>';
                inParagraph = true;
            }
            result += line + ' ';
        } else {
            if (inParagraph) {
                result += '</p>';
                inParagraph = false;
            }
            result += line;
        }
    }

    if (inParagraph) {
        result += '</p>';
    }

    // 再處理其他元素
    for (const key of ["bold", "italic", "strikethrough", "inlineCode", "link", "image", "paragraphBreak", "lineBreakWithSpaces", "lineBreak"]) {
        const { pattern, flags, replacement } = patterns[key];
        const regex = new RegExp(pattern, flags);
        result = result.replace(regex, replacement);
    }

    // 合併連續的 <ul> 和 <ol> 列表項
    result = result.replace(/<\/ul>\s*<ul>/gim, '');
    result = result.replace(/<\/ol>\s*<ol start="\d+">/gim, '');

    // 移除多餘的 <p> 標籤，包括那些包含空白字符的情況
    result = result.replace(/<p>\s*<\/p>/gim, '');

    return result.trim();
}