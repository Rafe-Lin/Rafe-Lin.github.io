document.addEventListener("DOMContentLoaded", function() {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    const blogContent = document.getElementById('blog-content');
    const articlesList = document.getElementById('articles-list');

    if (page === 'articles') {
        blogContent.style.display = 'none';
        articlesList.style.display = 'flex';
        loadArticles();
    } else {
        blogContent.style.display = 'flex';
        articlesList.style.display = 'none';
    }
});

function loadArticles() {
    fetch('articles.json')
        .then(response => response.json())
        .then(articles => {
            const articlesList = document.getElementById('articles-list');
            articlesList.innerHTML = '';

            articles.forEach((article, index) => {
                const articleDiv = document.createElement('div');
                articleDiv.className = 'article-box';
                articleDiv.innerHTML = `
                    <div class="article-content">
                        <h2><a href="${article.link}">${article.title}</a></h2>
                        <p class="article-date"><i class="fas fa-calendar-alt calendar-icon"></i> ${article.date}</p>
                        <p>${article.description}</p>
                    </div>
                `;

                // 如果照片欄位不為 null，添加照片
                if (article.image) {
                    const img = document.createElement('img');
                    img.src = article.image;
                    img.alt = article.title;
                    img.className = 'article-image';
                    articleDiv.appendChild(img);
                }

                articlesList.appendChild(articleDiv);

                // 如果不是最後一個文章，添加分割線
                if (index < articles.length - 1) {
                    const hr = document.createElement('hr');
                    articlesList.appendChild(hr);
                }
            });
        })
        .catch(error => console.error('Error loading articles:', error));
}