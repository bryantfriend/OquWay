import BaseEngine from './BaseEngine.js';

export default class IntentCheckEngine extends BaseEngine {
    static get id() { return 'intentCheck'; }
    static get version() { return '1.0.0'; }

    static get editorSchema() {
        return {
            fields: [
                { key: "question", label: "Question", type: "textarea", default: "What is your goal?" },
                {
                    key: "options",
                    label: "Options (JSON Array of strings)",
                    type: "json",
                    default: ["Learn Basics", "Master Advanced", "Just exploring"]
                }
            ]
        };
    }

    static get defaultConfig() {
        return {
            question: "What would you like to achieve?",
            options: ["Learn new skills", "Review existing knowledge", "Just browsing"]
        };
    }

    static render({ container, config, onComplete }) {
        const question = config.question || "Question?";
        const options = config.options || [];

        container.innerHTML = `
          <div class="p-6 bg-white rounded shadow-md max-w-lg mx-auto">
              <h3 class="font-bold text-gray-900 text-lg mb-6">${question}</h3>
              <div class="space-y-2" id="options-container">
                  <!-- Options -->
              </div>
          </div>
    `;

        const optsContainer = container.querySelector('#options-container');

        options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = "w-full text-left p-4 border rounded hover:bg-blue-50 hover:border-blue-300 transition mb-2 flex items-center gap-3 group";
            btn.innerHTML = `
              <span class="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center group-hover:border-blue-500 font-bold text-gray-400 group-hover:text-blue-500">${i + 1}</span>
              <span class="font-medium text-gray-700 group-hover:text-blue-700">${opt}</span>
        `;
            btn.onclick = () => {
                // Handle selection
                if (onComplete) onComplete({ selected: opt, index: i });
                // Visual feedback
                btn.classList.add('bg-blue-100', 'border-blue-500');
            };
            optsContainer.appendChild(btn);
        });
    }
}
