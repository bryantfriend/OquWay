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
                { key: "src", label: "Image/Media Source URL", type: "text", default: "images/placeholder.png" },
                { key: "text", label: "Text Content", type: "textarea", default: "" }
            ]
        };
    }

    static get defaultConfig() {
        return {
            src: "images/placeholder.png",
            text: "Introduction text here."
        };
    }

    static render({ container, config }) {
        const src = config.src || '';
        const text = config.text || '';

        // Simple check for image extension
        const isImage = src.match(/\.(jpeg|jpg|gif|png|webp)$/i) || src.startsWith('blob:') || src.includes('firebasestorage');

        let mediaHtml = '';
        if (src && isImage) {
            mediaHtml = `<img src="${src}" class="w-full rounded mb-4 shadow" alt="Primer Image">`;
        } else if (src) {
            mediaHtml = `<div class="bg-gray-100 p-4 rounded mb-4 text-center text-gray-500 text-xs">Media: ${src}</div>`;
        }

        container.innerHTML = `
        <div class="p-6 bg-white rounded shadow-md max-w-2xl mx-auto">
            ${mediaHtml}
            <div class="prose max-w-none text-lg leading-relaxed text-gray-800">
                ${text.replace(/\n/g, '<br>')}
            </div>
        </div>
        `;
    }
}
