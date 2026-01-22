export default class GenericSlasher extends window.CourseEngine.BaseStep {
    static get id() { return 'genericSlasher'; }
    static get version() { return '1.0.0'; }
    static get displayName() { return 'Slasher Game'; }
    static get description() { return 'A frantic sorting game where players slice correct items and avoid distractors.'; }
    static get category() { return 'game'; }



    static get defaultConfig() {
        return {
            instruction: "Slice the Primary Sources!",
            targetCategory: "Primary Sources",
            distractorCategory: "Secondary Sources",
            duration: 60,
            speed: 2,
            items: [
                { text: "Diary", isTarget: true },
                { text: "Photograph", isTarget: true },
                { text: "Textbook", isTarget: false },
                { text: "Encyclopedia", isTarget: false }
            ]
        };
    }

    static render({ container, config, onComplete }) {
        // 1. Setup Completion Guard
        const signalComplete = this.createCompletionGuard(onComplete);

        // 2. Encapsulate Style (Shadow DOM or Scoped unique ID)
        // For simplicity in this demo, we'll use a wrapper with specific classes.
        // But we inject the font first.
        if (!document.getElementById('font-press-start')) {
            const link = document.createElement('link');
            link.id = 'font-press-start';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
            document.head.appendChild(link);
        }

        container.innerHTML = `
            <style>
                .slasher-game { font-family: 'Press Start 2P', cursive; overflow: hidden; position: relative; height: 600px; width: 100%; background-color: #f3e8ff; user-select: none; }
                .slasher-game .source-item { position: absolute; padding: 12px 20px; border-radius: 8px; text-align: center; font-size: 14px; white-space: nowrap; border: 3px solid #3730a3; box-shadow: 4px 4px 0px #3730a3; background-color: #fff; transform: translateX(-50%); }
                .slasher-game .source-item.target { background-color: #dbeafe; color: #1e3a8a; }
                .slasher-game .source-item.distractor { background-color: #fee2e2; color: #991b1b; }
                .slasher-btn { background-color: #4f46e5; color: white; padding: 0.8rem 1.5rem; border: 3px solid #3730a3; box-shadow: 4px 4px 0px #3730a3; cursor: pointer; display: inline-block; margin-top: 10px; font-family: inherit; }
                .slasher-btn:active { transform: translateY(2px); box-shadow: 2px 2px 0px #3730a3; }
                #player-character { position: absolute; width: 80px; height: 100px; pointer-events: none; transition: transform 0.1s; z-index: 10; }
                #sword { transform-origin: 90% 90%; transition: transform 0.1s; }
                .slicing #sword { transform: rotate(-90deg) translate(20px, -20px); }
                .game-ui { position: absolute; top: 0; left: 0; right: 0; padding: 10px; display: flex; justify-content: space-between; font-size: 14px; color: #3730a3; z-index: 20; background: rgba(255,255,255,0.7); }
                .feedback { position: absolute; font-weight: bold; font-size: 20px; pointer-events: none; animation: floatUp 0.6s forwards; z-index: 30; }
                @keyframes floatUp { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-40px); } }
            </style>
            <div class="slasher-game" id="game-root">
                <div class="game-ui">
                    <span>Score: <span id="score">0</span></span>
                    <span>${config.targetCategory}</span>
                    <span>Time: <span id="time">${config.duration}</span></span>
                </div>
                
                <!-- Start Screen -->
                <div id="start-overlay" class="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-50 text-center p-4">
                    <h2 class="text-2xl text-purple-900 mb-2">${config.instruction}</h2>
                    <p class="text-sm text-gray-600 mb-4">Mouse/Touch to Move & Slice.<br>Avoid ${config.distractorCategory}!</p>
                    <button class="slasher-btn" id="start-btn">START</button>
                </div>

                <!-- Game Area -->
                <div id="game-area" class="w-full h-full relative">
                    <!-- Player SVG -->
                    <svg id="player-character" viewBox="-40 -40 180 200" style="left: 50%; top: 80%;">
                        <g id="sword"><rect x="80" y="-15" width="8" height="60" fill="#c0c0c0" rx="2"/><rect x="75" y="40" width="18" height="8" fill="#8d5b2d" rx="2"/><circle cx="84" cy="52" r="5" fill="#ffd700"/></g>
                        <rect x="30" y="50" width="40" height="50" fill="#4f46e5" rx="10"/>
                        <circle cx="50" cy="30" r="25" fill="#f5d0a9"/><circle cx="42" cy="28" r="3" fill="#000"/><circle cx="58" cy="28" r="3" fill="#000"/><path d="M 45 40 Q 50 45 55 40" stroke="#000" fill="none" stroke-width="2"/>
                        <rect x="35" y="100" width="10" height="20" fill="#3730a3" rx="5"/><rect x="55" y="100" width="10" height="20" fill="#3730a3" rx="5"/>
                    </svg>
                </div>
            </div>
        `;

        // 3. Game Logic
        const root = container.querySelector('#game-root');
        const gameArea = container.querySelector('#game-area');
        const player = container.querySelector('#player-character');
        const scoreEl = container.querySelector('#score');
        const timeEl = container.querySelector('#time');
        const startBtn = container.querySelector('#start-btn');
        const startOverlay = container.querySelector('#start-overlay');

        let state = {
            playing: false,
            score: 0,
            time: config.duration,
            items: [],
            lastSpawn: 0,
            mouseX: 0,
            mouseY: 0
        };

        const itemsConfig = config.items || [];
        const baseSpeed = config.speed || 2;
        let loopId;

        // Cleanup Helper
        const stopGame = () => {
            state.playing = false;
            cancelAnimationFrame(loopId);
            state.items.forEach(i => i.el.remove());
            state.items = [];
        };

        // --- Core Loop ---
        const loop = (timestamp) => {
            if (!state.playing) return;

            // Spawn
            if (timestamp - state.lastSpawn > 1500) {
                spawnItem();
                state.lastSpawn = timestamp;
            }

            // Move & Collision
            const playerRect = player.getBoundingClientRect();
            // Simple hitbox (approximate center of player)
            const pHit = {
                l: playerRect.left + 20, r: playerRect.right - 20,
                t: playerRect.top + 20, b: playerRect.bottom - 20
            };

            state.items.forEach((item, index) => {
                item.y += item.speed;
                item.el.style.top = item.y + 'px';

                // Check Bounds
                if (item.y > root.offsetHeight) {
                    item.el.remove();
                    state.items.splice(index, 1);
                    return;
                }

                // Interaction handled by 'mousemove/slice', but let's check basic overlap for "missed" logic if we wanted.
                // For now, slicing is the only interaction.
            });

            loopId = requestAnimationFrame(loop);
        };

        const spawnItem = () => {
            const tmpl = itemsConfig[Math.floor(Math.random() * itemsConfig.length)];
            const div = document.createElement('div');
            div.textContent = tmpl.text;
            div.className = `source-item ${tmpl.isTarget ? 'target' : 'distractor'}`;
            // Random X
            const x = Math.random() * (root.offsetWidth - 100) + 50;
            div.style.left = x + 'px';
            div.style.top = '-50px';

            gameArea.appendChild(div);

            state.items.push({
                el: div,
                x: x,
                y: -50,
                speed: baseSpeed + Math.random(),
                isTarget: tmpl.isTarget,
                sliced: false
            });
        };

        // --- Controls ---
        const handleMove = (e) => {
            if (!state.playing) return;
            const rect = root.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;

            // Constrain
            x = Math.max(0, Math.min(x, rect.width));
            y = Math.max(0, Math.min(y, rect.height));

            state.mouseX = x;
            state.mouseY = y;

            // Move Player (Center on mouse)
            player.style.left = (x - 40) + 'px';
            player.style.top = (y - 50) + 'px';

            // Flip
            if (e.movementX < 0) player.style.transform = 'scaleX(-1)';
            else if (e.movementX > 0) player.style.transform = 'scaleX(1)';
        };

        const handleSlice = () => {
            if (!state.playing) return;
            player.classList.add('slicing');
            setTimeout(() => player.classList.remove('slicing'), 150);

            // Check Hit
            const playerRect = player.getBoundingClientRect();

            state.items.forEach((item) => {
                if (item.sliced) return;
                const iRect = item.el.getBoundingClientRect();

                // Collision
                if (!(playerRect.right < iRect.left ||
                    playerRect.left > iRect.right ||
                    playerRect.bottom < iRect.top ||
                    playerRect.top > iRect.bottom)) {

                    // Hit!
                    item.sliced = true;
                    resolveHit(item);
                }
            });
        };

        const resolveHit = (item) => {
            item.el.style.transform = 'scale(1.5) rotate(10deg)';
            item.el.style.opacity = '0';
            setTimeout(() => { if (item.el.parentNode) item.el.remove(); }, 200);

            const fb = document.createElement('div');
            fb.className = 'feedback';
            fb.style.left = item.x + 'px';
            fb.style.top = item.y + 'px';

            if (item.isTarget) {
                state.score += 10;
                scoreEl.textContent = state.score;
                fb.textContent = "+10";
                fb.style.color = "green";
            } else {
                state.score = Math.max(0, state.score - 5);
                scoreEl.textContent = state.score;
                fb.textContent = "-5";
                fb.style.color = "red";
            }
            gameArea.appendChild(fb);
            setTimeout(() => fb.remove(), 600);
        };

        // --- Timer ---
        let timerInt;
        const startGame = () => {
            state.playing = true;
            state.score = 0;
            state.time = config.duration;
            scoreEl.textContent = 0;
            timeEl.textContent = config.duration;
            startOverlay.classList.add('hidden');

            loopId = requestAnimationFrame(loop);

            timerInt = setInterval(() => {
                state.time--;
                timeEl.textContent = state.time;
                if (state.time <= 0) {
                    endGame();
                }
            }, 1000);
        };

        const endGame = () => {
            stopGame();
            clearInterval(timerInt);
            // Signal Completion
            signalComplete({ success: true, score: state.score });

            // Show End Screen
            container.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center bg-purple-50 text-center font-press-start">
                    <h2 class="text-3xl text-purple-900 mb-4">Round Over!</h2>
                    <p class="text-xl mb-6">Score: ${state.score}</p>
                    <button class="bg-blue-600 text-white px-6 py-3 rounded shadow hover:bg-blue-700" onclick="this.closest('.step-container').reload()">Play Again</button>
                    ${state.score > 50 ? '<p class="mt-4 text-green-600">Great Job!</p>' : ''}
                </div>
            `;
            // Note: simplistic reload button, normally handled by engine or parent.
        };

        // Attach Listeners
        startBtn.onclick = startGame;
        root.onmousemove = handleMove;
        root.onmousedown = handleSlice;
        // Touch support
        root.ontouchmove = (e) => {
            e.preventDefault();
            handleMove(e.touches[0]);
        };
        root.ontouchstart = (e) => {
            handleMove(e.touches[0]);
            handleSlice();
        };

        // 4. Cleanup
        container.cleanup = () => {
            stopGame();
            clearInterval(timerInt);
            root.onmousemove = null;
            root.onmousedown = null;
        };
    }
}
