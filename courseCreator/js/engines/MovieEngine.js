import BaseEngine from './BaseEngine.js';

export default class MovieEngine extends BaseEngine {
    static get id() { return 'movie'; }
    static get version() { return '1.0.0'; }

    static get editorSchema() {
        return {
            fields: [
                { key: "title", label: "Video Title", type: "text", default: "Watch this video" },
                { key: "src", label: "YouTube Embed URL", type: "text", default: "https://www.youtube.com/embed/dQw4w9WgXcQ" }
            ]
        };
    }

    static get defaultConfig() {
        return {
            title: "Course Video",
            src: "https://www.youtube.com/embed/dQw4w9WgXcQ"
        };
    }

    static render({ container, config }) {
        const src = config.src || '';
        container.innerHTML = `
      <div class="p-4 bg-black rounded shadow-lg max-w-3xl mx-auto">
          <h3 class="text-white font-bold mb-2 text-center">${config.title || ''}</h3>
          <div class="relative w-full pb-[56.25%] bg-gray-900 rounded overflow-hidden">
              <iframe class="absolute top-0 left-0 w-full h-full" src="${src}" frameborder="0" allowfullscreen></iframe>
          </div>
      </div>
    `;
    }
}
