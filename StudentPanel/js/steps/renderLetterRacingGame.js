//
// js/steps/renderLetterRacingGame.js
//

// --- Global state for this step to manage intervals ---
let gameInterval;
let letterChangeInterval;

/**
 * Renders the Letter Racing Game into the provided container.
 * @param {HTMLElement} container - The element to render the game into.
 * @param {object} stepData - The configuration for this step from Firestore.
 */
export default function renderLetterRacingGame(container, stepData) {
    // --- 1. Set up the HTML Structure ---
    container.innerHTML = `
        <div id="game-wrapper" class="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-4 sm:p-6" style="font-family: 'Fredoka One', cursive;">
            <div class="flex justify-between items-center mb-4">
                <div class="text-center">
                    <h2 class="text-lg sm:text-xl text-gray-500">Catch this Letter:</h2>
                    <p id="target-letter" class="text-5xl sm:text-7xl font-bold text-green-500">A</p>
                </div>
                <div class="text-center">
                    <h2 id="goal-title" class="text-lg sm:text-xl text-gray-500">Score:</h2>
                    <p id="score" class="text-5xl sm:text-7xl font-bold text-purple-500">0</p>
                </div>
            </div>

            <div class="relative w-full aspect-[4/5] bg-gray-600 rounded-lg overflow-hidden border-4 border-gray-700">
                <canvas id="gameCanvas"></canvas>
            </div>

            <div class="grid grid-cols-2 gap-4 mt-4">
                <button id="left-btn" class="w-full bg-yellow-400 text-white py-4 rounded-lg text-2xl font-bold shadow-lg">◀</button>
                <button id="right-btn" class="w-full bg-yellow-400 text-white py-4 rounded-lg text-2xl font-bold shadow-lg">▶</button>
            </div>
        </div>
    `;

    // --- 2. Get DOM Elements (scoped to the container) ---
    const canvas = container.querySelector('#gameCanvas');
    const ctx = canvas.getContext('2d');
    const targetLetterEl = container.querySelector('#target-letter');
    const scoreEl = container.querySelector('#score');
    const goalTitleEl = container.querySelector('#goal-title');
    const leftBtn = container.querySelector('#left-btn');
    const rightBtn = container.querySelector('#right-btn');
    
    // --- 3. Game Configuration & State ---
    let score = 0;
    let timeRemaining = stepData.goal.type === 'time' ? stepData.goal.value : null;
    let targetLetter = '';
    const alphabet = stepData.letters || 'ABCDE';
    const goal = stepData.goal || { type: 'score', value: 10 };
    const car = { x: 1, y: 0, width: 0, height: 0 };
    const lanes = [0, 0, 0];
    const fallingLetters = [];
    let letterSpawnTimer = 0;
    let isGameOver = false;

    // --- 4. Game Logic Functions ---

    function resizeCanvas() {
        const parent = canvas.parentElement;
        if (!parent) return;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
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
    
    // --- THE FIX IS IN THIS FUNCTION ---
    function startGame() {
        if(gameInterval) clearInterval(gameInterval);
        if(letterChangeInterval) clearInterval(letterChangeInterval);

        isGameOver = false;
        score = 0;
        scoreEl.textContent = (goal.type === 'time') ? goal.value : 0;
        goalTitleEl.textContent = (goal.type === 'time') ? 'Time:' : 'Score:';
        car.x = 1;
        fallingLetters.length = 0;
        
        changeTargetLetter();

        // Use requestAnimationFrame to ensure the canvas is sized
        // AFTER the browser has painted the layout. This is the fix.
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

    // --- 5. Event Listeners ---
    leftBtn.addEventListener('click', () => moveCar(-1));
    rightBtn.addEventListener('click', () => moveCar(1));
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', resizeCanvas);
    
    // Cleanup function to remove global event listeners when the step changes
    container.cleanup = () => {
        clearInterval(gameInterval);
        clearInterval(letterChangeInterval);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('resize', resizeCanvas);
    };

    function handleKeyDown(e) {
        if (e.key === 'ArrowLeft') moveCar(-1);
        if (e.key === 'ArrowRight') moveCar(1);
    }
    
    // --- 6. Initial Kick-off ---
    startGame();

    // --- All other game functions (unchanged from before) ---
    function updateFallingLetters() { letterSpawnTimer++; if (letterSpawnTimer > 50) { letterSpawnTimer = 0; spawnFallingLetter(); } for (let i = fallingLetters.length - 1; i >= 0; i--) { const letter = fallingLetters[i]; letter.y += 5; if (letter.y > car.y && letter.y < car.y + car.height && letter.lane === car.x) { if (letter.char === targetLetter) { score++; scoreEl.textContent = score; if (goal.type === 'score' && score >= goal.value) { endGame(true); } } fallingLetters.splice(i, 1); continue; } if (letter.y > canvas.height) { fallingLetters.splice(i, 1); } } }
    function spawnFallingLetter() { const lane = Math.floor(Math.random() * 3); for(const l of fallingLetters) { if(l.lane === lane && l.y < 50) return; } let char = (Math.random() < 0.4) ? targetLetter : alphabet[Math.floor(Math.random() * alphabet.length)]; fallingLetters.push({ char, lane, y: -20 }); }
    function moveCar(direction) { if (isGameOver) return; car.x += direction; if (car.x < 0) car.x = 0; if (car.x > 2) car.x = 2; }
    function changeTargetLetter() { targetLetter = alphabet[Math.floor(Math.random() * alphabet.length)]; targetLetterEl.textContent = targetLetter; }
    function updateTimer() { if (timeRemaining !== null) { timeRemaining--; scoreEl.textContent = timeRemaining; if (timeRemaining <= 0) { endGame(true); } } }
    function endGame(isWin) { isGameOver = true; clearInterval(gameInterval); clearInterval(letterChangeInterval); ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'white'; ctx.font = `${canvas.width / 10}px 'Fredoka One'`; ctx.textAlign = 'center'; ctx.fillText(isWin ? 'You Win!' : 'Game Over', canvas.width / 2, canvas.height / 2); }
    function drawRoad() { ctx.fillStyle = '#4a5568'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.strokeStyle = 'yellow'; ctx.lineWidth = 5; ctx.setLineDash([20, 20]); const laneWidth = canvas.width / 3; ctx.beginPath(); ctx.moveTo(laneWidth, 0); ctx.lineTo(laneWidth, canvas.height); ctx.stroke(); ctx.beginPath(); ctx.moveTo(2 * laneWidth, 0); ctx.lineTo(2 * laneWidth, canvas.height); ctx.stroke(); ctx.setLineDash([]); }
    function drawCar() { ctx.fillStyle = 'red'; const carX = lanes[car.x] - car.width / 2; ctx.fillRect(carX, car.y, car.width, car.height); ctx.fillStyle = '#333'; ctx.fillRect(carX - 5, car.y + 10, 5, car.height - 20); ctx.fillRect(carX + car.width, car.y + 10, 5, car.height - 20); ctx.fillStyle = '#a0deff'; ctx.fillRect(carX + car.width * 0.1, car.y + 10, car.width * 0.8, car.height * 0.3); }
    function drawFallingLetters() { ctx.font = `${canvas.width / 10}px 'Fredoka One'`; ctx.textAlign = 'center'; fallingLetters.forEach(letter => { ctx.fillStyle = letter.char === targetLetter ? 'lightgreen' : 'white'; ctx.fillText(letter.char, lanes[letter.lane], letter.y); }); }
}