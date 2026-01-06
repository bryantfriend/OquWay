import BaseEngine from './BaseEngine.js';

export default class MissionEngine extends BaseEngine {
    static get id() { return 'mission'; }
    static get version() { return '1.0.0'; }
    static get displayName() { return 'Mission'; }
    static get description() { return 'A real-world task for the user to complete.'; }
    static get category() { return 'input'; }
    static get tags() { return ['task', 'upload']; }

    static get editorSchema() {
        return {
            fields: [
                { key: "prompt", label: "Mission Prompt", type: "textarea", default: "Your mission is..." }
            ]
        };
    }

    static get defaultConfig() {
        return {
            prompt: "Your mission is to explore the world."
        };
    }

    static render({ container, config }) {
        container.innerHTML = `
        <div class="p-6 bg-white rounded shadow-md max-w-2xl mx-auto border-t-4 border-yellow-500">
            <h3 class="font-bold text-yellow-600 uppercase mb-2">🚀 Mission</h3>
            <p class="text-xl font-medium text-gray-900">${config.prompt || ''}</p>
            <div class="mt-4 p-4 bg-yellow-50 rounded border border-yellow-100 text-yellow-800 text-sm italic">
                (User would upload a photo or text response here)
            </div>
        </div>
        `;
    }
}
