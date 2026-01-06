/**
 * BaseEngine.js
 * Interface definition for all Step Type Engines.
 */
export default class BaseEngine {
    constructor() {
        if (new.target === BaseEngine) {
            throw new TypeError("Cannot construct BaseEngine instances directly");
        }
    }

    /**
     * Unique ID for this engine (e.g., 'multiplicationGame', 'chatReflection')
     */
    static get id() {
        throw new Error("Engine must define static get id()");
    }

    /**
     * Semantic Version of this engine implementation
     */
    static get version() {
        return "1.0.0";
    }

    // --- Metadata for Editor/Picker ---
    static get displayName() { return this.id; }
    static get description() { return "No description available."; }
    static get category() { return "misc"; } // content, input, assessment, game, simulation
    static get tags() { return []; }


    /**
     * Validates the configuration object against the schema constraints.
     * @param {Object} config 
     * @returns {Object} { valid: boolean, errors: [] }
     */
    static validateConfig(config) {
        // Implement custom validation logic here
        // Return { valid: false, errors: [{ field: 'key', message: 'Error' }] }
        return { valid: true, errors: [] };
    }

    /**
     * Renders the player UI into the container.
     * @param {Object} params
     * @param {HTMLElement} params.container - The DOM element to render into
     * @param {Object} params.config - The specific configuration for this instance
     * @param {Object} params.context - Global context (user, courseId, etc.)
     * @param {Function} params.onComplete - Callback when step is finished (optional)
     */
    static render({ container, config, context, onComplete }) {
        container.innerHTML = `<div class="p-4 text-red-500">Render method not implemented for ${this.id}</div>`;
    }

    /**
     * Renders the interactive preview (player view) of the step.
     * @param {string} lang - Language code
     * @returns {string} HTML string of the player view
     */
    renderPlayer(lang = 'en') {
        // Default implementation needed if engines are instances?
        // Wait, BaseEngine seems to mix static and instance methods in the legacy StepTypes. 
        // But the new Engines are classes where we might need to instantiate them?
        // Let's check Canvas logic.
        // Legacy StepTypes: const step = new StepClass(data); step.renderPlayer();
        // New Engines: They are mostly Static?
        // Checking LetterRacingGameEngine: It has `static render`.
        // BUT `StepTypes.js` classes had `renderPlayer` as INSTANCE method.
        // Decision: Let's use `Canvas` to render the `renderPlayer` HTML.
        // If Engine is static, we might need `static renderPlayer(data)`?
        // Let's look at `LetterRacingGameEngine`. It extended `BaseEngine`.
        // The previous `StepTypes.js` `LetterRacingGameStep` had `renderPlayer`.
        // I need to ensure `BaseEngine` PROTOTYPE has `renderPlayer` or `STATIC` has it.
        // Since `Registry.get(type)` returns the CLASS, and we prefer static methods in new architecture?
        // OR we instantiate: `new Engine(stepData).renderPlayer()`?
        // Let's check `Registry.js` usage.
        // `SmartStepPicker` uses `Registry.getAll()`.

        // I will add `static renderPlayer(data)` to BaseEngine for simplicity.
        return `<div class="p-8 text-center border rounded bg-gray-50">
            <h3 class="font-bold text-gray-500">${this.constructor.displayName || 'Step Preview'}</h3>
            <p>Player preview not implemented.</p>
        </div>`;
    }

    // Static wrapper if we want to call it directly
    static renderPlayer(data, lang = 'en') {
        // Ideally we instantiate to reuse logic? 
        // For now simple static return.
        return `<div class="p-10 text-center text-gray-400 border-2 border-dashed rounded-lg bg-white">
            <div class="text-4xl mb-4">👀</div>
            <h2 class="text-xl font-bold text-gray-600">Preview Mode</h2>
            <p>Visualization for <b>${this.displayName}</b> is coming soon.</p>
       </div>`;
    }

    /**
     * Generates a new instance data object (randomized content) based on config.
     * This is called when a student starts the step, or when 'rolling' new content.
     * @param {Object} config 
     * @returns {Object} Instance data
     */
    static generateInstance(config) {
        return {};
    }

    /**
     * Cleanup any event listeners or timers.
     * @param {HTMLElement} container 
     */
    static destroy(container) {
        // Optional cleanup
    }
}
