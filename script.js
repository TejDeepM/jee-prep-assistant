document.addEventListener('DOMContentLoaded', () => {
    const chapterListEl = document.getElementById('chapter-list');
    const tabs = document.querySelectorAll('.tab-btn');
    const totalProgressBar = document.getElementById('total-progress');
    const totalText = document.getElementById('total-text');

    // State Management
    let userState = JSON.parse(localStorage.getItem('jee_tracker_state')) || {
        physics: {},
        chemistry: {},
        maths: {}
    };

    let currentSubject = 'physics';

    // Initialize
    renderChapters(currentSubject);
    updateOverallProgress();

    // Tab Switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
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
            card.className = 'chapter-card';
            card.dataset.level = level; // For CSS border coloring

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

                    // Logic: If clicking the same level, toggle off? Or just keep set? 
                    // Let's assume clicking same level toggles it off (reset to 0) to allow "unmarking".
                    let newLevel = val;
                    if (level === val) {
                        newLevel = 0;
                    }

                    // Update State
                    userState[subject][chapter] = newLevel;
                    saveState();

                    // Re-render this card? Or just global re-render?
                    // Global re-render is easiest to keep UI consistent, 
                    // though slightly deeper. Given list size (~25 items), it's instant.
                    renderChapters(subject);
                    updateOverallProgress();
                });
            });

            chapterListEl.appendChild(card);
        });
    }

    function saveState() {
        localStorage.setItem('jee_tracker_state', JSON.stringify(userState));
    }

    function updateOverallProgress() {
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

        totalProgressBar.style.width = `${percentage}%`;
        totalText.textContent = `${percentage}%`;
    }
});
