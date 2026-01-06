import { Registry } from "../../Shared/steps/Registry.js";
import { store } from "../Store.js";



export class CommandPalette {
    constructor() {
        this.palette = null;
        this.isOpen = false;
        this.commands = [];
        this.init();
    }

    init() {
        // Global Shortcut Listener
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    getCommands() {
        // Dynamic commands based on Registry and State
        const baseCommands = [
            { label: 'Save Module', action: () => store._triggerAutosave(), icon: '💾' },
            { label: 'New Track', action: () => store.addTrack("New Track"), icon: '🛤️' },
            { label: 'Toggle Fullscreen', action: () => document.documentElement.requestFullscreen(), icon: '🖥️' },
            { label: 'Close Palette', action: () => this.close(), icon: '❌' }
        ];

        // Engine Commands
        const stepCommands = Registry.getAll().map(Engine => ({
            label: `Add Step: ${Engine.displayName || Engine.id}`,
            action: () => this.addStep(Engine.id),
            icon: '➕' // Or use Engine.icon if we added it
        }));

        return [...baseCommands, ...stepCommands];
    }

    addStep(typeId) {
        const Engine = Registry.get(typeId);
        if (!Engine) return;

        const trackId = store.getSelectedTrack()?.id;
        if (!trackId) {
            alert("Please select a track first.");
            return;
        }

        const newStep = JSON.parse(JSON.stringify(Engine.defaultConfig));
        newStep.type = typeId;
        store.addStep(trackId, newStep, -1);
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    open() {
        if (this.palette) return;

        this.commands = this.getCommands();
        this.isOpen = true;

        this.palette = document.createElement('div');
        this.palette.id = 'commandPalette';
        this.palette.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-[100] animate-fade-in';
        this.palette.innerHTML = `
            <div class="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden transform transition-all scale-100 ring-1 ring-gray-900/5">
                <div class="p-4 border-b bg-gray-50 flex items-center gap-3">
                    <span class="text-gray-400">🔍</span>
                    <input type="text" id="cmdInput" placeholder="Type a command..." class="bg-transparent w-full text-lg outline-none text-gray-700 placeholder-gray-400" autocomplete="off">
                    <kbd class="hidden md:block px-2 py-0.5 text-xs text-gray-500 bg-white border rounded">ESC</kbd>
                </div>
                <div id="cmdResults" class="max-h-[60vh] overflow-y-auto p-2 space-y-1">
                    <!-- Results -->
                </div>
                <div class="p-2 border-t bg-gray-50 text-xs text-gray-400 text-center">
                    Use <kbd class="font-sans px-1 border rounded bg-white">↑</kbd> <kbd class="font-sans px-1 border rounded bg-white">↓</kbd> to navigate, <kbd class="font-sans px-1 border rounded bg-white">Enter</kbd> to select
                </div>
            </div>
        `;
        document.body.appendChild(this.palette);

        const input = this.palette.querySelector('#cmdInput');
        const results = this.palette.querySelector('#cmdResults');

        // Close on click outside
        this.palette.addEventListener('click', (e) => {
            if (e.target === this.palette) this.close();
        });

        // Filter Logic
        const render = (filter = '') => {
            results.innerHTML = '';
            const filtered = this.commands.filter(c => c.label.toLowerCase().includes(filter.toLowerCase()));

            if (filtered.length === 0) {
                results.innerHTML = `<div class="p-8 text-gray-400 text-sm text-center flex flex-col items-center gap-2"><span>🤔</span><span>No commands found</span></div>`;
                return;
            }

            filtered.forEach((cmd, idx) => {
                const el = document.createElement('div');
                el.className = `p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${idx === 0 ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50 text-gray-700'}`;
                el.dataset.index = idx; // For keyboard nav
                el.innerHTML = `
                    <span class="text-xl">${cmd.icon}</span> 
                    <span class="font-medium">${cmd.label}</span>
                `;
                el.onclick = () => {
                    cmd.action();
                    this.close();
                };
                results.appendChild(el);
            });
        };

        render();

        input.focus();
        input.addEventListener('input', (e) => render(e.target.value));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
            if (e.key === 'Enter') {
                const first = results.children[0];
                if (first) first.click();
            }
            // TODO: Add Arrow Key Navigation logic here if wanted
        });
    }

    close() {
        if (!this.palette) return;
        this.palette.remove();
        this.palette = null;
        this.isOpen = false;
    }
}
