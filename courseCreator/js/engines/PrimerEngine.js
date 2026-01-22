import BaseEngine from './BaseEngine.js';

export default class PrimerEngine extends BaseEngine {
    static get id() { return 'primer'; }
    static get version() { return '1.0.0'; }
    static get displayName() { return 'Primer'; }
    static get description() { return 'Introductory slide with an image and text.'; }
    static get category() { return 'content'; }
    static get tags() { return ['intro', 'image']; }

    static get editorSchema() {
        return {
            fields: [
                { key: "title", label: "Title", type: "text", translatable: true, default: "Lesson Title" },
                { key: "src", label: "Image", type: "image", default: "images/placeholder.png" },
                { key: "text", label: "Text Content", type: "textarea", translatable: true, default: "Introduction text here." }
            ]
        };
    }

    static get defaultConfig() {
        return {
            title: { en: "Lesson Title" },
            src: "images/placeholder.png",
            text: { en: "Introduction text here." }
        };
    }

    static render({ container, config, context }) {
        const src = config.src || '';
        let text = config.text || '';
        let title = config.title || '';

        // Handle Localization
        if (context?.language) {
            const lang = context.language;
            if (typeof text === 'object') text = text[lang] || text['en'] || '';
            if (typeof title === 'object') title = title[lang] || title['en'] || '';
        } else {
            // Fallback if context missing
            if (typeof text === 'object') text = text['en'] || '';
            if (typeof title === 'object') title = title['en'] || '';
        }

        // Simple check for image extension
        const isImage = src.match(/\.(jpeg|jpg|gif|png|webp)$/i) || src.startsWith('blob:') || src.includes('firebasestorage') || src.startsWith('http');

        let mediaHtml = '';
        if (src && isImage) {
            mediaHtml = `<img src="${src}" class="w-full rounded mb-4 shadow" alt="Primer Image">`;
        } else if (src) {
            mediaHtml = `<div class="bg-gray-100 p-4 rounded mb-4 text-center text-gray-500 text-xs">Media: ${src}</div>`;
        }

        container.innerHTML = `
        <div class="p-6 bg-white rounded shadow-md max-w-2xl mx-auto">
            ${mediaHtml}
            <h2 class="text-2xl font-bold mb-4 text-gray-900">${title}</h2>
            <div class="prose max-w-none text-lg leading-relaxed text-gray-800">
                ${text.replace(/\n/g, '<br>')}
            </div>
        </div>
        `;
    }
}
