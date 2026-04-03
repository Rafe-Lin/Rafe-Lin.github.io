// timeline-particles.js - 全息投影 Cyberpunk 3D 粒子動畫
(function () {
    'use strict';

    const canvas = document.createElement('canvas');
    canvas.id = 'timeline-particles-canvas';
    const timelineContainer = document.getElementById('timeline-container');
    if (!timelineContainer) return;

    // 將 canvas 插入到 timeline-container 內部（作為背景）
    timelineContainer.style.position = 'relative';
    timelineContainer.style.overflow = 'hidden';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    timelineContainer.insertBefore(canvas, timelineContainer.firstChild);

    // 讓 timeline 內容在粒子上方
    const items = timelineContainer.querySelectorAll('.timeline-item');
    items.forEach(item => { item.style.position = 'relative'; item.style.zIndex = '1'; });
    // timeline 的 before pseudo-element（時間軸線）透過 CSS z-index 處理

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    let connections = [];
    let animationId;
    let mouse = { x: -9999, y: -9999 };

    const CONFIG = {
        particleCount: 80,
        maxSpeed: 0.4,
        minSize: 1,
        maxSize: 3,
        connectionDistance: 120,
        mouseInfluence: 150,
        colors: [
            'rgba(0, 255, 255, ',    // cyan
            'rgba(0, 200, 255, ',    // blue-cyan
            'rgba(100, 255, 218, ',  // teal
            'rgba(0, 255, 136, ',    // green-neon
            'rgba(138, 43, 226, ',   // violet
            'rgba(0, 191, 255, ',    // deep sky blue
        ],
        glowColor: 'rgba(0, 255, 255, ',
        scanLineSpeed: 0.3,
        hexGridSize: 60,
    };

    // === Particle class ===
    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.z = Math.random() * 200; // depth
            this.vx = (Math.random() - 0.5) * CONFIG.maxSpeed;
            this.vy = (Math.random() - 0.5) * CONFIG.maxSpeed;
            this.vz = (Math.random() - 0.5) * CONFIG.maxSpeed * 0.5;
            this.baseSize = CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize);
            this.colorIndex = Math.floor(Math.random() * CONFIG.colors.length);
            this.pulse = Math.random() * Math.PI * 2;
            this.pulseSpeed = 0.02 + Math.random() * 0.03;
            this.life = 1;
            this.flickerPhase = Math.random() * Math.PI * 2;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.z += this.vz;
            this.pulse += this.pulseSpeed;
            this.flickerPhase += 0.05;

            // Wrap around
            if (this.x < -10) this.x = width + 10;
            if (this.x > width + 10) this.x = -10;
            if (this.y < -10) this.y = height + 10;
            if (this.y > height + 10) this.y = -10;
            if (this.z < 0) this.z = 200;
            if (this.z > 200) this.z = 0;

            // Mouse interaction - gentle push
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CONFIG.mouseInfluence && dist > 0) {
                const force = (CONFIG.mouseInfluence - dist) / CONFIG.mouseInfluence * 0.02;
                this.vx += (dx / dist) * force;
                this.vy += (dy / dist) * force;
            }

            // Damping
            this.vx *= 0.999;
            this.vy *= 0.999;

            // Speed clamping
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > CONFIG.maxSpeed * 1.5) {
                this.vx = (this.vx / speed) * CONFIG.maxSpeed;
                this.vy = (this.vy / speed) * CONFIG.maxSpeed;
            }
        }

        draw() {
            const depthScale = 1 - this.z / 400; // parallax
            const size = this.baseSize * depthScale;
            const pulseFactor = 0.5 + 0.5 * Math.sin(this.pulse);
            const flicker = 0.7 + 0.3 * Math.sin(this.flickerPhase);
            const alpha = (0.3 + 0.5 * pulseFactor) * depthScale * flicker;
            const color = CONFIG.colors[this.colorIndex];

            // Outer glow
            ctx.beginPath();
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 4);
            gradient.addColorStop(0, color + (alpha * 0.6) + ')');
            gradient.addColorStop(0.4, color + (alpha * 0.2) + ')');
            gradient.addColorStop(1, color + '0)');
            ctx.fillStyle = gradient;
            ctx.arc(this.x, this.y, size * 4, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.fillStyle = color + alpha + ')';
            ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // === Scan line effect (holographic) ===
    let scanLineY = 0;

    function drawScanLine() {
        scanLineY += CONFIG.scanLineSpeed;
        if (scanLineY > height) scanLineY = -20;

        const gradient = ctx.createLinearGradient(0, scanLineY - 10, 0, scanLineY + 10);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.03)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, scanLineY - 10, width, 20);
    }

    // === Hex grid background (subtle holographic grid) ===
    function drawHexGrid() {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.02)';
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
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    // === Draw connections ===
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.connectionDistance) {
                    const alpha = (1 - dist / CONFIG.connectionDistance) * 0.15;
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

    // === Floating data fragments (holographic text-like elements) ===
    const dataFragments = [];
    const fragmentTexts = ['0x00FF', '>>SYS', 'NODE', '◆◆◆', '█▓▒░', '0b1010', '::1', 'ACK', '▶▶', '⟨λ⟩'];

    class DataFragment {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * width;
            this.y = height + 20;
            this.speed = 0.3 + Math.random() * 0.5;
            this.text = fragmentTexts[Math.floor(Math.random() * fragmentTexts.length)];
            this.alpha = 0;
            this.maxAlpha = 0.08 + Math.random() * 0.07;
            this.fadeIn = true;
        }
        update() {
            this.y -= this.speed;
            if (this.fadeIn) {
                this.alpha += 0.002;
                if (this.alpha >= this.maxAlpha) this.fadeIn = false;
            }
            if (this.y < height * 0.3) {
                this.alpha -= 0.001;
            }
            if (this.y < -20 || this.alpha <= 0) {
                this.reset();
            }
        }
        draw() {
            if (this.alpha <= 0) return;
            ctx.font = '10px MesloLGLDZ, monospace';
            ctx.fillStyle = 'rgba(0, 255, 255, ' + this.alpha + ')';
            ctx.fillText(this.text, this.x, this.y);
        }
    }

    // === Resize ===
    function resize() {
        const rect = timelineContainer.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // === Init ===
    function init() {
        resize();
        particles = [];
        for (let i = 0; i < CONFIG.particleCount; i++) {
            particles.push(new Particle());
        }
        for (let i = 0; i < 8; i++) {
            const frag = new DataFragment();
            frag.y = Math.random() * height; // 初始散佈
            frag.alpha = frag.maxAlpha * Math.random();
            frag.fadeIn = false;
            dataFragments.push(frag);
        }
    }

    // === Animation loop ===
    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Background elements
        drawHexGrid();
        drawScanLine();

        // Data fragments
        dataFragments.forEach(f => { f.update(); f.draw(); });

        // Particles
        particles.forEach(p => { p.update(); p.draw(); });

        // Connections
        drawConnections();

        animationId = requestAnimationFrame(animate);
    }

    // === Mouse tracking (relative to container) ===
    timelineContainer.addEventListener('mousemove', (e) => {
        const rect = timelineContainer.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    timelineContainer.addEventListener('mouseleave', () => {
        mouse.x = -9999;
        mouse.y = -9999;
    });

    // === Observe container resize ===
    const resizeObserver = new ResizeObserver(() => {
        resize();
    });
    resizeObserver.observe(timelineContainer);

    // === Start ===
    // Wait a bit for timeline content to render & get height
    setTimeout(() => {
        init();
        animate();
    }, 300);

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        cancelAnimationFrame(animationId);
        resizeObserver.disconnect();
    });
})();
