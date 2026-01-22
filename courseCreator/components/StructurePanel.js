
import { store } from "../Store.js";
import { Registry } from "../../Shared/steps/Registry.js";
import { resolveLocalized } from "../../Shared/steps/utils.js";

export class StructurePanel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.treeContainer = document.getElementById("structureTree");
        this.addPageBtn = document.getElementById("addPageBtn");

        this.init();
    }

    init() {
        // Remove 'Add Page' button if it exists
        if (this.addPageBtn) {
            this.addPageBtn.style.display = 'none';
        }

        store.subscribe((state) => { this.render(state); });

        // Tree Global Click Handler (Delegation)
        this.treeContainer.addEventListener('click', (e) => this.handleTreeClick(e));

        // Inline Rename (Double Click on Track Header OR Step Item)
        this.treeContainer.addEventListener('dblclick', (e) => {
            // Track Rename
            const trackHeader = e.target.closest('.track-header');
            if (trackHeader) {
                const trackId = trackHeader.dataset.id;
                const span = trackHeader.querySelector('.track-title-span');
                if (!span) return;

                this.activateRename(span, (val) => store.updateTrackTitle(trackId, val));
                return;
            }

            // Step Rename
            const stepItem = e.target.closest('.step-item');
            if (stepItem) {
                // Ignore if clicked on drag handle or icon, prefer the text area
                const span = stepItem.querySelector('.step-title-span'); // Will add this class to renderStepInTree
                if (!span && stepItem.querySelector('.truncate')) {
                    // Fallback to the text span that has truncate
                    const textSpan = stepItem.querySelector('.truncate');
                    const stepId = stepItem.dataset.id;
                    this.activateRename(textSpan, (val) => store.updateStep(stepId, { title: val }));
                }
            }
        });

        // Initialize Sortable for Tracks (Reordering Tracks)
        new Sortable(this.treeContainer, {
            animation: 150,
            handle: '.track-header',
            ghostClass: 'opacity-50',
            onEnd: (evt) => {
                const newOrderIds = Array.from(this.treeContainer.children)
                    .map(c => c.dataset.id)
                    .filter(id => id);
                const currentTracks = store.state.module.tracks;
                const newTracks = newOrderIds.map(id => currentTracks.find(t => t.id === id));
                store.reorderTracks(newTracks);
            }
        });

        // Context Menu (Right Click)
        this.treeContainer.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        document.addEventListener('click', () => this.closeContextMenu());
    }

    render(state) {
        if (!state.module || !state.module.tracks) return;

        // Clear container using DOM manipulation instead of innerHTML string building
        // to support complex event listeners on elements
        this.treeContainer.innerHTML = '';

        state.module.tracks.forEach(track => {
            const trackEl = this.renderTrack(track, state);
            this.treeContainer.appendChild(trackEl);
        });
    }

    renderTrack(track, state) {
        const isSelectedTrack = track.id === state.selectedTrackId;

        const trackGroup = document.createElement('div');
        trackGroup.className = 'track-group mb-4';
        trackGroup.dataset.id = track.id;

        // Header
        const header = document.createElement('div');
        header.className = `track-header pl-2 py-2 text-xs font-bold text-gray-500 uppercase flex items-center justify-between group cursor-pointer ${isSelectedTrack ? 'text-blue-600' : ''}`;
        header.dataset.type = 'track';
        header.dataset.id = track.id;
        header.innerHTML = `
             <span class="track-title-span pointer-events-none">${track.title}</span>
             <button class="opacity-0 group-hover:opacity-100 text-xs hover:text-blue-600 add-step-inline-btn" title="Add Step">+</button>
        `;
        trackGroup.appendChild(header);

        // Steps Container
        const stepsContainer = document.createElement('div');
        stepsContainer.className = 'steps-container border-l-2 border-gray-200 ml-2 pl-1 space-y-1 min-h-[20px]';
        stepsContainer.dataset.trackId = track.id;

        const steps = track.steps || [];
        steps.forEach((step, index) => {
            const isSelectedStep = step.id === state.selectedStepId;
            const stepEl = this.renderStepInTree(step, index, isSelectedStep, track.id);
            stepsContainer.appendChild(stepEl);
        });

        trackGroup.appendChild(stepsContainer);

        // Init Sortable for this track's steps
        new Sortable(stepsContainer, {
            group: 'steps',
            animation: 150,
            ghostClass: 'bg-blue-50',
            handle: '.drag-handle', // Drag handle
            onEnd: (evt) => {
                const toTrackId = evt.to.dataset.trackId;
                const fromTrackId = evt.from.dataset.trackId;
                const stepId = evt.item.dataset.id;
                const newIndex = evt.newIndex; // Index in the new list

                if (toTrackId === fromTrackId) {
                    const track = store.getTrack(toTrackId);
                    // We must map DOM children to IDs to get true order because Sortable mutates DOM
                    const newOrderIds = Array.from(evt.to.children)
                        .map(c => c.querySelector('.step-item').dataset.id);
                    const newSteps = newOrderIds.map(id => track.steps.find(s => s.id === id));
                    store.reorderSteps(toTrackId, newSteps);
                } else {
                    store.moveStep(stepId, toTrackId, newIndex);
                }
            }
        });

        return trackGroup;
    }

    renderStepInTree(step, index, isSelected, trackId) {
        const container = document.createElement('div');
        container.className = 'step-wrapper relative group'; // Wrapper for positioning

        // Hover Insert Button (Blue Line with +)
        const insertBtn = document.createElement('div');
        insertBtn.className = 'absolute -bottom-3 left-0 w-full h-6 z-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer';
        insertBtn.title = "Insert Step Here";
        insertBtn.innerHTML = `
            <div class="absolute w-full h-0.5 bg-blue-500"></div>
            <div class="relative bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm text-xs font-bold transform hover:scale-110 transition z-10 border border-white">+</div>
        `;
        insertBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const event = new CustomEvent('request-block-picker', {
                detail: {
                    index: index + 1,
                    trackId,
                    previousStepType: step.type
                }
            });
            document.dispatchEvent(event);
        });

        // Step Item Card
        const el = document.createElement('div');
        el.className = `step-item flex items-center p-1.5 rounded cursor-pointer text-sm mb-1 relative border transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]' : 'bg-white text-gray-600 border-transparent hover:bg-gray-100 hover:border-gray-200'}`;
        el.dataset.id = step.id;
        el.dataset.type = 'step';

        // Icon
        const Engine = Registry.get(step.type);
        const icon = this.getBlockIcon(step.type);

        // Display Name Strategy
        let displayName = resolveLocalized(step.title); // FIX: Resolve localized title
        if (!displayName || displayName === step.type) {
            displayName = Engine ? Engine.displayName : this.formatStepType(step.type);
        }

        el.innerHTML = `
            <span class="mr-2 opacity-50 text-xs drag-handle cursor-grab hover:opacity-100">⋮⋮</span>
            <span class="mr-2">${icon}</span>
            <span class="truncate flex-grow opacity-90 step-title-span" title="Double-click to rename">${displayName}</span>
            
            <!-- Context Menu Trigger -->
            <button class="menu-trigger opacity-0 group-hover/step:opacity-100 hover:bg-white/20 rounded px-1 text-xs font-bold transition ml-2 ${isSelected ? 'opacity-100' : ''}">⋮</button>
        `;

        // Context Menu Click
        const menuTrigger = el.querySelector('.menu-trigger');
        menuTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleContextMenu({
                preventDefault: () => { },
                target: el,
                clientX: e.clientX,
                clientY: e.clientY
            });
        });

        container.appendChild(el);
        container.appendChild(insertBtn);
        return container;
    }

    getBlockIcon(type) {
        const icons = {
            primer: '🖼️', mission: '🚀', reflection: '💭', movie: '▶️',
            intentCheck: '❓', audioLesson: '🎧', matchingGame: '🧩',
            dialogue: '💬', roleplay: '🎭', letterRacingGame: '🏎️'
        };
        // Fallback to Registry icon if later supported
        return icons[type] || '📦';
    }

    formatStepType(type) {
        return type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    handleTreeClick(e) {
        const item = e.target.closest('[data-type]');
        if (!item) return;

        const type = item.dataset.type;
        const id = item.dataset.id;

        // Prevent click if clicking direct controls
        if (e.target.closest('.add-step-inline-btn') || e.target.isContentEditable || e.target.closest('.menu-trigger')) return;

        if (type === 'track') store.selectTrack(id);
        if (type === 'step') store.selectStep(id);

        if (e.target.closest('.add-step-inline-btn')) {
            e.stopPropagation();
            const event = new CustomEvent('request-block-picker', {
                detail: { index: -1, trackId: id }
            });
            document.dispatchEvent(event);
        }
    }

    handleContextMenu(e) {
        e.preventDefault();
        this.closeContextMenu();

        const item = e.target.closest('[data-type]');
        if (!item) return;

        const type = item.dataset.type;
        const id = item.dataset.id;
        // Select it
        if (type === 'track') store.selectTrack(id);
        if (type === 'step') store.selectStep(id);

        const menu = document.createElement('div');
        menu.id = 'custom-context-menu';
        menu.className = 'fixed bg-white shadow-xl rounded-lg py-1 z-50 border border-gray-100 text-sm font-medium text-gray-700 min-w-[160px] transform transition-all duration-100 ease-out origin-top-left';
        menu.style.top = `${e.clientY}px`;
        menu.style.left = `${e.clientX}px`;

        const options = [];

        if (type === 'track') {
            options.push({
                label: 'Add Step', icon: '➕', action: () => {
                    const event = new CustomEvent('request-block-picker', { detail: { index: -1, trackId: id } });
                    document.dispatchEvent(event);
                }
            });
            options.push({
                label: 'Rename', icon: '✏️', action: () => {
                    const newTitle = prompt("Rename Track", store.getTrack(id)?.title);
                    if (newTitle) store.updateTrackTitle(id, newTitle);
                }
            });
            options.push({ separator: true });
            options.push({
                label: 'Delete Track', icon: '🗑️', class: 'text-red-600 hover:bg-red-50', action: () => {
                    if (confirm('Delete this track?')) store.deleteTrack(id);
                }
            });
        } else if (type === 'step') {
            options.push({
                label: 'Duplicate', icon: '📑', action: () => {
                    const step = store.getStep(id);
                    if (step) {
                        const trackId = store.getSelectedTrack().id;
                        const track = store.getTrack(trackId);
                        const idx = track.steps.findIndex(s => s.id === id);
                        const newStep = JSON.parse(JSON.stringify(step));
                        delete newStep.id;
                        store.addStep(trackId, newStep, idx + 1);
                    }
                }
            });
            options.push({ separator: true });
            options.push({
                label: 'Delete', icon: '🗑️', class: 'text-red-600 hover:bg-red-50', action: () => {
                    store.deleteStep(id);
                }
            });
        }

        options.forEach(opt => {
            if (opt.separator) {
                const sep = document.createElement('div');
                sep.className = 'h-px bg-gray-100 my-1';
                menu.appendChild(sep);
            } else {
                const el = document.createElement('div');
                el.className = `px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3 ${opt.class || ''}`;
                el.innerHTML = `<span class="opacity-70">${opt.icon}</span> <span>${opt.label}</span>`;
                el.addEventListener('click', () => {
                    opt.action();
                    this.closeContextMenu();
                });
                menu.appendChild(el);
            }
        });

        document.body.appendChild(menu);
    }

    closeContextMenu() {
        const existing = document.getElementById('custom-context-menu');
        if (existing) existing.remove();
    }

    activateRename(element, saveCallback) {
        const currentTitle = element.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentTitle;
        input.className = 'border rounded px-1 text-xs py-0 w-full max-w-[140px] shadow-sm z-50 text-black';
        input.onclick = (e) => e.stopPropagation(); // Prevent drag start when clicking input

        const save = () => {
            if (input.value && input.value !== currentTitle) {
                saveCallback(input.value);
            } else {
                element.textContent = currentTitle;
                if (input.parentNode) input.replaceWith(element);
            }
        };

        const onBlur = () => {
            // We need a small delay or check because enter key might trigger blur too?
            // Actually just saving is fine.
            save();
        };

        input.addEventListener('blur', onBlur);
        input.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') {
                input.blur();
            }
            if (ev.key === 'Escape') {
                input.value = currentTitle;
                input.blur();
            }
        });

        element.replaceWith(input);
        input.focus();
        input.select();
    }
}
