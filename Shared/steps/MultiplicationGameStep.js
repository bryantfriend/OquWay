import BaseStep from './BaseStep.js';

export default class MultiplicationGameStep extends BaseStep {
    static get id() { return 'multiplicationGame'; }
    static get version() { return '1.1.0'; } // Incremented
    static get displayName() { return 'Multiplication'; }
    static get description() { return 'Practice multiplication tables.'; }
    static get category() { return 'game'; }

    static get editorSchema() {
        return {
            fields: [
                { key: "title", label: "Step Title", type: "text", default: "Multiplication Drill" },
                { key: "factor", label: "Factor to Practice (e.g. 7)", type: "number", default: 7 },
                { key: "questions", label: "Number of Questions", type: "number", default: 5 }
            ]
        };
    }

    static get defaultConfig() {
        return {
            title: "Multiplication Drill",
            factor: 5,
            questions: 10
        };
    }

    static render({ container, config, onComplete }) {
        const factor = config.factor || 5;
        const totalQ = config.questions || 5;

        // Game State
        let currentQ = 0;
        let score = 0;

        container.innerHTML = `
        <div class="text-center p-8 bg-white border rounded-xl shadow-lg max-w-sm mx-auto">
            <h2 class="text-2xl font-bold text-gray-700 mb-2">✖️ Table of ${factor}</h2>
            <div id="game-area" class="mt-6">
                <!-- Question Here -->
            </div>
            <div id="score-area" class="mt-4 text-sm text-gray-500 font-mono">
                Score: 0 / ${totalQ}
            </div>
        </div>
      `;

        const area = container.querySelector('#game-area');
        const scoreEl = container.querySelector('#score-area');

        const ask = () => {
            if (currentQ >= totalQ) {
                area.innerHTML = `<div class="text-green-600 font-bold text-xl mb-4">You finished!</div>
                                  <div class="text-gray-600">Final Score: ${score}/${totalQ}</div>`;
                if (onComplete) onComplete({ score });
                return;
            }

            const rand = Math.floor(Math.random() * 10) + 1;
            const answer = factor * rand;

            area.innerHTML = `
             <div class="text-4xl font-bold mb-6 text-indigo-600">${factor} × ${rand} = ?</div>
             <div class="grid grid-cols-2 gap-3">
                 ${generateOptions(answer).map(opt => `
                     <button class="opt-btn p-3 border-2 border-gray-200 rounded-lg font-bold text-xl hover:bg-indigo-50 hover:border-indigo-300 transition" data-val="${opt}">
                        ${opt}
                     </button>
                 `).join('')}
             </div>
          `;

            area.querySelectorAll('.opt-btn').forEach(btn => {
                btn.onclick = () => {
                    const val = parseInt(btn.dataset.val);
                    if (val === answer) {
                        score++;
                        btn.classList.add('bg-green-100', 'border-green-500');
                    } else {
                        btn.classList.add('bg-red-100', 'border-red-500');
                    }
                    currentQ++;
                    scoreEl.textContent = `Score: ${score} / ${totalQ}`;
                    setTimeout(ask, 800);
                };
            });
        };

        const generateOptions = (answer) => {
            const opts = new Set([answer]);
            while (opts.size < 4) {
                opts.add(answer + Math.floor(Math.random() * 10) - 5); // Some random offset
            }
            return Array.from(opts).sort(() => Math.random() - 0.5);
        };

        ask();
    }
}
