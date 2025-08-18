
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results');
    let posts = [];

    // Fetch posts data
    fetch('posts.json')
        .then(response => response.json())
        .then(data => {
            posts = data;
        })
        .catch(error => console.error('Error fetching posts:', error));

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        if (query.length > 0) {
            const filteredPosts = posts.filter(post => 
                post.title.toLowerCase().includes(query) || 
                post.description.toLowerCase().includes(query)
            );
            displayResults(filteredPosts);
        } else {
            searchResultsContainer.style.display = 'none';
        }
    });

    function displayResults(results) {
        if (results.length > 0) {
            const resultsHtml = results.map(post => 
                `<a href="${post.link}">${post.title}</a>`
            ).join('');
            searchResultsContainer.innerHTML = resultsHtml;
            searchResultsContainer.style.display = 'block';
        } else {
            searchResultsContainer.innerHTML = '<a href="#">No results found</a>';
            searchResultsContainer.style.display = 'block';
        }
    }

    // Hide results when clicking outside
    document.addEventListener('click', (event) => {
        if (!searchResultsContainer.contains(event.target) && event.target !== searchInput) {
            searchResultsContainer.style.display = 'none';
        }
    });
});
