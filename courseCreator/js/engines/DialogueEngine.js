import BaseEngine from './BaseEngine.js';

export default class DialogueEngine extends BaseEngine {
    static get id() { return 'dialogue'; }
    static get version() { return '1.0.0'; }

    static get editorSchema() {
        return {
            fields: [
                { key: "title", label: "Dialogue Title", type: "text", default: "Conversation" },
                {
                    key: "lines",
                    label: "Lines (JSON: [{role: 'A', text: 'Hi'}])",
                    type: "json",
                    default: [{ role: "Guide", text: "Hello!" }, { role: "You", text: "Hi there." }]
                }
            ]
        };
    }

    static get defaultConfig() {
        return {
            title: "Conversation",
            lines: [
                { role: "Guide", text: "Welcome to the course!" },
                { role: "You", text: "Thank you, happy to be here." }
            ]
        };
    }

    static render({ container, config }) {
        const lines = config.lines || [];
        const title = config.title || 'Conversation';

        const bubbles = lines.map(line => {
            const isRight = line.role?.toLowerCase() === 'user' || line.role?.toLowerCase() === 'you';
            const align = isRight ? 'justify-end' : 'justify-start';
            const bg = isRight ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none';

            return `
              <div class="flex ${align} mb-4">
                  <div class="max-w-[80%]">
                      <div class="text-xs text-gray-400 mb-1 ${isRight ? 'text-right' : ''}">${line.role}</div>
                      <div class="${bg} p-3 rounded-2xl shadow-sm px-4">
                          ${line.text || ''}
                      </div>
                  </div>
              </div>
          `;
        }).join('');

        container.innerHTML = `
          <div class="bg-white rounded-xl shadow-lg border overflow-hidden max-w-lg mx-auto flex flex-col h-[600px]">
              <div class="bg-gray-100 border-b p-4 font-bold text-center text-gray-700">
                 ${title}
              </div>
              <div class="flex-1 overflow-y-auto p-4 bg-gray-50">
                  ${bubbles}
              </div>
          </div>
      `;
    }
}
