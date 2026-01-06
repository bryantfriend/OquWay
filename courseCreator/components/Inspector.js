
// components/Inspector.js

import { store } from "../Store.js";
import { Registry } from "../../Shared/steps/Registry.js";
import { SchemaForm } from "../js/components/SchemaForm.js";

export class Inspector {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.contentContainer = document.getElementById("inspectorContent");

        this.init();
    }

    init() {
        store.subscribe((state) => {
            this.render(state);
        });
        // Note: SchemaForm handles its own input events via callback, so we don't need global delegation for the form part anymore.
        // We still keep the Track inspector logic manually for now, or we could eventually schema-fy tracks too.
        this.contentContainer.addEventListener('input', (e) => {
            if (!e.target.closest('.schema-form')) {
                // Handle Track inspector inputs
                this.handleInput(e);
            }
        });
    }

    render(state) {
        // ... (Keep existing focus check logic if needed, or simplify) ...
        const currentRenderedId = this.contentContainer.dataset.renderedId;
        const targetId = state.selectedStepId || state.selectedTrackId;

        // Simple re-render avoidance
        if (targetId && currentRenderedId === targetId && document.activeElement && this.contentContainer.contains(document.activeElement)) {
            return;
        }

        this.contentContainer.dataset.renderedId = targetId || '';
        this.contentContainer.innerHTML = "";

        if (state.selectedStepId) {
            this.renderStepInspector(state.selectedStepId);
        } else if (state.selectedTrackId) {
            this.renderTrackInspector(state.selectedTrackId);
        } else {
            this.renderEmpty();
        }
    }

    renderStepInspector(stepId) {
        const step = store.getStep(stepId);
        if (!step) return;

        const Engine = Registry.get(step.type);
        if (!Engine) {
            this.contentContainer.innerHTML = `<p class="text-red-500 p-4">Unknown step type: ${step.type}</p>`;
            return;
        }

        // Header
        const header = document.createElement('div');
        header.className = "mb-4 pb-4 border-b px-4 mt-4";
        header.innerHTML = `

            
            <span class="text-xs font-bold text-gray-400 uppercase mt-4 block">Type Info</span>
            <div class="font-semibold text-gray-800 text-xs">${Engine.displayName} <span class="text-gray-400 font-normal">(${step.type})</span></div>
            <div class="text-xs text-gray-500">${Engine.description}</div>
        `;
        this.contentContainer.appendChild(header);



        // Form Container
        const formContainer = document.createElement('div');
        formContainer.className = "px-4 pb-10 schema-form";
        this.contentContainer.appendChild(formContainer);

        // Render SchemaForm
        // We pass the current step data (which effectively IS the config)
        // Note: Engine.editorSchema describes the fields.
        new SchemaForm(formContainer, Engine.editorSchema, step, (newData) => {
            // Live Auto-Save
            store.updateStep(stepId, newData);
        }, store.state.courseLanguages);
    }

    renderEmpty() {
        this.contentContainer.innerHTML = `
            <div class="p-4 text-gray-500 text-sm">
                <h3 class="font-bold text-gray-700 mb-3 uppercase text-xs">Keyboard Shortcuts</h3>
                <ul class="space-y-2">
                    <li class="flex justify-between"><span>Save</span> <kbd class="bg-gray-100 px-1 rounded border">Ctrl + S</kbd></li>
                    <li class="flex justify-between"><span>Duplicate</span> <kbd class="bg-gray-100 px-1 rounded border">Ctrl + D</kbd></li>
                </ul>
            </div>
        `;
    }


    renderTrackInspector(trackId) {
        const track = store.getTrack(trackId);
        if (!track) return;

        let html = `
            <div class="mb-4 pb-4 border-b">
                 <span class="text-xs font-bold text-gray-400 uppercase">Track Properties</span>
            </div>
             <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Title</label>
                    <input type="text" data-target="track-title" value="${track.title}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                     <div>
                        <label class="block text-sm font-medium text-gray-700">Color Tag</label>
                        <select data-target="track-color" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                            <option value="gray" ${track.color === 'gray' ? 'selected' : ''}>Gray</option>
                            <option value="blue" ${track.color === 'blue' ? 'selected' : ''}>Blue</option>
                            <option value="green" ${track.color === 'green' ? 'selected' : ''}>Green</option>
                            <option value="purple" ${track.color === 'purple' ? 'selected' : ''}>Purple</option>
                            <option value="red" ${track.color === 'red' ? 'selected' : ''}>Red</option>
                            <option value="yellow" ${track.color === 'yellow' ? 'selected' : ''}>Yellow</option>
                        </select>
                    </div>
                     <div>
                        <label class="block text-sm font-medium text-gray-700">Mood</label>
                        <select data-target="track-mood" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                            <option value="neutral" ${track.mood === 'neutral' ? 'selected' : ''}>😐 Neutral</option>
                            <option value="happy" ${track.mood === 'happy' ? 'selected' : ''}>😊 Friendly</option>
                            <option value="serious" ${track.mood === 'serious' ? 'selected' : ''}>🧐 Serious</option>
                            <option value="exciting" ${track.mood === 'exciting' ? 'selected' : ''}>⚡ High Energy</option>
                            <option value="calm" ${track.mood === 'calm' ? 'selected' : ''}>🌿 Calm</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Learning Intent</label>
                    <select data-target="track-intent" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                        <option value="learn" ${track.intent === 'learn' ? 'selected' : ''}>🧠 Learn New Concept</option>
                        <option value="practice" ${track.intent === 'practice' ? 'selected' : ''}>💪 Practice / Drill</option>
                        <option value="assess" ${track.intent === 'assess' ? 'selected' : ''}>✅ Assessment</option>
                        <option value="explore" ${track.intent === 'explore' ? 'selected' : ''}>🧭 Exploration</option>
                    </select>
                </div>
            </div>
        `;
        this.contentContainer.innerHTML = html;
        // removed attachDebouncedSave call
    }

    // Input Handling

    handleInput(e) {
        // Debounce saving
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveChanges(e.target);
        }, 500);
    }

    handleClick(e) {
        // Global form actions like adding/removing list items are handled by CourseCreatorModules.js global listener
        // But we might need to trigger save after them.
        // The global listener calls appComponents.inspector.saveBlockChange() manually, so we are good.
    }

    saveChanges(target) {
        if (!target) return;

        if (store.state.selectedStepId) {
            this.saveStepChange();
        } else if (store.state.selectedTrackId) {
            if (target.dataset.target === 'track-title') {
                store.updateTrackTitle(store.state.selectedTrackId, target.value);
            } else if (target.dataset.target === 'track-color') {
                store.updateTrackColor(store.state.selectedTrackId, target.value);
            }
        }
    }

    // Public method, also called by external components
    saveBlockChange() {
        this.saveStepChange();
    }

    saveStepChange() {
        const stepId = store.state.selectedStepId;
        if (!stepId) return;

        const step = store.getStep(stepId);
        if (!step) return;

        const StepClass = stepClasses[step.type];
        const stepInstance = new StepClass(step, store.state.courseLanguages);
        const form = document.getElementById('inspector-form');

        if (form) {
            // We need to re-read the form data
            const newData = stepInstance.saveFromForm(form);
            store.updateStep(stepId, newData);
        }
    }
}
