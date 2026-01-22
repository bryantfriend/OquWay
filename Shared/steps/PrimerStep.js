
import BaseStep from './BaseStep.js';

export default class PrimerStep extends BaseStep {
    /* ======================================================
       METADATA
    ====================================================== */
    static get id() { return 'primer'; }
    static get version() { return '1.0.0'; }
    static get displayName() { return 'Primer'; }
    static get description() { return 'Introductory slide with an image and text.'; }
    static get category() { return 'content'; }
    static get tags() { return ['intro', 'image']; }

    /* ======================================================
       VALIDATION
    ====================================================== */
    static validateConfig(config = {}) {
        const errors = [];
        // Primer is loose, but let's check basics
        if (!config.title) errors.push({ field: 'title', message: 'Title is required' });
        return { valid: errors.length === 0, errors };
    }

    /* ======================================================
       DEFAULT CONFIG
    ====================================================== */
    static get defaultConfig() {
        return {
            title: { en: "Lesson Title" },
            src: "images/placeholder.png",
            text: { en: "Introduction text here." }
        };
    }

    /* ======================================================
       EDITOR SCHEMA
    ====================================================== */
    static get editorSchema() {
        return {
            type: 'object',
            fields: [
                {
                    key: "title",
                    label: "Title",
                    type: "localizedText", // Using standardized type
                    required: true,
                    default: { en: "Lesson Title" }
                },
                {
                    key: "src",
                    label: "Image",
                    type: "image",
                    default: "images/placeholder.png"
                },
                {
                    key: "text",
                    label: "Text Content",
                    type: "localizedText", // Using standardized type (was textarea)
                    required: true,
                    default: { en: "Introduction text here." }
                }
            ]
        };
    }

    /* ======================================================
       RENDER
    ====================================================== */
    static render({ container, config, context, onComplete }) {
        const complete = this.createCompletionGuard(onComplete);
        const lang = context.language || 'en';

        const resolve = (v) => {
            if (typeof v === 'string') return v;
            return v?.[lang] || v?.en || '';
        };

        const src = config.src || '';
        const title = resolve(config.title);
        const text = resolve(config.text);

        // Simple check for image extension or blob/http
        const isImage = src.match(/\.(jpeg|jpg|gif|png|webp)$/i) || src.startsWith('blob:') || src.includes('firebasestorage') || src.startsWith('http');

        let mediaHtml = '';
        if (src && isImage) {
            mediaHtml = `<img src="${src}" class="w-full rounded-xl mb-6 shadow-md object-cover max-h-[400px]" alt="Primer Image">`;
        } else if (src) {
            mediaHtml = `<div class="bg-gray-100 p-8 rounded-xl mb-6 text-center text-gray-400 italic border-2 border-dashed border-gray-200">No Image Selected</div>`;
        }

        container.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center p-6 bg-gray-50 overflow-y-auto">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                <div class="p-8">
                    <div class="text-3xl font-extrabold text-gray-900 mb-6 tracking-tight text-center">${title}</div>
                    ${mediaHtml}
                    <div class="prose prose-lg max-w-none text-gray-600 leading-relaxed">
                        ${text}
                    </div>
                </div>
                <div class="bg-gray-50 px-8 py-6 border-t flex justify-end">
                    <button class="primer-continue-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:-translate-y-1">
                        Continue
                    </button>
                </div>
            </div>
        </div>
        `;

        const btn = container.querySelector('.primer-continue-btn');
        if (btn) {
            btn.onclick = () => complete({ success: true });
        }
    }
}
