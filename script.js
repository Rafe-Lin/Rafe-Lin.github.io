

document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');

    if (page === 'posts') {
        displayPostList();
    } else {
        displayMarkdownPage(page);
    }
});

function displayPostList() {
    const mainContent = document.getElementById('blog-content');
    const postsListContainer = document.getElementById('posts-list');

    mainContent.style.display = 'none';
    postsListContainer.style.display = 'block';

    fetch('posts.json')
        .then(response => response.json())
        .then(posts => {
            let postsHtml = '';
            posts.forEach(post => {
                const noImageClass = post.image ? '' : 'no-image';
                postsHtml += `
                    <div class="post-box ${noImageClass}">
                        ${post.image ? `<img src="${post.image}" alt="${post.title}" class="post-image">` : '<div class="post-image-placeholder"></div>'}
                        <div class="post-content">
                            <h2><a href="${post.link}">${post.title}</a></h2>
                            <p class="post-date">${post.date}</p>
                            <p class="post-description">${post.description}</p>
                        </div>
                    </div>
                `;
            });
            postsListContainer.innerHTML = postsHtml;
        })
        .catch(error => {
            console.error('Error fetching posts.json:', error);
            postsListContainer.innerHTML = '<p>Error loading posts. Please try again later.</p>';
        });
}

function displayMarkdownPage(page) {
    let markdownFile = "";
    if (page === "CV") {
        markdownFile = "src/CV.md";
    } else if (page === null) {
        markdownFile = "src/profile.md";
    } else {
        markdownFile = `posts/${page}.md`;
    }

    fetch(markdownFile)
        .then(response => {
            if (!response.ok) {
                throw new Error(`File not found: ${markdownFile}`);
            }
            return response.text();
        })
        .then(markdownText => {
            const htmlText = markdownToHtml(markdownText);
            document.getElementById('html-output').innerHTML = htmlText;
        })
        .catch(error => {
            console.error('Error fetching the Markdown file:', error);
            document.getElementById('html-output').innerHTML = `
                <h1 class="glow-text">404 - Not Found</h1>
                <p>The requested content could not be found.</p>
                <p><i>${error.message}</i></p>
            `;
        });
}

function markdownToHtml(markdown) {
    // The comprehensive markdown-to-HTML converter function
    // ... (This function remains unchanged from your original script.js)
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
            return `<pre><code class=\"language-${lang}\">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
        }},
        inlineCode: { pattern: "`([^`]+)`", flags: "gm", replacement: "<code>$1</code>" },
        link: { pattern: "(?<!\\!)\\\[([^\\\]]+)\\\]\\\(([^)]+)\\\)", flags: "gm", replacement: "<a href=\"$$2\" target=\"_blank\">$1</a>" },
        image: { pattern: "!\\\\[([^\\\]]*)\\\]\\\(([^)]+)\\\)", flags: "gm", replacement: "<img src=\"$$2\" alt=\"$$1\" />" },
        horizontalRule: { pattern: "^---", flags: "gm", replacement: "<hr />" },
        checkboxUnchecked: { pattern: "^\\s*\\- \\\[ \\\] (.*)$", flags: "gm", replacement: "<ul class=\"checkbox\"><li><input type=\"checkbox\" disabled/> $1</li></ul>" },
        checkboxChecked: { pattern: "^\\s*\\- \\\[x\\\], (.*)$", flags: "gm", replacement: "<ul class=\"checkbox\"><li><input type=\"checkbox\" disabled checked/> $1</li></ul>" },
        unorderedList: { pattern: "^(?!\\s*\\- \\[ \\\])(?!\\s*\\- \\[x\\])\\s*[\\*\\-\\] (.*)$", flags: "gm", replacement: "<ul><li>$1</li></ul>" },
        orderedList: { pattern: "^\\s*(\\d+)\\. (.*)$", flags: "gm", replacement: "<ol start=\"$$1\"><li>$2</li></ol>" },
        blockquote: { pattern: "^> (.*)$", flags: "gm", replacement: "<blockquote>$1</blockquote>" },
        table: {
            pattern: "^\\|(.+)\\|\\n\\|(?:-+\\|)+\\n((?:\\|.*\\|\\n)*)",
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

    for (const key of ["heading6", "heading5", "heading4", "heading3", "heading2", "heading1", "horizontalRule", "blockquote", "codeBlock", "table", "checkboxUnchecked", "checkboxChecked", "unorderedList", "orderedList"]) {
        const { pattern, flags, replacement } = patterns[key];
        const regex = new RegExp(pattern, flags);
        html = html.replace(regex, replacement);
    }
    
    html = html.replace(/<\/ul>\s*<ul>/gim, '');
    html = html.replace(/<\/ol>\s*<ol start=\"\d+\">/gim, '');

    let lines = html.split('\n');
    let result = '';
    let inParagraph = false;

    for(let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.match(/^<h[1-6]>/) || line.match(/^<hr/) || line.match(/^<blockquote/) || line.match(/^<pre/) || line.match(/^<ul/) || line.match(/^<ol/) || line.match(/^<li/) || line.match(/^<table/)) {
            if (inParagraph) {
                result += '</p>\n';
                inParagraph = false;
            }
            result += line + '\n';
        } else if (line.trim() === '') {
            if (inParagraph) {
                result += '</p>\n';
                inParagraph = false;
            }
        } else {
            if (!inParagraph) {
                result += '<p>';
                inParagraph = true;
            }
            result += line.trim() + ' ';
        }
    }
    if (inParagraph) {
        result += '</p>\n';
    }
    
    html = result;

    for (const key of ["bold", "italic", "strikethrough", "inlineCode", "link", "image"]) {
        const { pattern, flags, replacement } = patterns[key];
        const regex = new RegExp(pattern, flags);
        html = html.replace(regex, replacement);
    }

    return html.replace(/<p>\s*<\/p>/gim, '');
}
