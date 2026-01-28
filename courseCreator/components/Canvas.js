
// components/Canvas.js

import { store } from "../Store.js";
import { Registry } from "../../Shared/steps/Registry.js";
import { resolveLocalized } from "../../Shared/steps/utils.js";


export class Canvas {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.canvasPage = document.getElementById("canvasPage");
        this.init();
    }

    init() {
        store.subscribe((state) => {
            if (this._renderTimeout) clearTimeout(this._renderTimeout);
            this._renderTimeout = setTimeout(() => {
                this.render(state);
            }, 50); // Small debounce for preview rendering
        });

        // Delegate events inside the canvas
        this.canvasPage.addEventListener('click', (e) => this.handleCanvasClick(e));
    }

    render(state) {
        if (!state.selectedStepId) {
            this.canvasPage.innerHTML = this.renderEmptyState();
            this.lastStepId = null;
            return;
        }

        const step = store.getStep(state.selectedStepId);
        if (!step) {
            this.canvasPage.innerHTML = `<div class="flex-1 flex items-center justify-center text-red-500">Selected step not found (ID: ${state.selectedStepId}).</div>`;
            this.lastStepId = null;
            return;
        }

        const Engine = Registry.get(step.type);
        if (!Engine) {
            this.canvasPage.innerHTML = `<div class="flex-1 flex items-center justify-center text-red-500">Unknown step type: ${step.type}</div>`;
            this.lastStepId = null;
            return;
        }

        // Check if structure already exists
        let mainWrapper = this.canvasPage.querySelector('.canvas-main-wrapper');
        const currentMode = this.currentViewMode || 'desktop';

        if (!mainWrapper) {
            this.canvasPage.innerHTML = `
                <div class="canvas-main-wrapper flex flex-col h-full w-full">
                    <!-- EXTERNAL TOOLBAR (Fixed Top) -->
                    <div class="canvas-toolbar flex-none p-4 bg-white border-b flex justify-between items-center shadow-sm z-20">
                        <div class="flex items-center gap-3">
                            <span class="engine-display-name bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200 text-xs font-bold uppercase"></span>
                            <span class="text-gray-300">|</span>
                            <h2 class="step-title-display text-sm font-bold text-gray-800 line-clamp-1"></h2>
                        </div>
                        
                        <div class="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                            <button class="resize-preview-btn p-1.5 rounded transition" data-mode="phone" title="Mobile"><i class="fas fa-mobile-alt"></i></button>
                            <button class="resize-preview-btn p-1.5 rounded transition" data-mode="tablet" title="Tablet"><i class="fas fa-tablet-alt"></i></button>
                            <button class="resize-preview-btn p-1.5 rounded transition" data-mode="desktop" title="Desktop"><i class="fas fa-desktop"></i></button>
                        </div>

                        <div class="flex gap-2">
                             <button id="refresh-preview-btn" class="p-2 text-gray-400 hover:text-blue-600 transition" title="Refresh">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                    </div>

                    <!-- CANVAS AREA (Scrollable) -->
                    <div class="flex-1 overflow-y-auto bg-gray-100 p-8 flex justify-center items-start custom-scrollbar relative">
                         <!-- Sizer / Frame -->
                         <div id="preview-frame" class="device-frame-common transition-all duration-300 bg-white">
                             <div id="preview-container" class="w-full h-full overflow-y-auto device-scroll relative">
                                <!-- Content injected here -->
                             </div>
                         </div>
                    </div>
                </div>
            `;
            mainWrapper = this.canvasPage.querySelector('.canvas-main-wrapper');
            this.setupPreviewControls();
        }

        // Update Toolbar
        mainWrapper.querySelector('.engine-display-name').textContent = Engine.displayName;
        mainWrapper.querySelector('.step-title-display').textContent = resolveLocalized(step.title) || 'Untitled Step';

        // Update Frame Class
        const frame = mainWrapper.querySelector('#preview-frame');
        frame.className = `device-frame-common ${this.getFrameClass(currentMode)} transition-all duration-300 bg-white`;

        // Update Active Button State
        const btns = mainWrapper.querySelectorAll('.resize-preview-btn');
        btns.forEach(b => {
            if (b.dataset.mode === currentMode) {
                b.className = "resize-preview-btn p-1.5 rounded transition bg-white text-blue-600 shadow-sm";
            } else {
                b.className = "resize-preview-btn p-1.5 rounded transition text-gray-500 hover:text-gray-700";
            }
        });

        const previewContainer = mainWrapper.querySelector('#preview-container');

        // Render Content - only if step changed or we need a refresh
        // Note: For dragging, we might still need to call this, but SlideStep.render should handle reconciliation.
        this.renderStepContent(Engine, step, previewContainer);

        this.lastStepId = step.id;
    }

    getFrameClass(mode) {
        if (mode === 'phone') return 'device-frame-phone';
        if (mode === 'tablet') return 'device-frame-tablet';
        return 'device-frame-desktop';
    }

    renderStepContent(Engine, step, container) {
        let rendered = false;
        container.innerHTML = ''; // Start Clean

        try {
            if (typeof Engine.render === 'function') {
                Engine.render({
                    container: container,
                    config: step,
                    context: {
                        mode: 'creator',
                        commit: false,
                        language: store.state.courseLanguages ? store.state.courseLanguages[0] : 'en',
                        isEditor: true,
                        stepId: step.id,
                        onUpdate: (newData) => {
                            store.updateStep(step.id, newData);
                        }
                    },
                    onComplete: () => console.log('Step completed (Simulated)')
                });
                rendered = true;
            }
        } catch (e) {
            console.warn("Render failed", e);
            container.innerHTML = `<div class="p-4 text-red-500">Error: ${e.message}</div>`;
            return;
        }

        if (!rendered) {
            // Fallback logic
            let previewHtml = '';
            if (typeof Engine.renderPlayer === 'function') previewHtml = Engine.renderPlayer(step, 'en');
            else try { previewHtml = new Engine(step).renderPlayer('en'); } catch (e) { }

            container.innerHTML = previewHtml;
        }
    }

    setupPreviewControls() {
        const btns = this.canvasPage.querySelectorAll('.resize-preview-btn');
        const frame = this.canvasPage.querySelector('#preview-frame');
        const refreshBtn = this.canvasPage.querySelector('#refresh-preview-btn');

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.currentViewMode = mode; // Save state

                // Update Frame Class
                frame.className = `device-frame-common ${this.getFrameClass(mode)} transition-all duration-300 bg-white`;

                // Update Active Button State
                btns.forEach(b => {
                    if (b === btn) {
                        b.className = "resize-preview-btn p-1.5 rounded transition bg-white text-blue-600 shadow-sm";
                    } else {
                        b.className = "resize-preview-btn p-1.5 rounded transition text-gray-500 hover:text-gray-700";
                    }
                });
            });
        });

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                const state = store.getState();
                this.render(state);
            });
        }
    }

    renderEmptyState() {
        return `
            <div class="flex-1 flex flex-col items-center justify-center text-center h-full text-gray-400 select-none">
                <div class="text-6xl mb-4 opacity-50">👈</div>
                <h3 class="text-xl font-medium text-gray-600">Select a step</h3>
                <p class="text-sm max-w-xs mx-auto mt-2">Choose a step from the structure panel on the left to edit and preview it here.</p>
                <div class="mt-8">
                     <button class="add-step-btn bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-blue-700 transition" data-index="-1">
                        + Add New Step
                    </button>
                </div>
            </div>
        `;
    }

    handleCanvasClick(e) {
        // 1. Select Step
        const stepCard = e.target.closest('.step-card');
        if (stepCard && !e.target.closest('button')) {
            store.selectStep(stepCard.dataset.stepId);
        }

        // 2. Add Step Button
        if (e.target.closest('.add-step-btn') || e.target.closest('#emptyStateAdd')) {
            const btn = e.target.closest('.add-step-btn');
            const index = btn ? parseInt(btn.dataset.index) : -1;
            this.openBlockPicker(index);
        }

        // 3. Quick Add Buttons
        if (e.target.closest('.quick-add-btn')) {
            e.stopPropagation();
            const type = e.target.closest('.quick-add-btn').dataset.type;
            this.addStepDirectly(type, -1);
        }

        // 4. Delete Step
        if (e.target.closest('.delete-step-btn')) {
            e.stopPropagation();
            const id = stepCard.dataset.stepId;
            store.deleteStep(id);
        }

        // 5. Duplicate Step
        if (e.target.closest('.duplicate-step-btn')) {
            e.stopPropagation();
            const id = stepCard.dataset.stepId;
            const trackId = store.getSelectedTrack().id;
            const step = store.getStep(id);
            const newStep = JSON.parse(JSON.stringify(step));
            delete newStep.id;
            store.addStep(trackId, newStep, parseInt(stepCard.dataset.index) + 1);
        }
    }

    openBlockPicker(index) {
        // We pass trackId now instead of pageId
        const event = new CustomEvent('request-block-picker', {
            detail: { index, trackId: store.getSelectedTrack().id }
        });
        document.dispatchEvent(event);
    }

    addStepDirectly(type, index) {
        const Engine = Registry.get(type);
        if (!Engine) return;

        const trackId = store.getSelectedTrack().id;
        const newStep = JSON.parse(JSON.stringify(Engine.defaultConfig));
        newStep.type = type; // Ensure type is set
        store.addStep(trackId, newStep, index);
    }

    debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    }

    getBlockIcon(type) {
        // Fallback or map from Registry/Metadata if we add 'icon' metadata to engines later.
        // For now, simple map
        const icons = {
            primer: '🖼️', mission: '🚀', reflection: '💭', movie: '▶️',
            intentCheck: '❓', audioLesson: '🎧', matchingGame: '🧩',
            dialogue: '💬', roleplay: '🎭', letterRacingGame: '🏎️'
        };
        // Check Registry?
        // const Engine = Registry.get(type);
        // if (Engine && Engine.icon) return Engine.icon; 

        return icons[type] || '📦';
    }


}
