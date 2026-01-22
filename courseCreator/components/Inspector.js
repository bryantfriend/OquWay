
// components/Inspector.js

import { store } from "../Store.js";
import { Registry } from "../../Shared/steps/Registry.js";
import FieldEngine from "../../Shared/FieldEngine.js";
import { SchemaInference } from "../modules/SchemaInference.js";

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

        // Header Area (Dynamic)
        const headerContainer = document.createElement('div');
        headerContainer.className = "mb-4 border-b bg-white sticky top-0 z-20 transition-all";
        headerContainer.style.minHeight = "80px"; // Reserve space

        // Default Content
        const defaultHeader = document.createElement('div');
        defaultHeader.id = "inspector-default-header";
        defaultHeader.className = "px-4 py-4";
        defaultHeader.innerHTML = `
            <span class="text-xs font-bold text-gray-400 uppercase block">Type Info</span>
            <div class="font-semibold text-gray-800 text-xs mt-1">${Engine.displayName} <span class="text-gray-400 font-normal">(${step.type})</span></div>
            <div class="text-xs text-gray-500 mt-1 line-clamp-2">${Engine.description}</div>
        `;

        // Toolbar Container (Hidden by default)
        const toolbarContainer = document.createElement('div');
        toolbarContainer.id = "inspector-toolbar";
        toolbarContainer.className = "hidden"; // content injected by fields

        headerContainer.appendChild(defaultHeader);
        headerContainer.appendChild(toolbarContainer);
        this.contentContainer.appendChild(headerContainer);

        // Form Container
        const formContainer = document.createElement('div');
        formContainer.className = "px-4 pb-20 schema-form";
        this.contentContainer.appendChild(formContainer);

        // ... (schema resolution same) ...
        let schema;
        if (Engine.editorSchema) {
            schema = typeof Engine.editorSchema === 'function' ? Engine.editorSchema() : Engine.editorSchema;
        } else {
            schema = SchemaInference.infer(Engine.defaultConfig);
        }

        // ... (module title resolution same) ...
        let moduleTitle = store.state.module.title;
        if (typeof moduleTitle === 'object') {
            moduleTitle = moduleTitle.en || Object.values(moduleTitle)[0] || 'Module';
        }

        // Context Helpers for Toolbar
        const setToolbar = (contentElement) => {
            defaultHeader.classList.add('hidden');
            toolbarContainer.innerHTML = '';
            toolbarContainer.appendChild(contentElement);
            toolbarContainer.classList.remove('hidden');
        };

        const clearToolbar = () => {
            toolbarContainer.classList.add('hidden');
            toolbarContainer.innerHTML = '';
            defaultHeader.classList.remove('hidden');
        };

        // Render FieldEngine
        const context = {
            courseId: store.state.courseId,
            moduleId: store.state.moduleId,
            languages: store.state.courseLanguages,
            className: store.state.courseTitle || 'Course',
            moduleName: moduleTitle || 'Module',
            setToolbar, // EXPOSE TO FIELDS
            clearToolbar, // EXPOSE TO FIELDS
            FieldEngine // Inject Class to avoid circular deps in Fields
        };

        FieldEngine.render(formContainer, schema, step, (newData) => {
            // Live Auto-Save
            store.updateStep(stepId, newData);
        }, context, stepId);
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

        if (store.state.selectedTrackId) {
            if (target.dataset.target === 'track-title') {
                store.updateTrackTitle(store.state.selectedTrackId, target.value);
            } else if (target.dataset.target === 'track-color') {
                store.updateTrackColor(store.state.selectedTrackId, target.value);
            }
        }
    }

    // Public method, also called by external components
    saveBlockChange() {
        // No-op for now, as Steps save via FieldEngine callback
    }
}
