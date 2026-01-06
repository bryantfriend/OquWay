import BaseStep from './BaseStep.js';

export default class ReflectionStep extends BaseStep {
    static get id() { return 'reflection'; }
    static get version() { return '1.0.0'; }

    static get editorSchema() {
        return {
            fields: [
                { key: "title", label: "Step Title", type: "text", default: "Reflection" },
                { key: "prompt", label: "Reflection Prompt", type: "textarea", default: "What did you learn?" }
            ]
        };
    }

    static get defaultConfig() {
        return {
            title: "Reflection",
            prompt: "Reflect on what you learned today."
        };
    }

    static render({ container, config }) {
        const prompt = config.prompt || "Reflection";
        container.innerHTML = `
          <div class="p-6 bg-purple-50 rounded-xl shadow-inner max-w-lg mx-auto border border-purple-100">
              <h3 class="font-bold text-purple-800 text-lg mb-4">🤔 Reflection</h3>
              <p class="mb-4 text-gray-700 font-medium">${prompt}</p>
              <textarea class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 outline-none" rows="4" placeholder="Type your thoughts here..."></textarea>
          </div>
      `;
    }
}
