
import BaseField from './BaseField.js';
// import FieldEngine from '../FieldEngine.js'; // Removed to avoid circular dependency

export default class SlideListField extends BaseField {

    static get type() {
        return 'slide-list';
    }

    constructor(props) {
        super(props);
        this.selectedIndex = 0;
        this.localValue = Array.isArray(this.value) ? JSON.parse(JSON.stringify(this.value)) : [];
        this._initialized = false;

        // --- PREVIEW SYNC LISTENER ---
        this._onSlideChange = (e) => {
            if (
                e.detail &&
                e.detail.source === 'preview' &&
                typeof e.detail.index === 'number' &&
                e.detail.stepId === this.context.stepId
            ) {
                if (this.selectedIndex !== e.detail.index) {
                    this.commitInternal(); // Save before switching
                    this.selectedIndex = e.detail.index;
                    this.renderUI();
                }
            }
        };
        window.addEventListener('slide-step-change', this._onSlideChange);
    }

    /**
     * Commits local buffered value to the global system
     */
    commitInternal() {
        if (JSON.stringify(this.value) !== JSON.stringify(this.localValue)) {
            this.onChange(this.localValue);
        }
    }

    render(container) {
        this.container = container;
        this.renderUI();
    }

    renderUI() {
        if (!this.container) return;
        const container = this.container;
        const value = this.localValue; // Use local buffer for rendering

        // --- PERSISTENCE ---
        // Restore only once per instance to allow local state changes to win
        if (!this._initialized && typeof container._selectedIndex === 'number') {
            this.selectedIndex = container._selectedIndex;
        }
        this._initialized = true;

        // --- DATA NORMALIZATION ---
        if (this.selectedIndex >= value.length && value.length > 0) {
            this.selectedIndex = value.length - 1;
        }
        if (value.length === 0) {
            this.selectedIndex = -1;
        }

        // Save for next instance
        container._selectedIndex = this.selectedIndex;

        // --- GRID CONTAINER ---
        let grid = container.querySelector('.slide-grid');
        if (!grid) {
            grid = document.createElement('div');
            grid.className = "slide-grid flex flex-wrap gap-2 mb-4";
            container.appendChild(grid);
        } else {
            grid.innerHTML = '';
        }

        // --- RENDER ITEMS ---
        value.forEach((item, index) => {
            const btn = document.createElement('button');
            const isActive = index === this.selectedIndex;

            btn.className = `w-10 h-10 rounded-lg font-bold text-sm transition-all focus:outline-none flex items-center justify-center shadow-sm ${isActive
                ? 'bg-indigo-600 text-white ring-2 ring-offset-2 ring-indigo-600 scale-105'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-500'
                }`;
            btn.textContent = index + 1;
            btn.title = `Slide ${index + 1}`;

            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (this.selectedIndex === index) return;

                this.commitInternal(); // Save current before switching
                this.selectedIndex = index;
                this.renderUI();

                // SYNC PREVIEW
                window.dispatchEvent(new CustomEvent('slide-step-change', {
                    detail: { stepId: this.context.stepId, index: index }
                }));
            };

            grid.appendChild(btn);
        });

        // --- ADD BUTTON ---
        const addBtn = document.createElement('button');
        addBtn.className = "w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 flex items-center justify-center transition-all";
        addBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>';
        addBtn.title = "Add Slide";
        addBtn.onclick = (e) => {
            e.preventDefault();
            this.commitInternal(); // Commit current state
            const newItem = this.createDefaultItem();
            this.localValue = [...this.localValue, newItem];
            this.selectedIndex = this.localValue.length - 1;
            this.renderUI();
            this.onChange(this.localValue); // Immediate global commit for structure changes

            window.dispatchEvent(new CustomEvent('slide-step-change', {
                detail: { stepId: this.context.stepId, index: this.selectedIndex }
            }));
        };
        grid.appendChild(addBtn);

        // --- ACTION BAR ---
        let actionBar = container.querySelector('.slide-action-bar');
        if (this.selectedIndex >= 0 && this.selectedIndex < value.length) {
            if (!actionBar) {
                actionBar = document.createElement('div');
                actionBar.className = "slide-action-bar flex items-center justify-between p-2 bg-slate-800/50 rounded-lg border border-slate-700/50 text-[10px] text-slate-400 mb-4";
                container.appendChild(actionBar);
            } else {
                actionBar.innerHTML = '';
            }

            const leftGroup = document.createElement('div');
            leftGroup.className = "flex items-center gap-2";
            leftGroup.innerHTML = '<span class="uppercase font-bold text-slate-500">Slide ' + (this.selectedIndex + 1) + '</span>';
            actionBar.appendChild(leftGroup);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = "p-1.5 text-red-500 hover:bg-red-500/10 rounded flex gap-1 items-center transition-colors";
            deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path></svg> <span class="uppercase font-bold">Delete</span>';
            deleteBtn.onclick = (e) => {
                e.preventDefault();
                if (confirm('Delete this slide?')) {
                    this.localValue = this.localValue.filter((_, i) => i !== this.selectedIndex);
                    this.selectedIndex = Math.max(0, this.selectedIndex - 1);
                    this.renderUI();
                    this.onChange(this.localValue);
                    window.dispatchEvent(new CustomEvent('slide-step-change', { detail: { stepId: this.context.stepId, index: this.selectedIndex } }));
                }
            };
            actionBar.appendChild(deleteBtn);
        } else if (actionBar) {
            actionBar.remove();
        }

        // --- DRAG AND DROP HANDLERS ---
        const slides = grid.querySelectorAll('button[title^="Slide"]');
        slides.forEach((btn, index) => {
            btn.draggable = true;

            btn.ondragstart = (e) => {
                e.dataTransfer.setData('text/plain', index);
                btn.classList.add('opacity-50', 'scale-90');
            };

            btn.ondragover = (e) => {
                e.preventDefault();
                const draggingIdx = parseInt(e.dataTransfer.getData('text/plain'));
                if (isNaN(draggingIdx)) return;
                btn.classList.add('border-indigo-500', 'bg-indigo-500/10');
            };

            btn.ondragleave = () => {
                btn.classList.remove('border-indigo-500', 'bg-indigo-500/10');
            };

            btn.ondrop = (e) => {
                e.preventDefault();
                const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                const toIdx = index;

                if (fromIdx !== toIdx) {
                    this.commitInternal();
                    const items = [...this.localValue];
                    const [movedItem] = items.splice(fromIdx, 1);
                    items.splice(toIdx, 0, movedItem);
                    this.localValue = items;
                    this.selectedIndex = toIdx;
                    this.renderUI();
                    this.onChange(this.localValue);
                    window.dispatchEvent(new CustomEvent('slide-step-change', { detail: { stepId: this.context.stepId, index: this.selectedIndex } }));
                }
            };

            btn.ondragend = () => {
                btn.classList.remove('opacity-50', 'scale-90');
            };
        });

        // --- CONTENT AREA (Properties) ---
        let propertiesWrapper = container.querySelector('.slide-properties-wrapper');
        if (this.selectedIndex !== -1 && value[this.selectedIndex]) {
            if (!propertiesWrapper) {
                propertiesWrapper = document.createElement('div');
                propertiesWrapper.className = "slide-properties-wrapper bg-slate-800/30 rounded-xl p-4 border border-slate-700/50";
                container.appendChild(propertiesWrapper);
            }

            const itemPath = `${this.path}[${this.selectedIndex}]`;
            const itemSchema = this.schema.itemSchema || { type: 'string' };
            const FieldEngine = this.context.FieldEngine;

            if (FieldEngine) {
                // Important: Clear container if we're switching slides to ensure a clean slate
                if (propertiesWrapper.dataset.slidePath !== itemPath) {
                    propertiesWrapper.innerHTML = '';
                    propertiesWrapper.dataset.slidePath = itemPath;
                }

                FieldEngine.render(
                    propertiesWrapper,
                    itemSchema,
                    value[this.selectedIndex],
                    (newItemVal) => {
                        const oldVal = value[this.selectedIndex];
                        const interactionModeChanged = oldVal.interactionMode !== newItemVal.interactionMode;

                        // Update local buffer only
                        this.localValue[this.selectedIndex] = newItemVal;

                        if (interactionModeChanged) {
                            // If structure changed, we need a shallow refresh to show/hide fields
                            this.renderUI();
                        }
                        // NO GLOBAL ONCHANGE HERE (prevents focus loss on every keystroke)
                    },
                    this.context,
                    itemPath
                );
            }
        } else if (propertiesWrapper) {
            propertiesWrapper.remove();
        }
    }

    createDefaultItem() {
        const schema = this.schema.itemSchema || { type: 'string' };
        if (schema.default !== undefined) {
            return JSON.parse(JSON.stringify(schema.default));
        }
        switch (schema.type) {
            case 'object':
                return this.buildObject(schema);
            case 'number':
                return 0;
            case 'boolean':
                return false;
            case 'array':
                return [];
            default:
                return {
                    id: Math.random().toString(36).slice(2),
                    text: { en: "New Slide" },
                    image: "",
                    interactionMode: "tap_anywhere"
                };
        }
    }

    buildObject(schema) {
        const obj = {};
        if (schema.fields) {
            Object.entries(schema.fields).forEach(([key, fieldSchema]) => {
                if (key === 'id') {
                    obj[key] = Math.random().toString(36).substr(2, 9);
                } else {
                    obj[key] = fieldSchema.default !== undefined
                        ? fieldSchema.default
                        : this.fallbackValue(fieldSchema.type);
                }
            });
        }
        return obj;
    }

    fallbackValue(type) {
        switch (type) {
            case 'number': return 0;
            case 'boolean': return false;
            case 'array': return [];
            case 'object': return {};
            case 'localizedText': return { en: '' };
            default: return '';
        }
    }

    cleanup() {
        this.commitInternal(); // Final save
        window.removeEventListener('slide-step-change', this._onSlideChange);
    }
}
