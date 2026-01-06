/**
 * TemplateStep.js
 * 
 * Copy this file to create a new step type.
 * 1. Rename the file (e.g., MyNewStep.js).
 * 2. Update the class name to match the file name.
 * 3. Update the static 'id' (must be unique).
 * 4. Define your editorSchema (for the Creator UI).
 * 5. Define your static render() method (for the Player/Preview).
 * 6. Register this step in Registry.js.
 */

import BaseStep from './BaseStep.js';

export default class TemplateStep extends BaseStep {
    // Unique ID for the system (used in Registry)
    static get id() { return 'templateStep'; }

    // Display metadata
    static get displayName() { return 'New Step'; }
    static get description() { return 'Description of what this step does.'; }
    static get category() { return 'content'; } // 'content', 'game', 'input', 'misc'

    /**
     * Editor Configuration
     * Defines what fields appear in the Inspector panel.
     */
    static get editorSchema() {
        return {
            fields: [
                { key: "title", label: "Step Title", type: "text", default: "My New Step" },
                { key: "content", label: "Content", type: "textarea", default: "Hello World" }
                // Add more fields here (text, number, boolean, array, json, etc.)
            ]
        };
    }

    /**
     * Default Configuration
     * The initial data when this step is first added to a course.
     */
    static get defaultConfig() {
        return {
            title: "My New Step",
            content: "Hello World"
        };
    }

    /**
     * Render Method
     * This is what the student sees (and the creator preview).
     * @param {HTMLElement} container - The DOM element to render into.
     * @param {Object} config - The step configuration (values from the editor).
     */
    static render({ container, config }) {
        const title = config.title || 'Untitled';
        const content = config.content || '';

        container.innerHTML = `
            <div class="p-6 bg-white rounded-lg shadow-sm border text-center">
                <h2 class="text-2xl font-bold mb-4">${title}</h2>
                <p class="text-gray-600">${content}</p>
                <div class="mt-4 p-4 bg-gray-50 rounded text-sm text-gray-500">
                    This is your custom step rendering!
                </div>
            </div>
        `;
    }
}
