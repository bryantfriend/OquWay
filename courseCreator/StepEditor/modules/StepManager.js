import { Registry } from '../../../Shared/steps/Registry.js';
import { db } from "../../firebase-init.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

export class StepManager {
    constructor() {
        this.selectedEngineId = null;
    }

    async init() {
        await Registry.init(db);
    }

    getAllSteps() {
        return Registry.getAll();
    }

    getStep(id) {
        return Registry.get(id);
    }

    selectStep(id) {
        this.selectedEngineId = id;
        return this.getStep(id);
    }

    getSelectedStep() {
        return this.selectedEngineId ? this.getStep(this.selectedEngineId) : null;
    }

    async createCloudStep(name) {
        // Clean ID
        const id = name.replace(/[^a-zA-Z0-9]/g, '');
        if (!id) throw new Error("Invalid name");

        // 🔥 BOILERPLATE NOW USES STRICT BaseStep
        const boilerplate = `
export default class ${id} extends window.CourseEngine.BaseStep {
    // --- Metadata ---
    static get id() { return '${id}'; }
    static get version() { return '1.0.0'; }
    static get displayName() { return '${name}'; }
    static get category() { return 'misc'; }
    static get description() { return 'New Cloud Step'; }

    // --- Schema ---
    static get editorSchema() {
      return {
          fields: [
              { key: 'message', type: 'text', label: 'Message', default: 'Hello World' }
          ]
      };
    }

    // --- Default Config ---
    static get defaultConfig() {
        return { message: "Hello from Cloud!" };
    }

    /**
     * Validation Logic
     */
    static validateConfig(config = {}) {
        const errors = [];
        if (!config.message) {
            errors.push({ field: 'message', message: 'Message is required' });
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }

    // --- Render ---
    static render({ container, config, onComplete }) {
        // 1. Setup Guard
        const signalComplete = this.createCompletionGuard(onComplete);

        // 2. Render
        container.innerHTML = \`<div class="p-4 text-center">
            <h1 class="text-2xl font-bold">\${config.message}</h1>
            <p class="text-gray-500">I am a Cloud Step!</p>
            <button id="cmp-btn" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
                Simulate Complete
            </button>
        </div>\`;

        // 3. Interaction
        container.querySelector('#cmp-btn').onclick = () => {
            signalComplete({ success: true });
        };
        
        // 4. Cleanup
        container.cleanup = () => {
            // Remove listeners if needed
        };
    }
}`;
        // 🔥 STRICT STORAGE FORMAT
        const docRef = doc(db, "system_step_types", id);

        const payload = {
            meta: {
                id: id,
                version: '1.0.0',
                category: 'misc',
                tags: [],
                updatedAt: new Date().toISOString()
            },
            code: boilerplate,
            schema: {
                fields: [
                    { key: 'message', type: 'text', label: 'Message', default: 'Hello World' }
                ]
            },
            defaults: { message: "Hello from Cloud!" },
            status: 'draft'
        };

        await setDoc(docRef, payload);

        return id;
    }

    async saveCode(id, newCode) {
        const Engine = this.getStep(id);
        if (!Engine || !Engine.isCloud) {
            throw new Error("Cannot save built-in steps or step not found.");
        }

        const docRef = doc(db, "system_step_types", Engine.cloudId || Engine.id);

        // We only update code and timestamp. 
        // Ideally, we should parse the code to extract schema/defaults too, 
        // but that requires an AST parser in browser or regex. 
        // For now, we trust the code is the source of truth for runtime, 
        // but we might drift from stored schema if user edits code getters.

        await setDoc(docRef, {
            code: newCode,
            "meta.updatedAt": new Date().toISOString()
        }, { merge: true });

        // Hot Reload
        await Registry.reloadCloudStep(Engine.cloudId, newCode);
        return Registry.get(id); // Return fresh engine
    }

    async saveSchema(id, schema) {
        const Engine = this.getStep(id);
        if (!Engine || !Engine.isCloud) {
            throw new Error("Cannot save built-in steps or step not found.");
        }

        const docRef = doc(db, "system_step_types", Engine.cloudId || Engine.id);
        await setDoc(docRef, {
            schema: schema,
            "meta.updatedAt": new Date().toISOString()
        }, { merge: true });

        // Apply locally
        Engine.editorSchema = schema;
        return Engine;
    }

    async publishStep(id) {
        const Engine = this.getStep(id);
        if (!Engine || !Engine.isCloud) {
            throw new Error("Cannot publish built-in steps.");
        }

        const docRef = doc(db, "system_step_types", Engine.cloudId);
        await setDoc(docRef, {
            status: 'published',
            "meta.publishedAt": new Date().toISOString(),
            "meta.updatedAt": new Date().toISOString()
        }, { merge: true });
    }

    async getCloudCode(cloudId) {
        const docSnap = await getDoc(doc(db, "system_step_types", cloudId));
        return docSnap.exists() ? docSnap.data().code : "";
    }
}
