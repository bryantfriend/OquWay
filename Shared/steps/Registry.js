/**
 * Registry.js
 * Central registration for all Step Types.
 * NOW CLOUD-NATIVE: Fetches all types from Firestore.
 */

import '../speech.js'; // Global speech service

// import { db } from '../../courseCreator/firebase-init.js'; // REMOVED dependency
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import BaseStep from './BaseStep.js';
import { resolveLocalized } from './utils.js';

// Local Built-in Steps
// import GenericSlasher from './GenericSlasher.js';
import SlideStep from './SlideStep.js';
import PrimerStep from './PrimerStep.js';


// Global Shim for Dynamic Steps
window.CourseEngine = window.CourseEngine || {};
window.CourseEngine.BaseStep = BaseStep;
window.CourseEngine.utils = { ...(window.CourseEngine.utils || {}), resolveLocalized };

export const Registry = {
    steps: new Map(),
    db: null, // Store injected DB
    initPromise: null, // Singleton promise for init

    async init(database) {
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            console.log("🚀 Registry: Initializing...");
            if (database) {
                this.db = database;
            }

            // 1. Register Built-ins
            try {
                this.register(SlideStep);
                this.register(PrimerStep);
                console.log("✅ Registry: Registered built-in steps (SlideStep, PrimerStep)");
            } catch (e) {
                console.error("❌ Registry: Failed to register built-ins:", e);
            }

            // 2. Fetch Cloud Steps (Only if DB is available)
            if (this.db) {
                try {
                    console.log("☁️ fetching system_step_types...");
                    const querySnapshot = await getDocs(collection(this.db, "system_step_types"));

                    const loadPromises = querySnapshot.docs.map(async (doc) => {
                        const id = doc.id.toLowerCase();

                        // Protect built-ins (Requirement: local beats cloud for core types)
                        if (this.steps.has(id)) {
                            console.log(`[Registry] Skipping cloud implementation for [${id}] (already registered locally)`);
                            return;
                        }

                        const data = doc.data();
                        if (!data.code) return;
                        await this.loadAndRegisterStep(doc.id, data.code);
                    });

                    await Promise.all(loadPromises);

                } catch (err) {
                    console.error("Failed to load cloud steps:", err);
                }

            }

            console.log("Registry initialized with", this.steps.size, "steps");
        })();

        return this.initPromise;
    },

    register(StepClass) {
        if (!StepClass || !StepClass.id) {
            console.error("❌ Registry: Invalid StepClass provided", StepClass);
            return;
        }

        const id = StepClass.id.toLowerCase();

        if (StepClass.experienceContract) {
            StepClass.__experience = StepClass.experienceContract;
        }

        this.steps.set(id, StepClass);
        console.log(`✅ Registry: Registered step [${id}]`);
    },

    /**
     * Explicitly register a cloud-loaded step
     */
    registerCloud(StepClass, { cloudId, status } = {}) {
        if (!StepClass || !StepClass.id) {
            console.error("Invalid StepClass provided to Registry.registerCloud", StepClass);
            return;
        }

        StepClass.isCloud = true;
        StepClass.cloudId = cloudId || StepClass.id;
        StepClass.status = status || 'draft';

        this.register(StepClass);
        console.log(`☁️ Registered Cloud Step: ${StepClass.id}`);
    },

    get(id) {
        if (!id) return null;
        const normalizedId = id.toLowerCase();
        if (!this.steps.has(normalizedId)) {
            // console.warn(`Step type '${id}' not found in Registry.`);
            return null;
        }
        return this.steps.get(normalizedId);
    },

    getAll() {
        return Array.from(this.steps.values());
    },

    /**
     * Helper to load code from string and register it.
     */
    async loadAndRegisterStep(id, code) {
        try {
            // Create Blob URL
            // --- Defensive cleanup for legacy cloud steps ---
            code = code.replace(
                /import\s+.*BaseStep.*\n?/g,
                'const BaseStep = window.CourseEngine.BaseStep;\n'
            );

            const blob = new Blob([code], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);

            // Dynamic Import
            // Note: We might need a cache buster if URL is reused, but createObjectURL makes unique ones.
            const module = await import(url);
            const StepClass =
                module.default ||
                module.__OQUWAY_CLOUD_STEP__ ||
                window.__OQUWAY_CLOUD_STEP__;

            if (StepClass) {
                // Register Cloud Step explicitly
                this.registerCloud(StepClass, { cloudId: id });

                if (typeof StepClass.validateConfig === "function") {
                    try {
                        const configToValidate = StepClass.defaultConfig || {};
                        const result = StepClass.validateConfig(configToValidate);

                        // Resilience: Handle both boolean and { valid, errors } returns
                        const isValid = (typeof result === 'object' && result !== null) ? result.valid : result;
                        const errors = (typeof result === 'object' && result !== null) ? (result.errors || []) : [];

                        if (!isValid) {
                            console.warn(
                                `[Registry] Step ${StepClass.id} has invalid defaultConfig:`,
                                errors.length ? errors : "Unknown validation error"
                            );
                        }
                    } catch (e) {
                        // Don't crash registration for validation logic errors, but warn
                        console.warn(`[Registry] Validation crashed for ${StepClass.id}:`, e);
                    }
                } else if (!StepClass.defaultConfig) {
                    // Just a hint
                    console.debug(`[Registry] Note: Step ${StepClass.id} has no defaultConfig.`);
                }

                return StepClass;
            }
        } catch (err) {
            console.error(`❌ Failed to load Cloud Step ${id}:`, err);

            // FALLBACK: Register a "Broken" step so it can be fixed in Editor
            const brokenId = id;
            class BrokenStep extends BaseStep {
                static get id() { return brokenId; }
                static get displayName() { return `⚠ Broken: ${brokenId}`; }
                static get version() { return '0.0.0'; }
                static get description() { return 'Failed to load code. Check Code tab.'; }
                static get category() { return 'system'; }
                static get isCloud() { return true; }
                static get cloudId() { return brokenId; }
                static get editorSchema() {
                    return { fields: [{ key: 'error', label: 'Load Error', type: 'text', default: err.message }] };
                }
                static get defaultConfig() { return { error: err.message }; }
                static render({ container, config }) {
                    container.innerHTML = `
                <div class="p-6 bg-red-50 border border-red-300 rounded-lg text-center">
                    <h2 class="text-xl font-bold text-red-700 mb-2">⚠ Step Failed to Load</h2>
                    <p class="text-sm text-red-600 mb-4">Syntax error or runtime exception.</p>
                    <pre class="bg-white p-3 text-xs text-red-800 rounded text-left overflow-auto border border-red-200">${config?.error}</pre>
                </div>
            `;
                }
            }
            // Register the broken step
            this.register(BrokenStep);
            throw err; // Re-throw so caller knows it failed
        }
    },

    /**
     * Hot-reload a step by ID with new code.
     */
    async reloadCloudStep(id, newCode) {
        console.log(`🔄 Hot-Reloading Step ${id}...`);
        return await this.loadAndRegisterStep(id, newCode);
    }
};
