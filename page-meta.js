// page-meta.js — 依照 ?page= 設定這一頁真正的 title / description / keywords / canonical
//
// 為什麼需要這支：整站只有一個 index.html，如果 <title> 和 <link rel="canonical">
// 寫死在 HTML 裡，每一篇文章都會宣稱「我叫 y0tta's Blog，而且我的正式網址是首頁」，
// 分享出去的預覽卡片會全部長一樣，搜尋引擎也會把文章頁當成首頁的重複內容。
(function () {
    'use strict';

    var SITE = "y0tta's Blog";
    var ORIGIN = 'https://rafe-lin.github.io';

    // 非文章頁的固定描述
    var STATIC_PAGES = {
        '': { title: SITE, desc: 'y0tta 的個人部落格：資安、競賽、AI 與各種踩坑紀錄。' },
        'posts': { title: '文章列表 | ' + SITE, desc: '所有文章一覽：資安筆記、比賽心得與技術踩坑。' },
        'CV': { title: 'Experience | ' + SITE, desc: 'y0tta 的經歷、競賽成績與社團幹部紀錄。' },
        'timeline': { title: 'Timeline | ' + SITE, desc: '依時間排列的比賽與學習軌跡。' }
    };

    function upsertMeta(attr, name, content) {
        if (!content) return;
        var el = document.head.querySelector('meta[' + attr + '="' + name + '"]');
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attr, name);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    }

    function setCanonical(href) {
        var el = document.head.querySelector('link[rel="canonical"]');
        if (!el) {
            el = document.createElement('link');
            el.rel = 'canonical';
            document.head.appendChild(el);
        }
        el.href = href;
    }

    function apply(meta) {
        document.title = meta.title;
        upsertMeta('name', 'description', meta.desc);
        upsertMeta('name', 'keywords', meta.keywords);

        // 分享到 LINE / Discord / Facebook 時的預覽卡片
        upsertMeta('property', 'og:type', meta.page ? 'article' : 'website');
        upsertMeta('property', 'og:site_name', SITE);
        upsertMeta('property', 'og:title', meta.title);
        upsertMeta('property', 'og:description', meta.desc);
        upsertMeta('property', 'og:url', meta.canonical);
        upsertMeta('name', 'twitter:card', meta.image ? 'summary_large_image' : 'summary');
        if (meta.image) {
            upsertMeta('property', 'og:image', meta.image);
            upsertMeta('name', 'twitter:image', meta.image);
        }

        setCanonical(meta.canonical);
    }

    document.addEventListener('DOMContentLoaded', function () {
        var page = new URLSearchParams(window.location.search).get('page') || '';

        // canonical 一律指向主站的 ?page= 網址（share.html 也是），
        // 這樣同一篇文章的兩個入口不會被當成兩份重複內容
        var canonical = page
            ? ORIGIN + '/?page=' + encodeURIComponent(page)
            : ORIGIN + '/';

        var base = STATIC_PAGES[page];
        if (base) {
            apply({ page: page, title: base.title, desc: base.desc, canonical: canonical });
            return;
        }

        // 文章頁：標題與描述都從 posts.json 拿
        fetch('posts.json')
            .then(function (r) { return r.json(); })
            .then(function (posts) {
                var post = posts.find(function (p) {
                    return decodeURIComponent(p.link).indexOf(page) !== -1;
                });
                if (!post) {
                    apply({ page: page, title: SITE, desc: STATIC_PAGES[''].desc, canonical: canonical });
                    return;
                }
                apply({
                    page: page,
                    title: post.title + ' | ' + SITE,
                    desc: post.description,
                    keywords: (post.keywords || []).join(', '),
                    // 圖片路徑含中文與空白，要 encode 才是合法網址
                    image: post.image ? ORIGIN + '/' + encodeURI(post.image.replace(/^\//, '')) : null,
                    canonical: canonical
                });
            })
            .catch(function (e) { console.error('page-meta: 讀取 posts.json 失敗', e); });
    });
})();
