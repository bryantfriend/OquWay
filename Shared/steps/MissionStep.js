import BaseStep from './BaseStep.js';

export default class MissionStep extends BaseStep {
    static get id() { return 'mission'; }
    static get version() { return '1.0.0'; }

    static get editorSchema() {
        return {
            fields: [
                { key: "focus", label: "Grammar Focus", type: "text", default: "Present Simple" },
                { key: "explanation", label: "Explanation", type: "rich-text", default: "Use this for facts." },
            ]
        };
    }

    static get defaultConfig() {
        return {
            title: "Secret Agent Task",
            description: "Find the hidden object in the room and take a photo."
        };
    }

    static render({ container, config }) {
        const title = config.title || 'Mission';
        const desc = config.description || '';

        container.innerHTML = `
          <div class="bg-gray-900 text-white rounded-lg p-8 max-w-xl mx-auto shadow-2xl border border-gray-700">
              <div class="flex items-center justify-center mb-6">
                  <div class="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-3xl animate-pulse">
                      🕵️
                  </div>
              </div>
              <h2 class="text-2xl font-bold text-center mb-4 uppercase tracking-widest text-red-500">${title}</h2>
              <p class="text-gray-300 text-center leading-relaxed text-lg mb-8">
                  ${desc}
              </p>
              <button class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded uppercase tracking-wide transition transform hover:scale-105">
                  Accept Mission
              </button>
          </div>
      `;
    }
}
