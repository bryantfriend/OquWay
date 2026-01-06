import BaseStep from './BaseStep.js';

export default class AudioLessonStep extends BaseStep {
    static get id() { return 'audioLesson'; }
    static get version() { return '1.0.0'; }

    static get editorSchema() {
        return {
            fields: [
                { key: "title", label: "Lesson Title", type: "text", default: "Vocabulary" },
                {
                    key: "items",
                    label: "Vocabulary Items",
                    type: "array",
                    itemSchema: [
                        { key: "word", label: "Word", type: "text", default: "" },
                        { key: "translation", label: "Translation", type: "text", default: "" }
                    ],
                    default: [{ word: "Hola", translation: "Hello" }, { word: "Mundo", translation: "World" }]
                }
            ]
        };
    }

    static get defaultConfig() {
        return {
            title: "Key Vocabulary",
            items: [
                { word: "Hola", translation: "Hello" },
                { word: "Adiós", translation: "Goodbye" }
            ]
        };
    }

    static render({ container, config, context }) {
        const title = config.title || 'Vocabulary';
        // Use speechUtils from context if available, or mock/fallback
        const speak = context?.speechUtils?.speakWithProfile || ((text) => {
            console.log("Speaking (Fallback):", text);
            if ('speechSynthesis' in window) {
                const u = new SpeechSynthesisUtterance(text);
                u.lang = 'es-ES'; // Default fallback assumption for audio lessons? Or 'en-US'?
                // Ideally detect from word, but context.speechUtils is key.
                window.speechSynthesis.speak(u);
            }
        });
        // Handle potential legacy structure or flat structure
        let items = config.items || [];
        if (!Array.isArray(items)) items = [];

        const rows = items.map(item => `
          <div class="flex items-center justify-between p-3 border-b last:border-0 hover:bg-gray-50">
              <div>
                  <div class="font-bold text-gray-800">${item.word || ''}</div>
                  <div class="text-sm text-gray-500">${item.translation || ''}</div>
              </div>
              <button class="audio-btn w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 hover:scale-110 transition" data-word="${item.word || ''}">
                  🔊
              </button>
          </div>
      `).join('');


        container.innerHTML = `
          <div class="bg-white rounded shadow-md max-w-md mx-auto overflow-hidden">
              <div class="bg-blue-600 p-4 text-white">
                  <h3 class="font-bold text-center">${title}</h3>
              </div>
              <div>${rows}</div>
          </div>
      `;

        // Attach listeners
        container.querySelectorAll('.audio-btn').forEach(btn => {
            btn.onclick = () => {
                const word = btn.dataset.word;
                if (word) speak(word, "female_en_soft"); // Use a default or config profile

                // Visual feedback
                btn.classList.add('ring-2', 'ring-blue-400', 'bg-blue-200');
                setTimeout(() => btn.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-200'), 500);
            };
        });
    }
}
