
import BaseEngine from './BaseEngine.js';

export default class LetterRacingGameEngine extends BaseEngine {
    static get id() { return 'letterRacingGame'; }
    static get version() { return '1.0.0'; }

    static get displayName() { return 'Letter Racing'; }
    static get description() { return 'A fun game where the user catches falling letters.'; }
    static get category() { return 'game'; }
    static get tags() { return ['letters', 'speed', 'kids']; }

    static get editorSchema() {
        return {
            fields: [
                { key: "title", label: "Title", type: "text", default: "Letter Racing!" },
                { key: "letters", label: "Letters to Practice", type: "text", default: "ABCDE" },
                {
                    key: "goal", // Changed to object to match user code usage (stepData.goal.type)
                    label: "Goal Settings",
                    type: "group",
                    fields: [
                        { key: "type", label: "Goal Type", type: "select", options: [{ value: 'score', label: 'Score' }, { value: 'time', label: 'Time' }], default: "score" },
                        { key: "value", label: "Target Value", type: "number", default: 10 }
                    ]
                }
            ]
        };
    }

    static get defaultConfig() {
        return {
            title: "Letter Racing!",
            letters: "ABCDE",
            goal: { type: 'score', value: 10 }
        };
    }

    // --- HTML Structure ---
    static renderPlayer(step, lang = 'en') {
        // step is the full config object
        const letters = step.letters || 'ABCDE';
        const goal = step.goal || { type: 'score', value: 0 };

        return `
        <div id="game-wrapper" class="w-full h-full mx-auto bg-white flex flex-col p-4 sm:p-6" style="font-family: 'Fredoka One', cursive;">
            <div class="flex justify-between items-center mb-4 flex-shrink-0">
                <div class="text-center">
                    <h2 class="text-lg sm:text-xl text-gray-500">Catch this Letter:</h2>
                    <p id="target-letter" class="text-5xl sm:text-7xl font-bold text-green-500">?</p>
                </div>
                <div class="text-center">
                    <h2 id="goal-title" class="text-lg sm:text-xl text-gray-500">${goal.type === 'time' ? 'Time:' : 'Score:'}</h2>
                    <p id="score" class="text-5xl sm:text-7xl font-bold text-purple-500">0</p>
                </div>
            </div>

            <div class="relative w-full flex-grow bg-gray-600 rounded-lg overflow-hidden border-4 border-gray-700">
                <canvas id="gameCanvas" class="w-full h-full block"></canvas>
            </div>

            <div class="grid grid-cols-2 gap-4 mt-4 flex-shrink-0">
                <button id="left-btn" class="w-full bg-yellow-400 text-white py-6 rounded-lg text-3xl font-bold shadow-lg hover:bg-yellow-500 active:scale-95 transition">◀</button>
                <button id="right-btn" class="w-full bg-yellow-400 text-white py-6 rounded-lg text-3xl font-bold shadow-lg hover:bg-yellow-500 active:scale-95 transition">▶</button>
            </div>
            
             <!-- Link Font for the game -->
            <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap" rel="stylesheet">
        </div>
        `;
    }

    // --- Logic & Event Listeners ---
    static mount(container, stepData) {
        // Scoped variables for this instance
        let gameInterval;
        let letterChangeInterval;

        const canvas = container.querySelector('#gameCanvas');
        if (!canvas) {
            console.error("Game canvas not found");
            return;
        }

        const ctx = canvas.getContext('2d');
        const targetLetterEl = container.querySelector('#target-letter');
        const scoreEl = container.querySelector('#score');
        const goalTitleEl = container.querySelector('#goal-title');
        const leftBtn = container.querySelector('#left-btn');
        const rightBtn = container.querySelector('#right-btn');

        // Game State
        let score = 0;
        let timeRemaining = (stepData.goal && stepData.goal.type === 'time') ? stepData.goal.value : null;
        let targetLetter = '';
        const alphabet = stepData.letters || 'ABCDE';
        const goal = stepData.goal || { type: 'score', value: 10 };
        const car = { x: 1, y: 0, width: 0, height: 0 };
        const lanes = [0, 0, 0];
        const fallingLetters = [];
        let letterSpawnTimer = 0;
        let isGameOver = false;

        // Resize
        function resizeCanvas() {
            const parent = canvas.parentElement;
            if (!parent) return;
            // Set canvas resolution to match display size for sharpness
            const rect = parent.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;

            const laneWidth = canvas.width / 3;
            lanes[0] = laneWidth / 2;
            lanes[1] = laneWidth + laneWidth / 2;
            lanes[2] = 2 * laneWidth + laneWidth / 2;
            car.width = laneWidth * 0.6;
            car.height = car.width * 1.5;
            car.y = canvas.height - car.height - 10;
        }

        function gameLoop() {
            if (isGameOver) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawRoad();
            drawCar();
            updateFallingLetters();
            drawFallingLetters();
        }

        function startGame() {
            if (gameInterval) clearInterval(gameInterval);
            if (letterChangeInterval) clearInterval(letterChangeInterval);

            isGameOver = false;
            score = 0;
            scoreEl.textContent = (goal.type === 'time') ? goal.value : 0;
            goalTitleEl.textContent = (goal.type === 'time') ? 'Time:' : 'Score:';
            car.x = 1;
            fallingLetters.length = 0;

            changeTargetLetter();

            // Request animation frame ensures DOM is painted and size is correct
            requestAnimationFrame(() => {
                resizeCanvas();
                gameInterval = setInterval(gameLoop, 1000 / 60);

                if (goal.type === 'time') {
                    letterChangeInterval = setInterval(updateTimer, 1000);
                } else {
                    letterChangeInterval = setInterval(changeTargetLetter, 15000);
                }
            });
        }

        function updateFallingLetters() {
            letterSpawnTimer++;
            if (letterSpawnTimer > 50) {
                letterSpawnTimer = 0;
                spawnFallingLetter();
            }
            for (let i = fallingLetters.length - 1; i >= 0; i--) {
                const letter = fallingLetters[i];
                letter.y += 5;
                if (letter.y > car.y && letter.y < car.y + car.height && letter.lane === car.x) {
                    if (letter.char === targetLetter) {
                        score++;
                        scoreEl.textContent = score;
                        if (goal.type === 'score' && score >= goal.value) {
                            endGame(true);
                        }
                        // Flash Score positive
                        scoreEl.classList.add('text-green-500');
                        setTimeout(() => scoreEl.classList.remove('text-green-500'), 200);
                    } else {
                        // Wrong letter
                    }
                    fallingLetters.splice(i, 1);
                    continue;
                }
                if (letter.y > canvas.height) {
                    fallingLetters.splice(i, 1);
                }
            }
        }

        function spawnFallingLetter() {
            const lane = Math.floor(Math.random() * 3);
            // Prevent overlapping in same lane
            for (const l of fallingLetters) {
                if (l.lane === lane && l.y < 80) return;
            }
            let char = (Math.random() < 0.4) ? targetLetter : alphabet[Math.floor(Math.random() * alphabet.length)];
            fallingLetters.push({ char, lane, y: -40 });
        }

        function moveCar(direction) {
            if (isGameOver) return;
            car.x += direction;
            if (car.x < 0) car.x = 0;
            if (car.x > 2) car.x = 2;
        }

        function changeTargetLetter() {
            targetLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
            targetLetterEl.textContent = targetLetter;
        }

        function updateTimer() {
            if (timeRemaining !== null) {
                timeRemaining--;
                scoreEl.textContent = timeRemaining;
                if (timeRemaining <= 0) {
                    endGame(true);
                }
            }
        }

        function endGame(isWin) {
            isGameOver = true;
            clearInterval(gameInterval);
            clearInterval(letterChangeInterval);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = `${canvas.width / 10}px 'Fredoka One', sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(isWin ? 'You Win!' : 'Game Over', canvas.width / 2, canvas.height / 2);
        }

        function drawRoad() {
            ctx.fillStyle = '#4a5568';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 5;
            ctx.setLineDash([20, 20]);
            const laneWidth = canvas.width / 3;
            ctx.beginPath();
            ctx.moveTo(laneWidth, 0);
            ctx.lineTo(laneWidth, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(2 * laneWidth, 0);
            ctx.lineTo(2 * laneWidth, canvas.height);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        function drawCar() {
            ctx.fillStyle = 'red';
            const carX = lanes[car.x] - car.width / 2;
            ctx.fillRect(carX, car.y, car.width, car.height);
            ctx.fillStyle = '#333';
            ctx.fillRect(carX - 5, car.y + 10, 5, car.height - 20);
            ctx.fillRect(carX + car.width, car.y + 10, 5, car.height - 20);
            ctx.fillStyle = '#a0deff';
            ctx.fillRect(carX + car.width * 0.1, car.y + 10, car.width * 0.8, car.height * 0.3);
        }

        function drawFallingLetters() {
            ctx.font = `${canvas.width / 8}px 'Fredoka One', sans-serif`;
            ctx.textAlign = 'center';
            fallingLetters.forEach(letter => {
                ctx.fillStyle = letter.char === targetLetter ? 'lightgreen' : 'white';
                ctx.fillText(letter.char, lanes[letter.lane], letter.y);
            });
        }

        // Event Handlers
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') moveCar(-1);
            if (e.key === 'ArrowRight') moveCar(1);
        };

        if (leftBtn) leftBtn.addEventListener('click', () => moveCar(-1));
        if (rightBtn) rightBtn.addEventListener('click', () => moveCar(1));
        window.addEventListener('keydown', handleKeyDown);

        const resizeHandler = () => resizeCanvas();
        window.addEventListener('resize', resizeHandler);

        // Start
        startGame();

        // Cleanup method attached to container for external caller to use if needed
        // (Though standard BaseEngine.destroy might be better place, we hack it here)
        container.cleanup = () => {
            clearInterval(gameInterval);
            clearInterval(letterChangeInterval);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', resizeHandler);
        };
    }
}
