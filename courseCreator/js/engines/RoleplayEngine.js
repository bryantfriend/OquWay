import BaseEngine from './BaseEngine.js';

export default class RoleplayEngine extends BaseEngine {
    static get id() { return 'roleplay'; }
    static get version() { return '1.0.0'; }

    static get editorSchema() {
        return {
            fields: [
                { key: "prompt", label: "Scenario Prompt", type: "textarea", default: "What do you say?" },
                {
                    key: "options",
                    label: "Options (JSON Array of strings)",
                    type: "json",
                    default: ["Hello", "Goodbye", "Ignore"]
                },
                { key: "correctOption", label: "Correct Option Index (0-based)", type: "number", default: 0 },
                { key: "feedback", label: "Feedback Text", type: "text", default: "Great job!" }
            ]
        };
    }

    static get defaultConfig() {
        return {
            prompt: "You see a friend. What do you say?",
            options: ["Hola!", "Adios", "..."],
            correctOption: 0,
            feedback: "Correct! Always say hello."
        };
    }

    static render({ container, config }) {
        container.innerHTML = `
          <div class="bg-white p-6 rounded-lg shadow-lg border-l-4 border-purple-500 max-w-2xl mx-auto">
              <span class="text-xs font-bold text-purple-600 uppercase tracking-wide">Roleplay Scenario</span>
              <p class="text-xl font-medium text-gray-900 mt-2 mb-6">${config.prompt || ''}</p>
              
              <div class="space-y-3" id="options-container"></div>
              
              <div id="rp-feedback" class="mt-4 hidden p-4 rounded bg-gray-100 border text-center font-bold"></div>
          </div>
      `;

        const options = config.options || [];
        const correctIdx = parseInt(config.correctOption || 0);
        const feedbackText = config.feedback || 'Good Job!';

        const optsContainer = container.querySelector('#options-container');
        const feedbackEl = container.querySelector('#rp-feedback');

        options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = "w-full text-left p-4 rounded border hover:shadow-md transition-all text-gray-700 font-medium bg-gray-50 hover:bg-white";
            btn.textContent = opt;
            btn.onclick = () => {
                // Disable all
                Array.from(optsContainer.children).forEach(b => b.disabled = true);

                if (idx === correctIdx) {
                    btn.classList.add('bg-green-100', 'border-green-500', 'text-green-800');
                    feedbackEl.textContent = "✅ " + feedbackText;
                    feedbackEl.classList.remove('hidden', 'bg-red-100', 'text-red-800');
                    feedbackEl.classList.add('bg-green-100', 'text-green-800');
                } else {
                    btn.classList.add('bg-red-100', 'border-red-500', 'text-red-800');
                    feedbackEl.textContent = "❌ Try again.";
                    feedbackEl.classList.remove('hidden', 'bg-green-100', 'text-green-800');
                    feedbackEl.classList.add('bg-red-100', 'text-red-800');

                    // Re-enable to try again
                    setTimeout(() => {
                        Array.from(optsContainer.children).forEach(b => b.disabled = false);
                    }, 1500);
                }
            };
            optsContainer.appendChild(btn);
        });
    }
}
