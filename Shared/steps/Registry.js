/**
 * Registry.js
 * Central registration for all Step Types.
 * NOW CLOUD-NATIVE: Fetches all types from Firestore.
 */

// import { db } from '../../courseCreator/firebase-init.js'; // REMOVED dependency
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import BaseStep from './BaseStep.js';
import { resolveLocalized } from './utils.js';

// Global Shim for Dynamic Steps
window.CourseEngine = {
    BaseStep,
    utils: { resolveLocalized }
};

export const Registry = {
    steps: new Map(),
    db: null, // Store injected DB
    initPromise: null, // Singleton promise for init

    async init(database) {
        // If already initializing or initialized, return the existing promise
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            if (database) {
                this.db = database;
            } else {
                console.warn("Registry.init() called without DB instance. Cloud steps checks might fail if not already set.");
            }

            // 1. Register Built-ins (None left! All Cloud now)
            // If there are any absolutely required local Steps (e.g. a bootstrap step), import/register here.
            // For now, we assume ALL are valid in cloud.

            // 2. Fetch Cloud Steps (Only if DB is available)
            if (this.db) {
                try {
                    console.log("☁️ fetching system_step_types...");
                    const querySnapshot = await getDocs(collection(this.db, "system_step_types"));

                    const loadPromises = querySnapshot.docs.map(async (doc) => {
                        const data = doc.data();
                        if (!data.code) return;

                        try {
                            // Create Blob URL
                            const blob = new Blob([data.code], { type: 'application/javascript' });
                            const url = URL.createObjectURL(blob);

                            // Dynamic Import
                            const module = await import(url);
                            const StepClass =
                                module.default ||
                                module.__OQUWAY_CLOUD_STEP__ ||
                                window.__OQUWAY_CLOUD_STEP__;


                            if (StepClass) {
                                // Mark as cloud source for Editor
                                StepClass.isCloud = true;
                                StepClass.cloudId = doc.id;
                                this.register(StepClass);
                                console.log(`✅ Loaded Cloud Step: ${StepClass.id}`);
                            }
                        } catch (err) {
                            console.error(`❌ Failed to load Cloud Step ${doc.id}:`, err);

                            // FALLBACK: Register a "Broken" step so it can be fixed in Editor
                            const brokenId = doc.id;
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
                        }
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
            console.error("Invalid StepClass provided to Registry", StepClass);
            return;
        }
        this.steps.set(StepClass.id, StepClass);
    },

    get(id) {
        if (!this.steps.has(id)) {
            // console.warn(`Step type '${id}' not found in Registry.`);
            return null;
        }
        return this.steps.get(id);
    },

    getAll() {
        return Array.from(this.steps.values());
    }
};
