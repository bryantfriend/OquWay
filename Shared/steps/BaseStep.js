/**
 * BaseStep.js
 * Foundation contract for all OquWay Step Types
 * Enforces structure, quality baselines, and safe lifecycle behavior
 */

export default class BaseStep {
    constructor() {
        if (new.target === BaseStep) {
            throw new TypeError("Cannot construct BaseStep instances directly");
        }
    }

    /* ======================================================
       REQUIRED METADATA (ENFORCED)
    ====================================================== */

    static get id() {
        throw new Error("Step must define static get id()");
    }

    static get version() {
        return "1.0.0";
    }

    static get displayName() {
        return this.id;
    }

    static get description() {
        return "No description provided.";
    }

    static get category() {
        return "misc";
    }

    static get tags() {
        return [];
    }

    /**
     * Indicates whether this step requires student-only runtime
     * (games, quizzes, interactions).
     * Editors may render placeholders instead of calling render().
     */
    static get isInteractive() {
        return false;
    }

    /* ======================================================
       CONFIG CONTRACT (STRICT)
    ====================================================== */

    static get defaultConfig() {
        throw new Error("Step must define static get defaultConfig()");
    }

    /* ======================================================
       EXPERIENCE CONTRACT (STRICT)
    ====================================================== */

    static get experienceContract() {
        return {
            requires: ["completionSignal"],
            recommends: []
        };
    }

    /**
     * Default validation logic.
     * Returns { valid: boolean, errors: [] }
     */
    static validateConfig(config = {}) {
        return { valid: true, errors: [] };
    }

    /* ======================================================
       COMPLETION GUARD (CORE MECHANIC)
    ====================================================== */

    static createCompletionGuard(onComplete) {
        let completed = false;

        return (payload = { success: true }) => {
            if (completed) {
                console.warn(
                    `[BaseStep] ${this.id} attempted to signal completion twice. Ignored.`
                );
                return;
            }
            completed = true;

            if (typeof onComplete === "function") {
                onComplete(payload);
            } else {
                console.warn(
                    `[BaseStep] ${this.id} finished, but no onComplete handler was provided.`
                );
            }
        };
    }

    /* ======================================================
       RENDER CONTRACT (STRICT)
    ====================================================== */

    static assertRenderArgs({ container }) {
        if (!container || !(container instanceof HTMLElement)) {
            // Fallback check in case HTMLElement is from a different context or instanceof fails
            if (container && typeof container.appendChild === 'function') return;
            throw new Error("render() requires a valid container HTMLElement");
        }
    }

    /**
     * Renders the step UI.
     * @param {HTMLElement} container - DOM element to render into
     * @param {Object} config - Step configuration (defaultConfig or saved data)
     * @param {Object} context - Runtime context
     * @param {boolean} context.commit - If true, completion should be persisted. If false, completion is simulated.
     * @param {Function} onComplete - Callback when step is completed.
     */
    static render({ container, config, context, onComplete }) {
        this.assertRenderArgs({ container });

        container.innerHTML = `
            <div class="p-6 text-red-600 bg-red-50 border border-red-200 rounded">
                <strong>${this.displayName}</strong><br/>
                Render method not implemented.
            </div>
        `;

        // Fallback: Check for legacy renderPlayer (static)
        if (typeof this.renderPlayer === 'function') {
            container.innerHTML = this.renderPlayer(
                config,
                context?.lang || 'en'
            );
            return;
        }

        // Safety check for instance renderPlayer
        try {
            const instance = new this();
            if (typeof instance.renderPlayer === 'function') {
                container.innerHTML = instance.renderPlayer(
                    context?.lang || 'en'
                );
                console.warn(
                    `[BaseStep] ${this.id} uses instance renderPlayer(). Please upgrade to static render().`
                );
                return;
            }
        } catch (e) { }

        console.error(`[BaseStep] ${this.id} must implement static render()`);
    }

    /* ======================================================
       METADATA & TELEMETRY (NEW)
    ====================================================== */

    /**
     * Emits a heartbeat event for real-time tracking.
     * @param {Object} context - Runtime context containing classId, moduleId, etc.
     */
    static emitHeartbeat(context) {
        if (!context || !context.classId) return;

        const event = new CustomEvent('step-heartbeat', {
            detail: {
                stepId: this.id,
                classId: context.classId,
                moduleId: context.moduleId,
                studentId: context.studentId,
                timestamp: new Date().toISOString()
            },
            bubbles: true
        });
        document.dispatchEvent(event);
    }

    /**
     * Starts a heartbeat interval. 
     * Returns a cleanup function.
     */
    static startHeartbeat(context, intervalMs = 15000) {
        this.emitHeartbeat(context);
        const interval = setInterval(() => this.emitHeartbeat(context), intervalMs);
        return () => clearInterval(interval);
    }

    /* ======================================================
       CLEANUP SAFETY
    ====================================================== */

    static destroy(container) {
        if (container && typeof container.cleanup === "function") {
            try {
                container.cleanup();
            } catch (e) {
                console.warn(`[BaseStep] ${this.id} cleanup failed`, e);
            }
        }
    }
}
