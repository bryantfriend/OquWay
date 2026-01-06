import BaseEngine from './BaseEngine.js';

export default class AudioLessonEngine extends BaseEngine {
    static get id() { return 'audioLesson'; }
    static get version() { return '1.0.0'; }

    static get editorSchema() {
        return {
            fields: [
                { key: "title", label: "Lesson Title", type: "text", default: "Vocabulary" },
                {
                    key: "items",
                    label: "Vocabulary Items (JSON: [{word: 'Gato', translation: 'Cat'}])",
                    type: "json",
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

    static render({ container, config }) {
        const title = config.title || 'Vocabulary';
        // Handle potential legacy structure or flat structure
        let items = config.items || [];
        if (!Array.isArray(items)) items = [];

        const rows = items.map(item => `
          <div class="flex items-center justify-between p-3 border-b last:border-0 hover:bg-gray-50">
              <div>
                  <div class="font-bold text-gray-800">${item.word || ''}</div>
                  <div class="text-sm text-gray-500">${item.translation || ''}</div>
              </div>
              <button class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200">
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
    }
}
