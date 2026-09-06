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

            // 隨捲動長出來的進度線
            const progress = document.createElement('div');
            progress.className = 'timeline-progress';
            timelineContainer.appendChild(progress);

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

            initTimelineReveal(timelineContainer, progress);
        })
        .catch(error => console.error('Error fetching timeline data:', error));
}

// 讓時間軸隨著使用者捲動逐項展開
function initTimelineReveal(container, progress) {
    const items = Array.from(container.querySelectorAll('.timeline-item'));
    if (!items.length) return;

    // 使用者若在系統設定關閉動效，就直接全部顯示
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        items.forEach(el => el.classList.add('is-visible'));
        progress.style.height = '100%';
        return;
    }

    const revealAll = () => items.forEach(el => el.classList.add('is-visible'));

    // 一、逐項淡入：同一畫面內出現的項目依序延遲，做出接力感
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries
                .filter(e => e.isIntersecting)
                .sort((a, b) => items.indexOf(a.target) - items.indexOf(b.target))
                .forEach((entry, i) => {
                    entry.target.style.setProperty('--reveal-delay', (i * 0.11) + 's');
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                });
        }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

        items.forEach(el => observer.observe(el));

        // 保險：項目的初始狀態是 opacity:0，萬一 observer 沒回呼
        // （某些瀏覽器、擴充套件或分頁未實際繪製時會發生），
        // 內容就會永遠看不見。1.2 秒後若一項都沒亮，直接全部顯示。
        setTimeout(() => {
            if (!container.querySelector('.timeline-item.is-visible')) revealAll();
        }, 1200);
    } else {
        revealAll();
    }

    // 二、進度線：隨捲動由上往下長出來
    //
    // 兩套算法取較大者：
    //  (a) 自然：視窗中線走到時間軸的哪裡，線就長到哪裡 —— 手感跟著捲動走。
    //  (b) 保底：從載入時的長度線性拉到 100%。
    // 只有 (a) 的話，項目太少 / 頁面捲不了多遠時，中線永遠走不到時間軸底部，
    // 進度線就會卡在半路填不滿；(b) 保證「捲到底 = 滿格」。
    // 頁面夠長時 (a) 一路領先，(b) 只在最後一刻追平，所以不影響原本的手感。
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    let scrollTimer = null;
    const updateProgress = () => {
        const vh = window.innerHeight;
        // 版面還沒定案時（某些預覽環境載入初期會回報 0）量到的數字沒有意義，
        // 照著算會誤判成「頁面不能捲動」而直接把進度線填滿
        if (vh < 100) return;

        const rect = container.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const total = Math.max(0, rect.height - 16);   // 扣掉 CSS 的 top/bottom 各 8px
        const mid = vh * 0.55;                         // 視窗偏中間一點的判定線

        const docH = Math.max(
            document.documentElement.scrollHeight,
            document.body ? document.body.scrollHeight : 0
        );
        const scrollable = Math.max(0, docH - vh);
        const t = scrollable > 1 ? clamp(scrollY / scrollable, 0, 1) : 1;

        const natural = clamp(mid - rect.top - 8, 0, total);
        const start = clamp(mid - (rect.top + scrollY) - 8, 0, total);  // 捲動量為 0 時的長度
        const stretched = start + (total - start) * t;

        progress.style.height = Math.max(natural, stretched) + 'px';

        container.classList.add('is-scrolling');
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => container.classList.remove('is-scrolling'), 700);
    };

    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            updateProgress();
            ticking = false;
        });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    // 卡片高度要等字型與版面定案才準，補算幾次
    updateProgress();
    [80, 400, 1200].forEach(ms => setTimeout(updateProgress, ms));
    if (window.ResizeObserver) new ResizeObserver(updateProgress).observe(container);
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