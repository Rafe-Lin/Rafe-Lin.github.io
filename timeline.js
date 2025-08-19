// 確保在 DOM 完全載入後才執行
document.addEventListener('DOMContentLoaded', function() {
    // 檢查當前頁面路徑是否為 timeline.html
    if (window.location.pathname.endsWith('timeline.html')) {
        // 只在 timeline.html 頁面載入 timeline.css
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'timeline.css';
        document.head.appendChild(link);
    }
});
