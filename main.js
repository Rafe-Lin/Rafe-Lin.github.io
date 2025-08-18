document.addEventListener("DOMContentLoaded", function() {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');

    const blogContent = document.getElementById('blog-content');
    const postsList = document.getElementById('posts-list');
    const timelineContent = document.getElementById('timeline-page-content');
    const aboutMe = document.querySelector('.about-me');

    // Hide all content sections by default
    blogContent.style.display = 'none';
    postsList.style.display = 'none';
    if (timelineContent) timelineContent.style.display = 'none';

    // Show/hide About Me box
    if (page) {
        aboutMe.style.display = 'none';
    } else {
        aboutMe.style.display = 'block';
    }

    // Show the correct content section based on the page parameter
    if (page === 'posts') {
        postsList.style.display = 'flex';
        loadposts();
    } else if (page === 'timeline') {
        if (timelineContent) {
            timelineContent.style.display = 'block';
            loadTimeline();
        }
    } else {
        // Default view (CV, profile, or any other markdown page)
        blogContent.style.display = 'flex';
    }
});

function loadposts() {
    fetch('posts.json')
        .then(response => response.json())
        .then(posts => {
            const postsList = document.getElementById('posts-list');
            postsList.innerHTML = ''; // Clear previous content

            posts.forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.className = 'post-box';

                let imageHtml = '';
                if (post.image) {
                    imageHtml = `<img src="${post.image}" alt="${post.title}" class="post-image">`;
                }

                postDiv.innerHTML = `
                    ${imageHtml}
                    <div class="post-content">
                        <p class="post-date">${post.date}</p>
                        <h2><a href="${post.link}">${post.title}</a></h2>
                        <p>${post.description}</p>
                    </div>
                `;
                postsList.appendChild(postDiv);
            });
        })
        .catch(error => console.error('Error loading posts:', error));
}

function loadTimeline() {
    fetch('timeline.json')
        .then(response => response.json())
        .then(data => {
            const timelineContainer = document.getElementById('timeline-page-content');
            if (!timelineContainer) return;

            // Create a wrapper for the timeline itself to apply the ::before pseudo-element correctly
            timelineContainer.innerHTML = '<div class="timeline"></div>';
            const timeline = timelineContainer.querySelector('.timeline');

            data.forEach(event => {
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

                timeline.appendChild(timelineItem);
            });
        })
        .catch(error => console.error('Error fetching timeline data:', error));
}
