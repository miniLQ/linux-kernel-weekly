// Markdown 渲染配置
marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: true,
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(code, { language: lang }).value;
            } catch (err) {}
        }
        return code;
    }
});

// 自定义渲染器
const renderer = new marked.Renderer();

// 自定义标题渲染
renderer.heading = function(text, level) {
    const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
    return `
        <h${level} id="${escapedText}">
            ${text}
            <a href="#${escapedText}" class="header-link">
                <i class="fas fa-link"></i>
            </a>
        </h${level}>
    `;
};

// 自定义代码块渲染
renderer.code = function(code, lang, escaped) {
    if (lang) {
        return `
            <div class="code-block">
                <div class="code-header">
                    <span class="lang-label">${lang}</span>
                    <button class="copy-btn" onclick="copyCode(this)">
                        <i class="far fa-copy"></i>
                    </button>
                </div>
                <pre><code class="hljs language-${lang}">${escaped ? code : escapeHtml(code)}</code></pre>
            </div>
        `;
    }
    return `<pre><code>${escaped ? code : escapeHtml(code)}</code></pre>`;
};

// 应用自定义渲染器
marked.use({ renderer });

// 辅助函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 复制代码功能
function copyCode(button) {
    const codeBlock = button.closest('.code-block');
    const code = codeBlock.querySelector('code').textContent;
    
    navigator.clipboard.writeText(code).then(() => {
        const originalIcon = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.innerHTML = originalIcon;
            button.classList.remove('copied');
        }, 2000);
    });
}

// 渲染 Markdown
function renderMarkdown(elementId, markdown) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    try {
        const html = marked.parse(markdown);
        const cleanHtml = DOMPurify.sanitize(html);
        element.innerHTML = cleanHtml;
        
        // 高亮代码块
        hljs.highlightAll();
        
        // 为所有标题添加锚点链接
        element.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(header => {
            const id = header.id;
            if (id) {
                const link = header.querySelector('.header-link');
                if (!link) {
                    const link = document.createElement('a');
                    link.href = `#${id}`;
                    link.className = 'header-link';
                    link.innerHTML = '<i class="fas fa-link"></i>';
                    header.appendChild(link);
                }
            }
        });
        
        // 为所有链接添加 target="_blank"
        element.querySelectorAll('a[href^="http"]').forEach(link => {
            if (!link.target) {
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            }
        });
        
    } catch (error) {
        console.error('Error rendering markdown:', error);
        element.innerHTML = `<div class="error">渲染失败: ${error.message}</div>`;
    }
}

// 加载并渲染 Markdown 文件
async function loadAndRenderMarkdown(url, elementId) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const markdown = await response.text();
        renderMarkdown(elementId, markdown);
        
    } catch (error) {
        console.error('Error loading markdown:', error);
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>加载失败</h3>
                    <p>无法加载报告内容: ${error.message}</p>
                </div>
            `;
        }
    }
}