

import BaseField from './BaseField.js';
// import FieldEngine from '../FieldEngine.js'; // Removed to avoid circular dependency

export default class SlideListField extends BaseField {

    static get type() {
        return 'slide-list';
    }

    constructor(props) {
        super(props);
        this.selectedIndex = 0;
    }

    render(container) {
        this.container = container;
        this.renderUI();
    }

    renderUI() {
        if (!this.container) return; // Guard clause
        const container = this.container;
        const value = Array.isArray(this.value) ? this.value : [];

        // --- DATA NORMALIZATION ---
        // Ensure selectedIndex is valid
        if (this.selectedIndex >= value.length && value.length > 0) {
            this.selectedIndex = value.length - 1;
        }
        if (value.length === 0) {
            this.selectedIndex = -1;
        }

        container.innerHTML = '';
        this.listContainer = container; // Ensure listContainer ref exists if used else

        // --- GRID CONTAINER ---
        const grid = document.createElement('div');
        grid.className = "flex flex-wrap gap-2 mb-4";
        container.appendChild(grid);

        // --- RENDER ITEMS ---
        value.forEach((item, index) => {
            const btn = document.createElement('button');
            const isActive = index === this.selectedIndex;

            btn.className = `w-10 h-10 rounded-lg font-bold text-sm transition-all focus:outline-none flex items-center justify-center shadow-sm ${isActive
                    ? 'bg-indigo-600 text-white ring-2 ring-offset-2 ring-indigo-600 scale-105'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-500'
                }`;
            btn.textContent = index + 1;
            btn.title = `Slide ${index + 1}`; // Simple title

            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
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
            const newItem = this.createDefaultItem();
            const newValue = [...value, newItem];
            this.value = newValue;
            this.selectedIndex = newValue.length - 1; // Select new one
            this.renderUI();
            this.onChange(newValue);

            // Sync to new slide
            window.dispatchEvent(new CustomEvent('slide-step-change', {
                detail: { stepId: this.context.stepId, index: this.selectedIndex }
            }));
        };
        grid.appendChild(addBtn);


        // --- ACTION BAR (For Selected Slide) ---
        if (this.selectedIndex >= 0 && this.selectedIndex < value.length) {
            const actionBar = document.createElement('div');
            actionBar.className = "flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-500 mb-4";

            // Left Group
            const leftGroup = document.createElement('div');
            leftGroup.className = "flex gap-1";

            // Move Left
            const moveLeftBtn = document.createElement('button');
            moveLeftBtn.className = "p-1.5 hover:bg-gray-200 rounded disabled:opacity-30";
            moveLeftBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
            // Fallback SVG if FontAwesome not available
            if (!moveLeftBtn.querySelector('i')) { // Just in case
                moveLeftBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>';
            } else {
                // Force SVG for reliability
                moveLeftBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>';
            }

            moveLeftBtn.title = "Move Slide Left";
            moveLeftBtn.disabled = this.selectedIndex === 0;
            moveLeftBtn.onclick = (e) => {
                e.preventDefault();
                if (this.selectedIndex > 0) {
                    const idx = this.selectedIndex;
                    const items = [...this.value];
                    // Swap
                    [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
                    this.value = items;
                    this.selectedIndex = idx - 1;
                    this.renderUI();
                    this.onChange(items);
                    window.dispatchEvent(new CustomEvent('slide-step-change', { detail: { stepId: this.context.stepId, index: this.selectedIndex } }));
                }
            };
            leftGroup.appendChild(moveLeftBtn);

            // Move Right
            const moveRightBtn = document.createElement('button');
            moveRightBtn.className = "p-1.5 hover:bg-gray-200 rounded disabled:opacity-30";
            // SVG
            moveRightBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
            moveRightBtn.title = "Move Slide Right";
            moveRightBtn.disabled = this.selectedIndex === value.length - 1;
            moveRightBtn.onclick = (e) => {
                e.preventDefault();
                if (this.selectedIndex < value.length - 1) {
                    const idx = this.selectedIndex;
                    const items = [...this.value];
                    // Swap
                    [items[idx + 1], items[idx]] = [items[idx], items[idx + 1]];
                    this.value = items;
                    this.selectedIndex = idx + 1;
                    this.renderUI();
                    this.onChange(items);
                    window.dispatchEvent(new CustomEvent('slide-step-change', { detail: { stepId: this.context.stepId, index: this.selectedIndex } }));
                }
            };
            leftGroup.appendChild(moveRightBtn);

            actionBar.appendChild(leftGroup);

            // Right Group (Delete)
            const deleteBtn = document.createElement('button');
            deleteBtn.className = "p-1.5 text-red-500 hover:bg-red-50 rounded flex gap-1 items-center";
            deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path></svg> <span class="uppercase font-bold text-[10px]">Delete</span>';
            deleteBtn.onclick = (e) => {
                e.preventDefault();
                if (confirm('Delete this slide?')) {
                    const next = value.filter((_, i) => i !== this.selectedIndex);
                    this.value = next;
                    this.selectedIndex = Math.max(0, this.selectedIndex - 1);
                    this.renderUI();
                    this.onChange(next);
                    window.dispatchEvent(new CustomEvent('slide-step-change', { detail: { stepId: this.context.stepId, index: this.selectedIndex } }));
                }
            };
            actionBar.appendChild(deleteBtn);

            container.appendChild(actionBar);
        }

        // --- CONTENT AREA (Properties) ---
        if (this.selectedIndex !== -1 && value[this.selectedIndex]) {
            const itemPath = `${this.path}[${this.selectedIndex}]`;
            const itemSchema = this.schema.itemSchema || { type: 'string' };

            const propertiesWrapper = document.createElement('div');
            propertiesWrapper.className = "bg-slate-800/30 rounded-xl p-4 border border-slate-700/50";
            container.appendChild(propertiesWrapper);

            const FieldEngine = this.context.FieldEngine;
            if (FieldEngine) {
                // Ensure we handle updates correctly
                FieldEngine.render(
                    propertiesWrapper,
                    itemSchema,
                    value[this.selectedIndex],
                    (newItemVal) => {
                        const next = [...this.value]; // Use current this.value
                        next[this.selectedIndex] = newItemVal;
                        this.value = next;
                        this.onChange(next);
                    },
                    this.context,
                    itemPath
                );
            }
        }
    }


    /* ======================================================
       DEFAULT ITEM CREATION
    ====================================================== */

    createDefaultItem() {
        // Log for debugging
        console.log("SlideListField: Creating default item from schema", this.schema.itemSchema);

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
                // Fallback for simple slide if no schema structure
                return {
                    text: { en: "New Slide" },
                    image: ""
                };
        }
    }

    buildObject(schema) {
        const obj = {};
        if (schema.fields) {
            Object.entries(schema.fields).forEach(([key, fieldSchema]) => {
                // Special handling for 'id' to ensure uniqueness if possible, or just empty
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
            case 'localizedText': return { en: '' }; // Explicit support for localizedText
            default: return '';
        }
    }

    cleanup() {
        // No cleanup needed
    }

}
