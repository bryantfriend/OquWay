import BaseEngine from './BaseEngine.js';

export default class ReflectionEngine extends BaseEngine {
    static get id() { return 'reflection'; }
    static get version() { return '1.0.0'; }

    static get editorSchema() {
        return {
            fields: [
                { key: "prompt", label: "Reflection Question", type: "textarea", default: "What do you think?" }
            ]
        };
    }

    static get defaultConfig() {
        return {
            prompt: "Reflect on what you just learned."
        };
    }

    static render({ container, config }) {
        container.innerHTML = `
      <div class="p-6 bg-white rounded shadow-md max-w-2xl mx-auto border-t-4 border-indigo-500">
          <h3 class="font-bold text-indigo-600 uppercase mb-4">🤔 Reflection</h3>
          <p class="text-lg text-gray-800 mb-6">${config.prompt || ''}</p>
          <textarea class="w-full border-2 border-indigo-100 rounded p-4 h-32 focus:border-indigo-500 focus:outline-none" placeholder="Type your thoughts here..."></textarea>
      </div>
    `;
    }
}
