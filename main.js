// main.js - 完整的 DOMContentLoaded 事件監聽器

document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    const blogContent = document.getElementById('blog-content');
    const postsList = document.getElementById('posts-list');
    const timelineContainer = document.getElementById('timeline-container');
    const aboutMeBox = document.querySelector('.about-me');
    const container = document.querySelector('.container');
    const pageMain = document.querySelector('.page-main');

    // 如果 URL 參數中有 'page'，就隱藏作者介紹，並讓主內容區塊變寬
    if (page) {
        aboutMeBox.style.display = 'none';
        pageMain.classList.add('full-width');
    }

    // 頁面內容切換邏輯
    if (page === 'posts') {
        blogContent.style.display = 'none';
        postsList.style.display = 'flex';
        timelineContainer.style.display = 'none';
        loadposts();
    } else if (page === 'timeline') {
        blogContent.style.display = 'none';
        postsList.style.display = 'none';
        timelineContainer.style.display = 'block';
        loadTimeline();
        loadCss('timeline.css');
        loadScript('timeline-particles.js');
    } else {
        blogContent.style.display = 'flex';
        postsList.style.display = 'none';
        timelineContainer.style.display = 'none';
    }

    // 淡入顯示內容
    container.classList.add('loaded');
});

function loadposts() {
    fetch('posts.json')
        .then(response => response.json())
        .then(posts => {
            const postsList = document.getElementById('posts-list');
            postsList.innerHTML = '';

            posts.forEach((post, index) => {
                const postDiv = document.createElement('div');
                postDiv.className = 'post-box';
                postDiv.innerHTML = `
                    <div class="post-content">
                        <h2><a href="${post.link}">${post.title}</a></h2>
                        <p class="post-date"><i class="fas fa-calendar-alt calendar-icon"></i> ${post.date}</p>
                        <p>${post.description}</p>
                    </div>
                `;

                // 如果照片欄位不為 null，添加照片
                if (post.image) {
                    const img = document.createElement('img');
                    img.src = post.image;
                    img.alt = post.title;
                    img.className = 'post-image';
                    postDiv.appendChild(img);
                }

                postsList.appendChild(postDiv);


            });
        })
        .catch(error => console.error('Error loading posts:', error));
}

function loadTimeline() {
    fetch('timeline.json')
        .then(response => response.json())
        .then(data => {
            const timelineContainer = document.getElementById('timeline-container');
            if (!timelineContainer) return;
            timelineContainer.innerHTML = ''; // Clear previous content

            data.forEach((event, index) => {
                const timelineItem = document.createElement('div');
                timelineItem.className = 'timeline-item';

                const timelineDot = document.createElement('div');
                timelineDot.className = 'timeline-dot';

                const timelineContent = document.createElement('div');
                timelineContent.className = 'timeline-content';

                const timelineDate = document.createElement('span');
                timelineDate.className = 'timeline-date';
                timelineDate.textContent = event.date;

                const timelineTitle = document.createElement('h2');
                timelineTitle.className = 'timeline-title';
                timelineTitle.textContent = event.title;

                const timelineDescription = document.createElement('p');
                timelineDescription.className = 'timeline-description';
                timelineDescription.textContent = event.description;

                timelineContent.appendChild(timelineDate);
                timelineContent.appendChild(timelineTitle);
                timelineContent.appendChild(timelineDescription);

                timelineItem.appendChild(timelineDot);
                timelineItem.appendChild(timelineContent);

                timelineContainer.appendChild(timelineItem);
            });
        })
        .catch(error => console.error('Error fetching timeline data:', error));
}

function loadCss(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
}

function loadScript(src) {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.body.appendChild(script);
}