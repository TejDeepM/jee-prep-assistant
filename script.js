class Spring {
    constructor(stiffness = 180, damping = 12, mass = 1) {
        this.stiffness = stiffness;
        this.damping = damping;
        this.mass = mass;
        this.x = 0;
        this.v = 0;
        this.target = 0;
    }
    update(dt) {
        const forceSpring = -this.stiffness * (this.x - this.target);
        const forceDamping = -this.damping * this.v;
        const acceleration = (forceSpring + forceDamping) / this.mass;
        this.v += acceleration * dt;
        this.x += this.v * dt;
        return this.x;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const chapterListEl = document.getElementById('chapter-list');
    const tabs = document.querySelectorAll('.tab-btn');
    const totalProgressBar = document.getElementById('total-progress');
    const totalText = document.getElementById('total-text');
    const activeIndicator = document.getElementById('active-indicator');

    // State Management
    let userState = JSON.parse(localStorage.getItem('jee_tracker_state')) || {
        physics: {},
        chemistry: {},
        maths: {}
    };

    let currentSubject = 'physics';

    // Initialize springs
    const progressSpring = new Spring(110, 9.5, 1);
    progressSpring.x = 0;
    progressSpring.target = 0;

    const tabLeftSpring = new Spring(180, 16, 1);
    const tabWidthSpring = new Spring(180, 16, 1);

    // Position initial active tab slider
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab && activeIndicator) {
        tabLeftSpring.x = activeTab.offsetLeft;
        tabLeftSpring.target = activeTab.offsetLeft;
        tabWidthSpring.x = activeTab.offsetWidth;
        tabWidthSpring.target = activeTab.offsetWidth;
        
        activeIndicator.style.left = `${activeTab.offsetLeft}px`;
        activeIndicator.style.width = `${activeTab.offsetWidth}px`;
    }

    // Initialize Page
    renderChapters(currentSubject);
    updateOverallProgress(true);

    // Tab Switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Set tab spring targets
            tabLeftSpring.target = tab.offsetLeft;
            tabWidthSpring.target = tab.offsetWidth;

            currentSubject = tab.dataset.subject;
            renderChapters(currentSubject);
        });
    });

    function renderChapters(subject) {
        chapterListEl.innerHTML = '';
        const chapters = syllabusData[subject];

        // Safety check if data is missing
        if (!chapters) {
            chapterListEl.innerHTML = '<p style="text-align:center; padding:20px;">No chapters found.</p>';
            return;
        }

        chapters.forEach((chapter, index) => {
            const level = userState[subject][chapter] || 0;

            const card = document.createElement('div');
            card.className = 'chapter-card entrance';
            card.dataset.level = level; // For CSS border coloring
            card.style.setProperty('--delay', index);

            // Status label
            let statusLabel = 'Not Started';
            if (level === 1) statusLabel = 'Familiar';
            if (level === 2) statusLabel = 'Confident';
            if (level === 3) statusLabel = 'Mastered';
            if (level === -1) statusLabel = 'Skipped';

            card.innerHTML = `
                <div class="chapter-info">
                    <div class="chapter-name">${chapter}</div>
                    <div class="chapter-status" id="status-${index}">${statusLabel}</div>
                </div>
                <div class="familiarity-controls">
                    <button class="fam-btn ${level === -1 ? 'active' : ''}" data-val="-1" data-tooltip="Skip">0</button>
                    <button class="fam-btn ${level === 1 ? 'active' : ''}" data-val="1" data-tooltip="Familiar">1</button>
                    <button class="fam-btn ${level === 2 ? 'active' : ''}" data-val="2" data-tooltip="Confident">2</button>
                    <button class="fam-btn ${level === 3 ? 'active' : ''}" data-val="3" data-tooltip="Mastered">3</button>
                </div>
            `;

            // Add Event Listeners to Buttons
            const buttons = card.querySelectorAll('.fam-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const val = parseInt(e.target.dataset.val);
                    const currentLevel = parseInt(card.dataset.level);
                    let newLevel = val;
                    if (currentLevel === val) {
                        newLevel = 0;
                    }

                    // Update State
                    userState[subject][chapter] = newLevel;
                    saveState();

                    // Update card properties in-place in DOM without full re-render
                    card.dataset.level = newLevel;

                    // Update status label badge
                    const statusEl = card.querySelector('.chapter-status');
                    let nextStatusLabel = 'Not Started';
                    if (newLevel === 1) nextStatusLabel = 'Familiar';
                    if (newLevel === 2) nextStatusLabel = 'Confident';
                    if (newLevel === 3) nextStatusLabel = 'Mastered';
                    if (newLevel === -1) nextStatusLabel = 'Skipped';
                    statusEl.textContent = nextStatusLabel;

                    // Update button active state classes
                    buttons.forEach(b => {
                        const bVal = parseInt(b.dataset.val);
                        if (bVal === newLevel) {
                            b.classList.add('active');
                        } else {
                            b.classList.remove('active');
                        }
                    });

                    // Update progress spring
                    updateOverallProgress();
                });
            });

            chapterListEl.appendChild(card);
        });
    }

    function saveState() {
        localStorage.setItem('jee_tracker_state', JSON.stringify(userState));
    }

    function updateOverallProgress(instant = false) {
        // Calculate total progress across ALL subjects
        let totalPossibleScore = 0;
        let currentScore = 0;

        ['physics', 'chemistry', 'maths'].forEach(sub => {
            const chapters = syllabusData[sub];
            totalPossibleScore += chapters.length * 3;

            chapters.forEach(chap => {
                const score = userState[sub][chap] || 0;
                if (score > 0) currentScore += score;
            });
        });

        const percentage = totalPossibleScore === 0 ? 0 : Math.round((currentScore / totalPossibleScore) * 100);

        progressSpring.target = percentage;
        if (instant) {
            progressSpring.x = percentage;
            progressSpring.v = 0;
            totalProgressBar.style.width = `${percentage}%`;
            totalText.textContent = `${percentage}%`;
        }
    }

    // --- Background Canvas Particle Physics Network ---
    const canvas = document.getElementById('physics-canvas');
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = 45;
    const connectionDistance = 120;
    const mouse = { x: null, y: null, radius: 150 };

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    class Particle {
        constructor() {
            this.baseX = Math.random() * width;
            this.baseY = Math.random() * height;
            this.x = this.baseX;
            this.y = this.baseY;
            this.vx = 0;
            this.vy = 0;
            this.size = 2;
            this.stiffness = 40 + Math.random() * 40;
            this.damping = 4 + Math.random() * 4;
        }

        update(dt) {
            // Mouse Repulsion force field
            if (mouse.x !== null && mouse.y !== null) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.hypot(dx, dy);
                if (dist < mouse.radius) {
                    const force = ((mouse.radius - dist) / mouse.radius) * 200;
                    const angle = Math.atan2(dy, dx);
                    this.vx += Math.cos(angle) * force * dt;
                    this.vy += Math.sin(angle) * force * dt;
                }
            }

            // Spring return force to its original base position
            const homeDx = this.baseX - this.x;
            const homeDy = this.baseY - this.y;

            const springFx = this.stiffness * homeDx;
            const springFy = this.stiffness * homeDy;

            const dampingFx = -this.damping * this.vx;
            const dampingFy = -this.damping * this.vy;

            this.vx += (springFx + dampingFx) * dt;
            this.vy += (springFy + dampingFy) * dt;

            this.x += this.vx * dt;
            this.y += this.vy * dt;

            // Handle Resize updates
            if (this.baseX > width) this.baseX = Math.random() * width;
            if (this.baseY > height) this.baseY = Math.random() * height;
        }

        draw() {
            ctx.fillStyle = 'rgba(71, 85, 105, 0.15)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    // --- Core Animation Frame Loop ---
    let lastTime = performance.now();

    function animate(time) {
        const dt = Math.min((time - lastTime) / 1000, 0.1);
        lastTime = time;

        // 1. Update Progress Spring values
        const currentProgress = progressSpring.update(dt);
        totalProgressBar.style.width = `${Math.max(0, Math.min(100, currentProgress))}%`;
        totalText.textContent = `${Math.max(0, Math.round(currentProgress))}%`;

        // 2. Update Active Tab Indicator Springs
        const currentTabLeft = tabLeftSpring.update(dt);
        const currentTabWidth = tabWidthSpring.update(dt);
        if (activeIndicator) {
            activeIndicator.style.left = `${currentTabLeft}px`;
            activeIndicator.style.width = `${currentTabWidth}px`;
        }

        // 3. Canvas Rendering
        ctx.clearRect(0, 0, width, height);

        // Update and draw particles
        particles.forEach(p => {
            p.update(dt);
            p.draw();
        });

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.hypot(dx, dy);

                if (dist < connectionDistance) {
                    const alpha = (1 - dist / connectionDistance) * 0.1;
                    ctx.strokeStyle = `rgba(37, 99, 235, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
});
