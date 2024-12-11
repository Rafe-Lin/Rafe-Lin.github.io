document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');

    fetch('posts.json')
        .then(response => response.json())
        .then(posts => {
            let keywords = new Set();

            if (page) {
                // 找到對應的 post
                const post = posts.find(p => p.link.includes(page));
                if (post && post.keywords) {
                    post.keywords.forEach(keyword => keywords.add(keyword));
                }
            } else {
                // 如果沒有指定 page，使用所有關鍵字
                posts.forEach(post => {
                    if (post.keywords) {
                        post.keywords.forEach(keyword => keywords.add(keyword));
                    }
                });
            }

            const metaKeywords = document.createElement('meta');
            metaKeywords.name = 'keywords';
            metaKeywords.content = Array.from(keywords).join(', ');

            document.head.appendChild(metaKeywords);
        })
        .catch(error => console.error('Error loading posts.json:', error));
});