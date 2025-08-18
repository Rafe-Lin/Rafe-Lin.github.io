document.addEventListener("DOMContentLoaded", function() {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    const blogContent = document.getElementById('blog-content');
    const postsList = document.getElementById('posts-list');

    if (page === 'posts') {
        blogContent.style.display = 'none';
        postsList.style.display = 'flex';
        loadposts();
    } else {
        blogContent.style.display = 'flex';
        postsList.style.display = 'none';
    }
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

                // 如果不是最後一個文章，添加分割線
                if (index < posts.length - 1) {
                    const hr = document.createElement('hr');
                    postsList.appendChild(hr);
                }
            });
        })
        .catch(error => console.error('Error loading posts:', error));
}