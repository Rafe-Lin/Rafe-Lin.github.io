
document.addEventListener('DOMContentLoaded', () => {
    fetch('timeline.json')
        .then(response => response.json())
        .then(data => {
            const timelineContainer = document.getElementById('timeline-container');
            data.forEach(item => {
                const eventElement = document.createElement('div');
                eventElement.classList.add('timeline-event');

                eventElement.innerHTML = `
                    <span class="timeline-date">${item.date}</span>
                    <h2 class="timeline-title">${item.event}</h2>
                    <p class="timeline-description">${item.description}</p>
                `;

                timelineContainer.appendChild(eventElement);
            });
        })
        .catch(error => console.error('Error fetching timeline data:', error));
});
