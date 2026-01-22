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
        // Bridge to Legacy renderPlayer
        // BaseEngine subclasses (legacy) often have `renderPlayer` as an INSTANCE method or STATIC.

        // 1. Try Static
        if (typeof this.renderPlayer === 'function') {
            container.innerHTML = this.renderPlayer(config, context?.lang || 'en');
            return;
        }

        // 2. Try Instance
        try {
            const instance = new this();
            if (typeof instance.renderPlayer === 'function') {
                // Hack: pass config to instance if possible? 
                // Legacy engines usually don't take config in constructor, 
                // but rely on internal state? 
                // Actually legacy RenderPlayer didn't take config args usually, 
                // it relied on `this.config`. 
                // So we need to set it.
                instance.config = config;
                container.innerHTML = instance.renderPlayer(context?.lang || 'en');
                return;
            }
        } catch (e) {
            console.warn("Legacy instance render failed", e);
        }

        container.innerHTML = `<div class="p-4 text-red-500">Render method not implemented for ${this.id}</div>`;
    }

    /**
     * Renders the interactive preview (player view) of the step.
     * @param {string} lang - Language code
     * @returns {string} HTML string of the player view
     */
    renderPlayer(lang = 'en') {

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
