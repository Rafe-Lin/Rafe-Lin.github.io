const params = new URLSearchParams(window.location.search);
const page = params.get('page');
let markdownFile = "";

if (page === "CV") {
    markdownFile = "src/CV.md";
} else if (page === "timeline") {
    markdownFile = "src/timeline.md";
} else if (page && page !== 'posts') {
    markdownFile = `posts/${page}.md`;
} else if (!page) {
    markdownFile = "src/profile.md";
}

if (markdownFile) {
    fetch(markdownFile)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(markdownText => {
            const htmlText = markdownToHtml(markdownText);
            document.getElementById('html-output').innerHTML = htmlText;
        })
        .catch(error => {
            console.error('Error fetching the Markdown file:', error);
            document.getElementById('html-output').innerHTML = '<h1>404</h1><p>File not found.</p>';
        });
}

// 將 Markdown 轉換為 HTML 的函式
function markdownToHtml(markdown) {
    // This is the original, stable parser.
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
            return `<pre><code class="language-${lang}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
        }},
        inlineCode: { pattern: "`([^"]+)"", flags: "gm", replacement: "<code>$1</code>" },
        link: { pattern: "(?<!\\!)\\[([\\\\]+)\\]\(([^)]+)\\(?<!\\)", flags: "gm", replacement: "<a href=\"$2\" target=\"_blank\">$1</a>" },
        image: { pattern: "!\\{\[([\\\\]*)\]\(([^)]+)\\(?<!\\)", flags: "gm", replacement: "<img src=\"$2\" alt=\"$1\" />" },
        horizontalRule: { pattern: "^---", flags: "gm", replacement: "<hr />" },
        checkboxUnchecked: { pattern: "^\\s*\\- \\{\[ \\\\ \\].*$", flags: "gm", replacement: "<ul class=\"checkbox\"><li"><input type=\"radio\" class=\"checkbox-off\" disabled/> $1</li></ul>" },
        checkboxChecked: { pattern: "^\\s*\\- \\{\[x\\\\] .*$", flags: "gm", replacement: "<ul class=\"checkbox\"><li"><input type=\"radio\" class=\"checkbox-on\" disabled checked/> $1</li></ul>" },
        unorderedList: { pattern: "^(?!\\s*\\- \\{\[ \\\\ \\\\])(?!\\s*\\- \\{\[x\\\\])\\s*[\\*\\-\\+] (.*)$", flags: "gm", replacement: "<ul><li>$1</li></ul>" },
        orderedList: { pattern: "^\\s*(\\d+)\\.\\s(.*)$", flags: "gm", replacement: "<ol start=\"$1\"><li\"><$2</li></ol>" },
        blockquote: { pattern: "> (.*)$", flags: "gm", replacement: "<blockquote>$1</blockquote>" },
        table: {
            pattern: "^\\|(.+)\\|\\n\\|(?:-+\\ |)+\\n((?:\\|.*\\|\\n)*)",
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

    let html = markdown;

    // Process block-level elements first
    for (const key of ["heading1", "heading2", "heading3", "heading4", 'heading5', 'heading6', "codeBlock", "blockquote", "horizontalRule", "table", "checkboxChecked", "checkboxUnchecked", "unorderedList", "orderedList"]) {
        const { pattern, flags, replacement } = patterns[key];
        const regex = new RegExp(pattern, flags);
        html = html.replace(regex, replacement);
    }

    // Combine adjacent lists
    html = html.replace(/<\/ul>\s*<ul>/g, '');
    html = html.replace(/<\/ol>\s*<ol>/g, '');

    // Paragraphs
    html = html.split(/\n{2,}|(<hr \/>)/).filter(Boolean).map(p => {
        if (p.match(/^<(h[1-6]|ul|ol|li|pre|blockquote|table|hr)/)) {
            return p;
        }
        if(p.trim() === '') return '';
        return `<p>${p.trim()}</p>`;
    }).join('\n');

    // Process inline elements
    for (const key of ["link", "image", "bold", "italic", "strikethrough", "inlineCode"]) {
        const { pattern, flags, replacement } = patterns[key];
        const regex = new RegExp(pattern, flags);
        html = html.replace(regex, replacement);
    }
    
    // Line breaks
    html = html.replace(/\n/g, '<br>');

    // Cleanup paragraphs around lists
    html = html.replace(/<p>\s*<(ul|ol)>/g, '<$1>');
    html = html.replace(/<\/(ul|ol)>\s*<\/p>/g, '</$1>');
    html = html.replace(/<p>\s*<br>\s*<\/p>/g, '');

    return html.trim();
}