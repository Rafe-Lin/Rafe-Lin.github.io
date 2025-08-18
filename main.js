document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcher = document.getElementById('theme-switcher');
    const themeIcon = themeSwitcher.querySelector('i');

    // Function to apply theme
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            document.body.classList.remove('dark-mode');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    };

    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // Event listener for the theme switcher button
    themeSwitcher.addEventListener('click', () => {
        const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });
});

// Fetch and display posts
fetch('posts.json')
    .then(response => response.json())
    .then(posts => {
        const postsList = document.getElementById('posts-list');
        if (postsList) {
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.innerHTML = `
                    <div class="post-box">
                        <div class="post-content">
                            <h2><a href="/?page=${post.filename.replace('.md', '')}">${post.title}</a></h2>
                            <p>${post.description}</p>
                            <div class="post-date">
                                <i class="far fa-calendar-alt calendar-icon"></i>
                                <span>${post.date}</span>
                            </div>
                        </div>
                        ${post.image ? `<img src="${post.image}" alt="${post.title}" class="post-image">` : ''}
                    </div>
                    <hr>
                `;
                postsList.appendChild(postElement);
            });
        }

        const urlParams = new URLSearchParams(window.location.search);
        const page = urlParams.get('page');

        if (page === 'posts') {
            document.getElementById('blog-content').style.display = 'none';
            postsList.style.display = 'block';
        } else {
            document.getElementById('blog-content').style.display = 'block';
            postsList.style.display = 'none';
        }
    })
    .catch(error => console.error('Error fetching posts:', error));
