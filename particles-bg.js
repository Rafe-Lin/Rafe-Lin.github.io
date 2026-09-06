// particles-bg.js - 深空星場 + 流星（滑鼠 / 觸控 / 陀螺儀視差）
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
    // 手機 / 平板：沒有滑鼠可以 hover，互動要靠觸控與陀螺儀
    const coarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    let width = 0, height = 0, dpr = 1;
    let stars = [];
    let dust = null;              // 離螢幕的深空塵埃 / 星雲
    let meteors = [];
    let nextMeteor = 0;

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
        // 游標附近的折射：只有極輕微的放大與增亮，刻意不畫任何邊界，
        // 才不會在滑鼠外面出現一圈看得見的圓
        lensRadius: 230,
        lensRefraction: 0.15,
        lensGain: 1.05,
        meteorMinGap: 4200,       // 兩顆流星之間的最短間隔（毫秒）
        meteorMaxGap: 11000,
    };

    // 恆星光譜：真實夜空以藍白 / 白為主，夾雜少量橙紅的巨星。
    // 這裡保留冷色調的科技感，但補上暖色，分佈才不會假。
    const STAR_COLORS = [
        { c: [255, 255, 255], w: 30 },   // A/F 白
        { c: [198, 224, 255], w: 24 },   // B 藍白
        { c: [150, 238, 250], w: 16 },   // 主題青
        { c: [186, 170, 255], w: 10 },   // O 藍紫
        { c: [255, 238, 205], w: 10 },   // G 黃白（太陽色）
        { c: [255, 205, 150], w: 6 },    // K 橙
        { c: [255, 176, 150], w: 4 },    // M 紅巨星
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
    let spikeSprites = [];

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

        // 繞射芒：真實照片裡最亮的幾顆星會拉出十字光芒（望遠鏡副鏡支架造成）。
        // 只有這個細節能讓「亮星」和「大一點的光點」在視覺上區分開來。
        spikeSprites = STAR_COLORS.map(({ c }) => {
            const s = 128, h = s / 2, t = 2.4;
            const cv = document.createElement('canvas');
            cv.width = cv.height = s;
            const g = cv.getContext('2d');
            const rgb = c[0] + ',' + c[1] + ',' + c[2];
            [[1, 0], [0, 1]].forEach(([dx, dy]) => {
                const grad = g.createLinearGradient(
                    h - h * dx, h - h * dy, h + h * dx, h + h * dy);
                grad.addColorStop(0.00, 'rgba(' + rgb + ',0)');
                grad.addColorStop(0.40, 'rgba(' + rgb + ',0.22)');
                grad.addColorStop(0.50, 'rgba(255,255,255,0.85)');
                grad.addColorStop(0.60, 'rgba(' + rgb + ',0.22)');
                grad.addColorStop(1.00, 'rgba(' + rgb + ',0)');
                g.fillStyle = grad;
                g.fillRect(dx ? 0 : h - t / 2, dy ? 0 : h - t / 2, dx ? s : t, dy ? s : t);
            });
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
            this.mag = mag;
            this.size = 0.34 + mag * 1.5;
            this.baseAlpha = (0.22 + mag * 0.72) * (0.4 + this.depth * 0.6);
            this.colorIndex = pickColor();
            this.spike = mag > 0.88;   // 只有最亮的那幾顆有繞射芒

            // 大氣閃爍：兩個頻率疊加。越暗的星閃得越厲害，跟實際觀星一致
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

        // 暗星雲：銀河中央那條把星光擋住的塵埃帶，少了它會太「乾淨」
        const rift = g.createLinearGradient(0, -h * 0.06, 0, h * 0.07);
        rift.addColorStop(0, 'rgba(2,3,6,0)');
        rift.addColorStop(0.5, 'rgba(2,3,6,0.55)');
        rift.addColorStop(1, 'rgba(2,3,6,0)');
        g.fillStyle = rift;
        g.fillRect(-w, -h * 0.06, w * 2, h * 0.13);
        g.restore();

        // 幾團冷色星雲（青 / 靛 / 紫），亮度壓到幾乎只是暗示
        const clouds = [
            { x: 0.20, y: 0.24, r: 0.46, c: '0,190,215', a: 0.040 },
            { x: 0.80, y: 0.16, r: 0.34, c: '110,90,230', a: 0.030 },
            { x: 0.66, y: 0.78, r: 0.48, c: '0,150,205', a: 0.030 },
            { x: 0.10, y: 0.86, r: 0.30, c: '80,70,190', a: 0.024 },
            { x: 0.44, y: 0.52, r: 0.26, c: '210,120,140', a: 0.018 },  // 一點點暖色的發射星雲
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

    // ── 流星 ─────────────────────────────────────────────────────────
    // 真實流星的幾個特徵，這裡都做出來：
    //  1. 同一時段的流星大致從同一個「輻射點」射出
    //  2. 亮度不是對稱的，是快速衝亮、然後拖著慢慢熄掉
    //  3. 燒到一半可能爆閃一下（fireball / 火流星）
    //  4. 熄滅之後餘燼（train）還會留在天上一下子才消失
    //  5. 顏色由燒掉的金屬決定：鎂偏綠、鈉偏橙、鈣偏紫
    const METEOR_COLORS = [
        { core: '255,255,255', tail: '155,225,255', w: 34 },   // 一般
        { core: '236,255,242', tail: '120,255,190', w: 22 },   // 鎂：綠
        { core: '255,246,214', tail: '255,186,105', w: 18 },   // 鈉：橙黃
        { core: '242,236,255', tail: '175,150,255', w: 14 },   // 鈣：紫
        { core: '255,255,255', tail: '150,200,255', w: 12 },   // 冷白
    ];
    const METEOR_TOTAL = METEOR_COLORS.reduce((s, x) => s + x.w, 0);

    function pickMeteorColor() {
        let r = Math.random() * METEOR_TOTAL;
        for (let i = 0; i < METEOR_COLORS.length; i++) {
            r -= METEOR_COLORS[i].w;
            if (r <= 0) return METEOR_COLORS[i];
        }
        return METEOR_COLORS[0];
    }

    // 輻射點緩慢漂移，流星才不會每次都從一模一樣的方向來
    let radiantX = 0, radiantY = 0;
    function moveRadiant() {
        radiantX = width * (-0.55 + Math.random() * 0.45);
        radiantY = height * (-0.65 + Math.random() * 0.35);
    }

    class Meteor {
        constructor(fromX, fromY) {
            // 六分之一是火流星：又慢又亮又長
            const fireball = Math.random() < 0.17;

            if (fromX === undefined) {
                this.x = Math.random() * width * 1.3 - width * 0.2;
                this.y = Math.random() * height * 0.5 - height * 0.18;
            } else {
                this.x = fromX;
                this.y = fromY;
            }

            const angle = Math.atan2(this.y - radiantY, this.x - radiantX)
                + (Math.random() - 0.5) * 0.22;   // 輻射點附近的隨機散射
            const speed = fireball
                ? 4.5 + Math.random() * 3
                : 10 + Math.random() * 11;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;

            this.life = 0;
            this.maxLife = (fireball ? 95 : 34) + Math.random() * (fireball ? 55 : 40);
            this.brightness = fireball ? 1 : 0.34 + Math.random() * 0.5;
            this.w = fireball ? 2.6 : 1.0 + Math.random() * 0.7;
            this.trailMax = Math.round((fireball ? 46 : 22) + Math.random() * 18);
            this.c = pickMeteorColor();

            // 爆閃：火流星幾乎一定會閃，普通流星偶爾
            this.flareAt = (fireball || Math.random() < 0.28)
                ? 0.35 + Math.random() * 0.4 : -1;
            this.flarePower = fireball ? 0.9 : 0.45;

            this.trail = [this.x, this.y];
            this.train = 1;                                   // 餘燼
            this.trainLife = fireball ? 34 : 16;
        }

        get alpha() {
            const p = Math.min(1, this.life / this.maxLife);
            // 前段衝亮、後段慢慢熄 —— 不是對稱的正弦
            let a = Math.pow(Math.sin(Math.PI * Math.pow(p, 0.62)), 1.25);
            if (this.flareAt > 0 && p > this.flareAt) {
                const f = Math.max(0, 1 - (p - this.flareAt) / 0.16);
                a += f * f * this.flarePower;
            }
            return a * this.brightness;
        }

        update() {
            if (this.life <= this.maxLife) {
                this.x += this.vx;
                this.y += this.vy;
                this.vx *= 0.9975;      // 進入大氣後略微減速
                this.vy *= 0.9975;
                this.trail.push(this.x, this.y);
                if (this.trail.length > this.trailMax * 2) this.trail.splice(0, 2);
            } else {
                this.train -= 1 / this.trainLife;
            }
            this.life++;
        }

        get dead() {
            return this.train <= 0
                || this.x > width + 400 || this.y > height + 400
                || this.x < -400 || this.y < -400;
        }

        draw() {
            const n = this.trail.length / 2;
            if (n < 2) return;
            const head = this.alpha * this.train;
            if (head <= 0.012) return;

            ctx.lineCap = 'round';
            for (let i = 1; i < n; i++) {
                const q = i / (n - 1);                         // 0 = 尾端，1 = 頭
                const a = head * Math.pow(q, 1.55);
                if (a < 0.012) continue;
                ctx.strokeStyle = 'rgba('
                    + (q > 0.8 ? this.c.core : this.c.tail) + ','
                    + Math.min(1, a) + ')';
                ctx.lineWidth = this.w * (0.2 + q * 0.95);
                ctx.beginPath();
                ctx.moveTo(this.trail[(i - 1) * 2], this.trail[(i - 1) * 2 + 1]);
                ctx.lineTo(this.trail[i * 2], this.trail[i * 2 + 1]);
                ctx.stroke();
            }

            // 頭部的光暈：真實流星的發光體很小，只有一小點，
            // 大部分的長度是後面拖出來的尾巴
            if (this.life <= this.maxLife) {
                const r = this.w * (2.2 + head * 4.2);
                const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
                g.addColorStop(0, 'rgba(255,255,255,' + Math.min(0.9, head) + ')');
                g.addColorStop(0.22, 'rgba(' + this.c.core + ',' + Math.min(0.65, head * 0.55) + ')');
                g.addColorStop(0.55, 'rgba(' + this.c.tail + ',' + Math.min(0.3, head * 0.22) + ')');
                g.addColorStop(1, 'rgba(' + this.c.tail + ',0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function spawnMeteor(x, y) {
        if (meteors.length > 8) return;
        meteors.push(new Meteor(x, y));
    }

    // 有些情況下 window.innerHeight 會回報 0（背景分頁還原、webview 初始化、
    // 預覽面板未繪製）。這時 canvas 高度是 0、星星一顆都生不出來，而且不會再
    // 觸發 resize 事件，畫面就永遠空著 —— 所以多留一組後備量法。
    function viewport() {
        return {
            w: window.innerWidth || document.documentElement.clientWidth || 0,
            h: window.innerHeight || document.documentElement.clientHeight || 0
        };
    }

    function resize() {
        const vp = viewport();
        if (!vp.w || !vp.h) return;    // 量不到就先不動，交給 animate() 重試
        width = vp.w;
        height = vp.h;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        buildDust();
        createStars();
        moveRadiant();
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
                // 游標附近的星星被輕微推開並提亮。位移與增亮都在半徑處
                // 平滑歸零，所以看不到任何邊界 —— 只感覺得到那一塊在呼吸
                const dx = x - lensX, dy = y - lensY;
                const d2 = dx * dx + dy * dy;
                if (d2 < R2) {
                    const d = Math.sqrt(d2) / R;                  // 0..1
                    const falloff = (1 - d * d) * (1 - d * d);    // 邊緣一階導數也是 0
                    const k = falloff * CONFIG.lensRefraction * lensPresence;
                    x += dx * k;                                  // 向外推 = 放大
                    y += dy * k;
                    alpha *= 1 + (CONFIG.lensGain - 1) * falloff * lensPresence;
                    scale = 1 + 0.35 * falloff * lensPresence;
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

            if (s.spike) {
                // 芒的長度跟著閃爍呼吸，像大氣擾動下的真實亮星
                const L = size * (2.6 + twinkle * 0.6);
                ctx.globalAlpha = alpha * 0.55;
                ctx.drawImage(spikeSprites[s.colorIndex], x - L / 2, y - L / 2, L, L);
            }
            ctx.globalAlpha = 1;
        }
    }

    function drawFrame() {
        ctx.clearRect(0, 0, width, height);

        if (dust) {
            ctx.drawImage(dust, -130 + offsetX * 0.12, -130 + (offsetY + scrollOffset) * 0.05);
        }

        drawStars();

        // 流星用 lighter 疊加，交錯時會自然變亮
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = meteors.length - 1; i >= 0; i--) {
            meteors[i].update();
            meteors[i].draw();
            if (meteors[i].dead) meteors.splice(i, 1);
        }
        ctx.restore();
    }

    let rafId = null;
    function animate(now) {
        rafId = requestAnimationFrame(animate);

        // 只在「已經壞掉」的狀態下重建，正常情況一毛成本都不花
        if (!width || !height || !stars.length) {
            const vp = viewport();
            if (vp.w && vp.h) resize();
            if (!stars.length) return;
        }

        offsetX += (targetOffsetX - offsetX) * 0.045;
        offsetY += (targetOffsetY - offsetY) * 0.045;

        // 折射區用較慢的緩動追上游標 —— 這是「液態」的來源
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

        if (now > nextMeteor) {
            if (nextMeteor !== 0) {
                spawnMeteor();
                // 五分之一的機率是一小群，同時來兩三顆
                if (Math.random() < 0.2) {
                    const extra = 1 + Math.round(Math.random());
                    for (let k = 1; k <= extra; k++) {
                        setTimeout(spawnMeteor, 180 + Math.random() * 700);
                    }
                }
                if (Math.random() < 0.3) moveRadiant();
            }
            nextMeteor = now + CONFIG.meteorMinGap
                + Math.random() * (CONFIG.meteorMaxGap - CONFIG.meteorMinGap);
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

    // ── 指標 ─────────────────────────────────────────────────────────
    function setPointer(x, y) {
        pointerX = x;
        pointerY = y;
        targetOffsetX = (width / 2 - x) / (width / 2) * CONFIG.parallaxMouse;
        targetOffsetY = (height / 2 - y) / (height / 2) * CONFIG.parallaxMouse * 0.6;
        // styles.css 用這兩個變數畫玻璃上的高光
        document.documentElement.style.setProperty('--px', x + 'px');
        document.documentElement.style.setProperty('--py', y + 'px');
    }

    document.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;   // 觸控交給下面的 touch 事件處理
        setPointer(e.clientX, e.clientY);
    }, { passive: true });

    document.addEventListener('pointerleave', () => {
        pointerX = -9999; pointerY = -9999;
        targetOffsetX = 0; targetOffsetY = 0;
    });

    // ── 觸控：手機沒有 hover，互動全靠這裡 ───────────────────────────
    let touchStart = null;
    window.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        if (!t) return;
        touchStart = { x: t.clientX, y: t.clientY, at: Date.now() };
        setPointer(t.clientX, t.clientY);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        const t = e.touches[0];
        if (!t) return;
        setPointer(t.clientX, t.clientY);
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
        // 輕點（沒有滑動、時間短）就從指尖射出一顆流星
        const t = e.changedTouches && e.changedTouches[0];
        if (t && touchStart
            && Date.now() - touchStart.at < 320
            && Math.hypot(t.clientX - touchStart.x, t.clientY - touchStart.y) < 12) {
            radiantX = t.clientX - 200;
            radiantY = t.clientY - 260;
            spawnMeteor(t.clientX, t.clientY);
        }
        touchStart = null;
        // 手指離開後折射慢慢淡掉，但高光停在原處，畫面不會突然變暗
        pointerX = -9999; pointerY = -9999;
    }, { passive: true });

    // ── 陀螺儀：把手機拿在手上傾斜，星空跟著移動 ────────────────────
    // iOS 13+ 需要使用者手勢後呼叫 requestPermission，沒有權限就跳過，
    // 這時仍然有觸控與捲動視差可用。
    if (coarsePointer && window.DeviceOrientationEvent
        && typeof window.DeviceOrientationEvent.requestPermission !== 'function') {
        let baseGamma = null, baseBeta = null;
        window.addEventListener('deviceorientation', (e) => {
            if (e.gamma == null || e.beta == null) return;
            if (baseGamma === null) { baseGamma = e.gamma; baseBeta = e.beta; }
            const gx = Math.max(-1, Math.min(1, (e.gamma - baseGamma) / 24));
            const gy = Math.max(-1, Math.min(1, (e.beta - baseBeta) / 24));
            targetOffsetX = -gx * CONFIG.parallaxMouse * 1.5;
            targetOffsetY = -gy * CONFIG.parallaxMouse * 0.9;
        }, { passive: true });
    }

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

    // 觸控裝置一開始沒有指標位置，玻璃上的高光會整片不見。
    // 先給一個偏上方的預設位置，看起來像有一道環境光。
    if (coarsePointer) {
        document.documentElement.style.setProperty('--px', (width * 0.5) + 'px');
        document.documentElement.style.setProperty('--py', (height * 0.18) + 'px');
    }

    if (reduceMotion) {
        drawFrame();
    } else {
        rafId = requestAnimationFrame(animate);
        // 進站後很快來一顆，讓人知道這裡有流星
        setTimeout(() => spawnMeteor(), 1800 + Math.random() * 1500);
    }
})();
