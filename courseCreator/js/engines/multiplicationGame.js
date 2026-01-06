import BaseEngine from './BaseEngine.js';

export default class MultiplicationGame extends BaseEngine {
    static get id() { return 'multiplicationGame'; }
    static get version() { return '1.0.0'; }

    // 1. Editor Configuration Schema (V2 Groups)
    static get editorSchema() {
        return {
            groups: [
                {
                    id: "general",
                    label: "General Settings",
                    fields: [
                        { key: "title", label: "Game Title", type: "text", default: "Math Blaster" },
                        { key: "allowRetries", label: "Allow Retries", type: "boolean", default: true }
                    ]
                },
                {
                    id: "difficulty",
                    label: "Difficulty & Range",
                    fields: [
                        { key: "num1Min", label: "Number 1 Min", type: "number", default: 1, min: 1, max: 20 },
                        { key: "num1Max", label: "Number 1 Max", type: "number", default: 10, min: 1, max: 20 },
                        { key: "num2Min", label: "Number 2 Min", type: "number", default: 1, min: 1, max: 20 },
                        { key: "num2Max", label: "Number 2 Max", type: "number", default: 10, min: 1, max: 20 },
                        { key: "roundCount", label: "Questions", type: "slider", min: 3, max: 20, default: 5 }
                    ]
                }
            ]
        };
    }

    // 2. Default Configuration
    static get defaultConfig() {
        return {
            title: "Math Practice",
            num1Min: 2, num1Max: 9,
            num2Min: 2, num2Max: 9,
            roundCount: 5,
            allowRetries: true
        };
    }

    // 3. Validation Logic (V2)
    static validateConfig(config) {
        const errors = [];
        if (config.num1Min >= config.num1Max) {
            errors.push({ field: 'num1Min', message: 'Min must be less than Max' });
            errors.push({ field: 'num1Max', message: 'Max must be greater than Min' });
        }
        if (config.num2Min >= config.num2Max) {
            errors.push({ field: 'num2Min', message: 'Min must be less than Max' });
            errors.push({ field: 'num2Max', message: 'Max must be greater than Min' });
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }

    // 4. Render (Same as before)
    static render({ container, config, context, onComplete }) {
        // Basic Styles
        container.innerHTML = `
      <div class="multiplication-game bg-indigo-50 p-6 rounded-xl border border-indigo-200 text-center max-w-md mx-auto">
        <h2 class="text-2xl font-bold text-indigo-700 mb-4">${config.title || 'Multiplication Game'}</h2>
        
        <div id="game-area">
           <button id="start-btn" class="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold shadow hover:bg-indigo-700 transition">
             Start Game
           </button>
        </div>
        
        <div id="status-bar" class="mt-4 text-sm text-gray-500 hidden">
           Round <span id="current-round">1</span> / ${config.roundCount}
        </div>
      </div>
    `;

        const gameArea = container.querySelector('#game-area');
        const startBtn = container.querySelector('#start-btn');
        const statusBar = container.querySelector('#status-bar');
        const currentRoundEl = container.querySelector('#current-round');

        let round = 0;
        let score = 0;
        let currentQ = null;

        // Game Logic
        const nextRound = () => {
            round++;
            if (round > config.roundCount) {
                endGame();
                return;
            }

            currentRoundEl.textContent = round;
            currentQ = generateQuestion(config);
            renderQuestion(currentQ);
        };

        const generateQuestion = (cfg) => {
            // Helper rand
            const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
            const n1 = rand(cfg.num1Min || 1, cfg.num1Max || 10);
            const n2 = rand(cfg.num2Min || 1, cfg.num2Max || 10);
            return { n1, n2, ans: n1 * n2 };
        };

        const renderQuestion = (q) => {
            gameArea.innerHTML = `
        <div class="animate-fade-in">
           <div class="text-6xl font-black text-gray-800 mb-6 font-mono">
              ${q.n1} × ${q.n2} = ?
           </div>
           <div class="grid grid-cols-2 gap-3">
              ${generateOptions(q).map(opt => `
                 <button class="opt-btn bg-white border-2 border-gray-300 py-4 text-xl font-bold rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition" data-val="${opt}">
                   ${opt}
                 </button>
              `).join('')}
           </div>
        </div>
      `;

            gameArea.querySelectorAll('.opt-btn').forEach(btn => {
                btn.onclick = () => checkAnswer(parseInt(btn.dataset.val), btn);
            });
        };

        const generateOptions = (q) => {
            const opts = new Set([q.ans]);
            while (opts.size < 4) {
                const offset = Math.floor(Math.random() * 10) - 5;
                const fake = q.ans + offset;
                if (fake > 0 && fake !== q.ans) opts.add(fake);
            }
            return Array.from(opts).sort(() => Math.random() - 0.5);
        };

        const checkAnswer = (val, btn) => {
            if (val === currentQ.ans) {
                // Correct
                btn.classList.add('bg-green-500', 'text-white', 'border-green-500');
                score++;
                setTimeout(nextRound, 800);
            } else {
                // Wrong
                btn.classList.add('bg-red-500', 'text-white', 'border-red-500');
                if (!config.allowRetries) {
                    setTimeout(nextRound, 800);
                }
            }
        };

        const endGame = () => {
            gameArea.innerHTML = `
        <div class="py-6">
          <div class="text-4xl mb-2">🏆</div>
          <h3 class="text-xl font-bold mb-2">Game Over!</h3>
          <p class="text-gray-600">Score: ${score} / ${config.roundCount}</p>
          <button id="restart-btn" class="mt-6 text-indigo-600 font-semibold underline">Play Again</button>
        </div>
      `;
            statusBar.classList.add('hidden');
            if (onComplete) onComplete({ score, max: config.roundCount });

            container.querySelector('#restart-btn').onclick = () => {
                // Reload
                MultiplicationGame.render({ container, config, context, onComplete });
            };
        };

        // Start Listener
        startBtn.onclick = () => {
            startBtn.classList.add('hidden');
            statusBar.classList.remove('hidden');
            nextRound();
        };
    }
}
