import BaseStep from './BaseStep.js';

export default class MovieStep extends BaseStep {
    static get id() { return 'movie'; }

    // Example of simple step with just one field
    static get editorSchema() {
        return {
            fields: [
                { key: "title", label: "Step Title", type: "text", default: "Movie Time" },
                { key: "url", label: "Video URL (Embed)", type: "text", default: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
                { key: "caption", label: "Caption", type: "text", default: "Watch this video" }
            ]
        };
    }

    static get defaultConfig() {
        return {
            title: "Movie Time",
            url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            caption: "Introduction Video"
        };
    }

    static render({ container, config }) {
        const url = config.url || '';
        const caption = config.caption || '';

        container.innerHTML = `
            <div class="flex flex-col items-center max-w-3xl mx-auto">
                <div class="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg mb-4">
                    <iframe 
                        src="${url}" 
                        class="w-full h-full" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen
                        loading="lazy">
                    </iframe>
                </div>
                <p class="text-gray-600 italic text-center">${caption}</p>
            </div>
        `;
    }
}
