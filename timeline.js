document.addEventListener('DOMContentLoaded', () => {
    fetch('timeline.json')
        .then(response => response.json())
        .then(data => {
            const timelineContainer = document.getElementById('timeline-container');
            if (!timelineContainer) return;

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
});
