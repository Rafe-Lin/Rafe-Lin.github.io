// particles-bg.js - 深空星場 + 液態玻璃透鏡（滑鼠折射 / 捲動視差）
(function () {
    'use strict';

    const canvas = document.createElement('canvas');
    canvas.id = 'particles-bg-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0, height = 0, dpr = 1;
    let stars = [];
    let dust = null;              // 離螢幕的深空塵埃 / 星雲
    let shootingStars = [];
    let nextShootingStar = 0;

    // 指標與視差
    let pointerX = -9999, pointerY = -9999;
    let lensX = -9999, lensY = -9999;     // 緩動後的透鏡中心
    let lensVX = 0, lensVY = 0;
    let lensPresence = 0;                  // 0..1 淡入淡出
    let targetOffsetX = 0, targetOffsetY = 0;
    let offsetX = 0, offsetY = 0;
    let scrollOffset = 0;
    let scrollVel = 0;
    let lastScrollY = window.scrollY || 0;

    const CONFIG = {
        density: 1 / 2400,
        maxStars: 1000,
        layers: 5,
        parallaxMouse: 30,
        parallaxScroll: 0.24,
        lensRadius: 190,          // 液態玻璃透鏡半徑
        lensRefraction: 0.34,     // 折射位移強度
        lensGain: 1.1,            // 透鏡內的增亮
    };

    // 冷色系恆星：白 / 冰藍 / 主題青 / 淡紫，維持科技感
    const STAR_COLORS = [
        { c: [255, 255, 255], w: 34 },
        { c: [198, 224, 255], w: 26 },
        { c: [150, 238, 250], w: 22 },
        { c: [186, 170, 255], w: 12 },
        { c: [120, 255, 226], w: 6 },
    ];
    const COLOR_TOTAL = STAR_COLORS.reduce((s, x) => s + x.w, 0);

    function pickColor() {
        let r = Math.random() * COLOR_TOTAL;
        for (let i = 0; i < STAR_COLORS.length; i++) {
            r -= STAR_COLORS[i].w;
            if (r <= 0) return i;
        }
        return 0;
    }

    // 預先算好星點貼圖，避免每禎重建漸層
    let sprites = [];
    function buildSprites() {
        sprites = STAR_COLORS.map(({ c }) => {
            const s = 64;
            const cv = document.createElement('canvas');
            cv.width = cv.height = s;
            const g = cv.getContext('2d');
            const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
            const rgb = c[0] + ',' + c[1] + ',' + c[2];
            grad.addColorStop(0, 'rgba(255,255,255,1)');
            grad.addColorStop(0.08, 'rgba(' + rgb + ',0.9)');
            grad.addColorStop(0.18, 'rgba(' + rgb + ',0.26)');
            grad.addColorStop(0.42, 'rgba(' + rgb + ',0.05)');
            grad.addColorStop(1, 'rgba(' + rgb + ',0)');
            g.fillStyle = grad;
            g.fillRect(0, 0, s, s);
            return cv;
        });
    }

    function gauss() {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    const BAND_ANGLE = -0.38;   // 星塵帶的走向

    class Star {
        constructor() {
            const layer = Math.floor(Math.random() * CONFIG.layers);
            this.depth = (layer + 1) / CONFIG.layers;   // 1 = 最近

            if (Math.random() < 0.35) {
                // 三分之一沿著星塵帶聚集，讓分佈不平均、更像真實天空
                const t = (Math.random() - 0.5) * Math.max(width, height) * 2;
                const n = gauss() * height * 0.16;
                const cos = Math.cos(BAND_ANGLE), sin = Math.sin(BAND_ANGLE);
                this.x = width / 2 + t * cos - n * sin;
                this.y = height / 2 + t * sin + n * cos;
            } else {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
            }

            // 冪次分佈的星等：多數細小、少數明亮
            const mag = Math.pow(Math.random(), 3);
            this.size = 0.34 + mag * 1.5;
            this.baseAlpha = (0.22 + mag * 0.72) * (0.4 + this.depth * 0.6);
            this.colorIndex = pickColor();

            // 大氣閃爍：兩個頻率疊加
            this.tw1 = Math.random() * Math.PI * 2;
            this.tw2 = Math.random() * Math.PI * 2;
            this.twSpeed1 = 0.006 + Math.random() * 0.02;
            this.twSpeed2 = 0.003 + Math.random() * 0.01;
            this.twAmount = (0.1 + Math.random() * 0.26) * (1.2 - mag);
        }
    }

    function wrap(v, max) {
        const m = max + 120;
        return ((v + 60) % m + m) % m - 60;
    }

    function buildDust() {
        const w = width + 260, h = height + 260;
        dust = document.createElement('canvas');
        dust.width = Math.max(1, Math.round(w));
        dust.height = Math.max(1, Math.round(h));
        const g = dust.getContext('2d');

        // 星塵帶：一道極淡的冷霧
        g.save();
        g.translate(w / 2, h / 2);
        g.rotate(BAND_ANGLE);
        const band = g.createLinearGradient(0, -h * 0.3, 0, h * 0.3);
        band.addColorStop(0, 'rgba(70,120,180,0)');
        band.addColorStop(0.42, 'rgba(80,140,190,0.028)');
        band.addColorStop(0.5, 'rgba(140,200,235,0.05)');
        band.addColorStop(0.58, 'rgba(80,140,190,0.028)');
        band.addColorStop(1, 'rgba(70,120,180,0)');
        g.fillStyle = band;
        g.fillRect(-w, -h * 0.3, w * 2, h * 0.6);
        g.restore();

        // 幾團冷色星雲（青 / 靛 / 紫），亮度壓到幾乎只是暗示
        const clouds = [
            { x: 0.20, y: 0.24, r: 0.46, c: '0,190,215', a: 0.040 },
            { x: 0.80, y: 0.16, r: 0.34, c: '110,90,230', a: 0.030 },
            { x: 0.66, y: 0.78, r: 0.48, c: '0,150,205', a: 0.030 },
            { x: 0.10, y: 0.86, r: 0.30, c: '80,70,190', a: 0.024 },
        ];
        clouds.forEach(cl => {
            const cx = cl.x * w, cy = cl.y * h, r = cl.r * Math.min(w, h);
            const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r);
            grad.addColorStop(0, 'rgba(' + cl.c + ',' + cl.a + ')');
            grad.addColorStop(0.45, 'rgba(' + cl.c + ',' + cl.a * 0.32 + ')');
            grad.addColorStop(1, 'rgba(' + cl.c + ',0)');
            g.fillStyle = grad;
            g.fillRect(0, 0, w, h);
        });

        // 細顆粒，消除漸層色帶
        const tile = document.createElement('canvas');
        tile.width = tile.height = 128;
        const tg = tile.getContext('2d');
        const grain = tg.createImageData(128, 128);
        const d = grain.data;
        for (let i = 0; i < d.length; i += 4) {
            const n = Math.random() * 255;
            d[i] = d[i + 1] = d[i + 2] = n;
            d[i + 3] = 5;
        }
        tg.putImageData(grain, 0, 0);
        g.globalCompositeOperation = 'overlay';
        g.fillStyle = g.createPattern(tile, 'repeat');
        g.fillRect(0, 0, w, h);
        g.globalCompositeOperation = 'source-over';
    }

    class ShootingStar {
        constructor() {
            this.x = Math.random() * width * 1.1 - width * 0.05;
            this.y = -20 - Math.random() * height * 0.2;
            const angle = 0.4 + Math.random() * 0.45;
            const speed = 8 + Math.random() * 7;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.life = 0;
            this.maxLife = 50 + Math.random() * 40;
            this.len = 70 + Math.random() * 120;
        }
        update() { this.x += this.vx; this.y += this.vy; this.life++; }
        get dead() { return this.life > this.maxLife || this.x > width + 200 || this.y > height + 200; }
        draw() {
            const p = this.life / this.maxLife;
            const alpha = Math.sin(Math.PI * p) * 0.7;
            if (alpha <= 0) return;
            const m = Math.hypot(this.vx, this.vy) || 1;
            const tx = this.x - (this.vx / m) * this.len;
            const ty = this.y - (this.vy / m) * this.len;
            const g = ctx.createLinearGradient(this.x, this.y, tx, ty);
            g.addColorStop(0, 'rgba(255,255,255,' + alpha + ')');
            g.addColorStop(0.2, 'rgba(150,235,255,' + alpha * 0.45 + ')');
            g.addColorStop(1, 'rgba(120,180,255,0)');
            ctx.strokeStyle = g;
            ctx.lineWidth = 1.2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(tx, ty);
            ctx.stroke();
        }
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        buildDust();
        createStars();
    }

    function createStars() {
        const count = Math.min(CONFIG.maxStars, Math.round(width * height * CONFIG.density));
        stars = [];
        for (let i = 0; i < count; i++) stars.push(new Star());
        stars.sort((a, b) => a.baseAlpha - b.baseAlpha);   // 亮星畫在最上層
    }

    function drawStars() {
        const streakBase = Math.max(-80, Math.min(80, scrollVel * 0.5));
        const R = CONFIG.lensRadius;
        const R2 = R * R;
        const lensOn = lensPresence > 0.01;
        // 指標移動時，透鏡沿運動方向被拉長 —— 液體的慣性
        const speed = Math.min(1, Math.hypot(lensVX, lensVY) / 45);
        const stretch = 1 + speed * 0.45;
        const sqz = 1 - speed * 0.2;
        const dirX = speed > 0.01 ? lensVX / (Math.hypot(lensVX, lensVY) || 1) : 1;
        const dirY = speed > 0.01 ? lensVY / (Math.hypot(lensVX, lensVY) || 1) : 0;

        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];
            const p = 0.22 + s.depth * 0.78;

            let x = wrap(s.x + offsetX * p, width);
            let y = wrap(s.y + (offsetY + scrollOffset) * p, height);

            s.tw1 += s.twSpeed1;
            s.tw2 += s.twSpeed2;
            const twinkle = 1 + (Math.sin(s.tw1) * 0.6 + Math.sin(s.tw2) * 0.4) * s.twAmount;

            let alpha = s.baseAlpha * twinkle;
            let scale = 1;

            if (lensOn) {
                // 把座標轉到透鏡的橢圓空間，算出折射位移
                let dx = x - lensX, dy = y - lensY;
                const along = dx * dirX + dy * dirY;
                const perp = -dx * dirY + dy * dirX;
                const ex = along / stretch, ey = perp / sqz;
                const d2 = ex * ex + ey * ey;
                if (d2 < R2) {
                    const d = Math.sqrt(d2) / R;                  // 0..1
                    const k = (1 - d * d) * CONFIG.lensRefraction * lensPresence;
                    x += dx * k;                                  // 向外推 = 放大
                    y += dy * k;
                    const edge = Math.pow(1 - d, 0.6);
                    alpha *= 1 + (CONFIG.lensGain - 1) * edge * lensPresence;
                    scale = 1 + 0.5 * edge * lensPresence;
                }
            }

            if (alpha <= 0.012) continue;
            if (alpha > 1) alpha = 1;

            const streak = streakBase * p;
            if (Math.abs(streak) > 2) {
                ctx.strokeStyle = 'rgba(' + STAR_COLORS[s.colorIndex].c.join(',') + ',' + alpha * 0.4 + ')';
                ctx.lineWidth = Math.max(0.5, s.size * 0.75);
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + streak);
                ctx.stroke();
            }

            const size = s.size * scale * (0.92 + twinkle * 0.08) * 9;
            ctx.globalAlpha = alpha;
            ctx.drawImage(sprites[s.colorIndex], x - size / 2, y - size / 2, size, size);
            ctx.globalAlpha = 1;
        }
    }

    // 透鏡本體：邊緣的高光環 + 一點色散，像一滴玻璃浮在星空上
    function drawLens() {
        if (lensPresence <= 0.01) return;
        const R = CONFIG.lensRadius;
        const speed = Math.min(1, Math.hypot(lensVX, lensVY) / 45);
        const angle = Math.atan2(lensVY, lensVX);

        ctx.save();
        ctx.translate(lensX, lensY);
        if (speed > 0.01) {
            ctx.rotate(angle);
            ctx.scale(1 + speed * 0.45, 1 - speed * 0.2);
        }

        // 內部極淡的體積感
        const fill = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
        fill.addColorStop(0, 'rgba(120,220,255,' + 0.020 * lensPresence + ')');
        fill.addColorStop(0.72, 'rgba(90,160,255,' + 0.012 * lensPresence + ')');
        fill.addColorStop(1, 'rgba(140,120,255,0)');
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fill();

        // 邊緣高光（上緣亮、下緣暗）
        const rim = ctx.createLinearGradient(0, -R, 0, R);
        rim.addColorStop(0, 'rgba(210,245,255,' + 0.30 * lensPresence + ')');
        rim.addColorStop(0.45, 'rgba(120,220,255,' + 0.10 * lensPresence + ')');
        rim.addColorStop(1, 'rgba(150,130,255,' + 0.16 * lensPresence + ')');
        ctx.strokeStyle = rim;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.stroke();

        // 色散：青 / 紫兩道環各偏移一點點
        ctx.lineWidth = 0.7;
        ctx.strokeStyle = 'rgba(0,235,255,' + 0.12 * lensPresence + ')';
        ctx.beginPath();
        ctx.arc(0, 0, R - 1.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(170,120,255,' + 0.10 * lensPresence + ')';
        ctx.beginPath();
        ctx.arc(0, 0, R + 1.6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    function drawFrame() {
        ctx.clearRect(0, 0, width, height);

        if (dust) {
            ctx.drawImage(dust, -130 + offsetX * 0.12, -130 + (offsetY + scrollOffset) * 0.05);
        }

        drawStars();
        drawLens();

        for (let i = shootingStars.length - 1; i >= 0; i--) {
            shootingStars[i].update();
            shootingStars[i].draw();
            if (shootingStars[i].dead) shootingStars.splice(i, 1);
        }
    }

    let rafId = null;
    function animate(now) {
        rafId = requestAnimationFrame(animate);

        offsetX += (targetOffsetX - offsetX) * 0.045;
        offsetY += (targetOffsetY - offsetY) * 0.045;

        // 透鏡用較慢的緩動追上游標 —— 這是「液態」的來源
        if (pointerX > -9000) {
            if (lensX < -9000) { lensX = pointerX; lensY = pointerY; }
            const nx = lensX + (pointerX - lensX) * 0.16;
            const ny = lensY + (pointerY - lensY) * 0.16;
            lensVX = nx - lensX; lensVY = ny - lensY;
            lensX = nx; lensY = ny;
            lensPresence += (1 - lensPresence) * 0.08;
        } else {
            lensPresence *= 0.9;
            lensVX *= 0.9; lensVY *= 0.9;
        }

        scrollVel *= 0.88;
        if (Math.abs(scrollVel) < 0.05) scrollVel = 0;

        if (now > nextShootingStar) {
            if (nextShootingStar !== 0) shootingStars.push(new ShootingStar());
            nextShootingStar = now + 9000 + Math.random() * 16000;
        }

        drawFrame();
    }

    function onScroll() {
        const y = window.scrollY || window.pageYOffset || 0;
        const delta = y - lastScrollY;
        lastScrollY = y;
        scrollOffset -= delta * CONFIG.parallaxScroll;
        scrollVel = scrollVel * 0.5 - delta * 0.5;
    }

    document.addEventListener('pointermove', (e) => {
        pointerX = e.clientX;
        pointerY = e.clientY;
        targetOffsetX = (width / 2 - pointerX) / (width / 2) * CONFIG.parallaxMouse;
        targetOffsetY = (height / 2 - pointerY) / (height / 2) * CONFIG.parallaxMouse * 0.6;
        document.documentElement.style.setProperty('--px', pointerX + 'px');
        document.documentElement.style.setProperty('--py', pointerY + 'px');
    }, { passive: true });

    document.addEventListener('pointerleave', () => {
        pointerX = -9999; pointerY = -9999;
        targetOffsetX = 0; targetOffsetY = 0;
    });

    window.addEventListener('scroll', onScroll, { passive: true });

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        } else if (!rafId && !reduceMotion) {
            rafId = requestAnimationFrame(animate);
        }
    });

    buildSprites();
    resize();
    if (reduceMotion) {
        drawFrame();
    } else {
        rafId = requestAnimationFrame(animate);
    }
})();
