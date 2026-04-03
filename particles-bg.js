// particles-bg.js - 全息投影 Cyberpunk 3D 粒子動畫（全頁面背景）
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
    let width, height;
    let particles = [];
    let mouse = { x: -9999, y: -9999 };

    const CONFIG = {
        particleCount: 70,
        maxSpeed: 0.35,
        minSize: 1,
        maxSize: 2.5,
        connectionDistance: 110,
        mouseInfluence: 150,
        colors: [
            'rgba(0, 255, 255, ',
            'rgba(0, 200, 255, ',
            'rgba(100, 255, 218, ',
            'rgba(0, 255, 136, ',
            'rgba(138, 43, 226, ',
            'rgba(0, 191, 255, ',
        ],
        glowColor: 'rgba(0, 255, 255, ',
        scanLineSpeed: 0.3,
        hexGridSize: 60,
    };

    class Particle {
        constructor() { this.reset(); }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.z = Math.random() * 200;
            this.vx = (Math.random() - 0.5) * CONFIG.maxSpeed;
            this.vy = (Math.random() - 0.5) * CONFIG.maxSpeed;
            this.vz = (Math.random() - 0.5) * CONFIG.maxSpeed * 0.5;
            this.baseSize = CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize);
            this.colorIndex = Math.floor(Math.random() * CONFIG.colors.length);
            this.pulse = Math.random() * Math.PI * 2;
            this.pulseSpeed = 0.02 + Math.random() * 0.03;
            this.flickerPhase = Math.random() * Math.PI * 2;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.z += this.vz;
            this.pulse += this.pulseSpeed;
            this.flickerPhase += 0.05;

            if (this.x < -10) this.x = width + 10;
            if (this.x > width + 10) this.x = -10;
            if (this.y < -10) this.y = height + 10;
            if (this.y > height + 10) this.y = -10;
            if (this.z < 0) this.z = 200;
            if (this.z > 200) this.z = 0;

            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CONFIG.mouseInfluence && dist > 0) {
                const force = (CONFIG.mouseInfluence - dist) / CONFIG.mouseInfluence * 0.02;
                this.vx += (dx / dist) * force;
                this.vy += (dy / dist) * force;
            }

            this.vx *= 0.999;
            this.vy *= 0.999;

            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > CONFIG.maxSpeed * 1.5) {
                this.vx = (this.vx / speed) * CONFIG.maxSpeed;
                this.vy = (this.vy / speed) * CONFIG.maxSpeed;
            }
        }

        draw() {
            const depthScale = 1 - this.z / 400;
            const size = this.baseSize * depthScale;
            const pulseFactor = 0.5 + 0.5 * Math.sin(this.pulse);
            const flicker = 0.7 + 0.3 * Math.sin(this.flickerPhase);
            const alpha = (0.3 + 0.5 * pulseFactor) * depthScale * flicker;
            const color = CONFIG.colors[this.colorIndex];

            ctx.beginPath();
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 4);
            gradient.addColorStop(0, color + (alpha * 0.6) + ')');
            gradient.addColorStop(0.4, color + (alpha * 0.2) + ')');
            gradient.addColorStop(1, color + '0)');
            ctx.fillStyle = gradient;
            ctx.arc(this.x, this.y, size * 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.fillStyle = color + alpha + ')';
            ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Scan line
    let scanLineY = 0;
    function drawScanLine() {
        scanLineY += CONFIG.scanLineSpeed;
        if (scanLineY > height) scanLineY = -20;
        const gradient = ctx.createLinearGradient(0, scanLineY - 10, 0, scanLineY + 10);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.025)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, scanLineY - 10, width, 20);
    }

    // Hex grid
    function drawHexGrid() {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.015)';
        ctx.lineWidth = 0.5;
        const size = CONFIG.hexGridSize;
        const h = size * Math.sqrt(3);
        for (let row = -1; row < height / h + 1; row++) {
            for (let col = -1; col < width / size + 1; col++) {
                const x = col * size * 1.5;
                const y = row * h + (col % 2 === 0 ? 0 : h / 2);
                drawHex(x, y, size * 0.5);
            }
        }
    }

    function drawHex(cx, cy, r) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    // Connections
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONFIG.connectionDistance) {
                    const alpha = (1 - dist / CONFIG.connectionDistance) * 0.12;
                    const depthAvg = 1 - (particles[i].z + particles[j].z) / 800;
                    ctx.strokeStyle = CONFIG.glowColor + (alpha * depthAvg) + ')';
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Data fragments
    const dataFragments = [];
    const fragmentTexts = ['0x00FF', '>>SYS', 'NODE', '◆◆◆', '█▓▒░', '0b1010', '::1', 'ACK', '▶▶', '⟨λ⟩'];

    class DataFragment {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * width;
            this.y = height + 20;
            this.speed = 0.3 + Math.random() * 0.5;
            this.text = fragmentTexts[Math.floor(Math.random() * fragmentTexts.length)];
            this.alpha = 0;
            this.maxAlpha = 0.06 + Math.random() * 0.05;
            this.fadeIn = true;
        }
        update() {
            this.y -= this.speed;
            if (this.fadeIn) { this.alpha += 0.002; if (this.alpha >= this.maxAlpha) this.fadeIn = false; }
            if (this.y < height * 0.3) this.alpha -= 0.001;
            if (this.y < -20 || this.alpha <= 0) this.reset();
        }
        draw() {
            if (this.alpha <= 0) return;
            ctx.font = '10px MesloLGLDZ, monospace';
            ctx.fillStyle = 'rgba(0, 255, 255, ' + this.alpha + ')';
            ctx.fillText(this.text, this.x, this.y);
        }
    }

    // Resize
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // Init
    function init() {
        resize();
        particles = [];
        for (let i = 0; i < CONFIG.particleCount; i++) particles.push(new Particle());
        for (let i = 0; i < 6; i++) {
            const frag = new DataFragment();
            frag.y = Math.random() * height;
            frag.alpha = frag.maxAlpha * Math.random();
            frag.fadeIn = false;
            dataFragments.push(frag);
        }
    }

    // Animate
    let animationId;
    function animate() {
        ctx.clearRect(0, 0, width, height);
        drawHexGrid();
        drawScanLine();
        dataFragments.forEach(f => { f.update(); f.draw(); });
        particles.forEach(p => { p.update(); p.draw(); });
        drawConnections();
        animationId = requestAnimationFrame(animate);
    }

    // Mouse
    document.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    document.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
    window.addEventListener('resize', resize);

    // Start
    init();
    animate();
})();
