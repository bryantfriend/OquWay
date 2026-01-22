import FieldEngine from '../../../Shared/FieldEngine.js';
import { SchemaInference } from '../../modules/SchemaInference.js';

export class SchemaHandler {
    constructor(container, editorElement, languages) {
        this.container = container;
        this.editorElement = editorElement;
        this.languages = languages;
        this.currentSchema = null;
    }

    /**
     * Renders the editor form for a given config.
     * Uses SchemaInference to generate the schema from the config (or defaults).
     */
    renderForm(config, onChange, defaultConfig = {}) {
        // 1. Infer Schema from Default Config
        // We use defaultConfig as the source of truth for the schema structure.
        this.currentSchema = SchemaInference.infer(defaultConfig);

        // 2. Render using FieldEngine
        // Context can be used for passing languages in the future
        const context = { languages: this.languages };

        FieldEngine.render(
            this.container,
            this.currentSchema,
            config,
            onChange,
            context
        );
    }

    renderJsonEditor(config) {
        if (this.editorElement) {
            this.editorElement.value = JSON.stringify(config, null, 2);
        }
    }

    getJsonFromEditor() {
        try {
            return JSON.parse(this.editorElement.value);
        } catch (e) {
            throw new Error("Invalid JSON: " + e.message);
        }
    }

    highlightErrors(errors) {
        FieldEngine.showValidation(this.container, errors);
    }
}
