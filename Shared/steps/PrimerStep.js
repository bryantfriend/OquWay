import BaseStep from './BaseStep.js';

export default class PrimerStep extends BaseStep {
    static get id() { return 'primer'; }

    static get editorSchema() {
        return {
            fields: [
                { key: "title", label: "Title", type: "text", default: "Instructions" },
                { key: "image", label: "Image URL", type: "text", default: "" }, // New Image Field
                { key: "text", label: "Body Text", type: "rich-text", default: "Welcome to this lesson." }
            ]
        };
    }

    static get defaultConfig() {
        return {
            title: "Lesson Primer",
            image: "https://via.placeholder.com/600x300",
            text: "In this lesson, we will cover the basics of Greeting."
        };
    }

    static render({ container, config }) {
        const title = config.title || '';
        const text = config.text || '';
        const image = config.image || '';

        const imgTag = image ? `<img src="${image}" class="w-full h-48 object-cover rounded-md mb-4" alt="Primer Image" loading="lazy">` : '';

        container.innerHTML = `
            <div class="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
                ${imgTag}
                <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">${title}</h2>
                <div class="prose text-gray-600 leading-relaxed">
                    ${text}
                </div>
                <div class="mt-8 flex justify-center">
                    <button class="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition shadow">
                        Continue
                    </button>
                </div>
            </div>
        `;
    }
}
