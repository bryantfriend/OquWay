export class PreviewManager {
    constructor(container, overlay, seedInput) {
        this.container = container;
        this.overlay = overlay;
        this.seedInput = seedInput;
        this.currentEngine = null;
        this.currentConfig = null;

        if (this.seedInput) {
            this.seedInput.addEventListener('change', () => this.refresh());
        }
    }

    refresh() {
        if (this.currentEngine && this.currentConfig) {
            this.render(this.currentEngine, this.currentConfig);
        }
    }

    render(Engine, config) {
        this.currentEngine = Engine;
        this.currentConfig = config;

        // Clear previous
        [...this.container.children]
            .filter(el => el.id !== 'experience-overlay')
            .forEach(el => el.remove());

        const seed = this.seedInput ? this.seedInput.value : null;

        try {
            Engine.render({
                container: this.container,
                config,
                context: { mode: 'preview', seed, commit: false }
            });

        } catch (e) {
            this.container.innerHTML = `<div class="text-red-500 text-sm p-4">Error rendering preview: ${e.message}</div>`;
            console.error(e);
        }

        this.updateOverlay(Engine);
    }

    updateOverlay(Engine) {
        if (!this.overlay) return;

        if (!Engine?.experience) {
            this.overlay.classList.add('hidden');
            return;
        }

        this.overlay.classList.remove('hidden');
        this.overlay.innerHTML = `
        <div class="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          ${Engine.experience.device || 'Auto'} ·
          ${Engine.experience.motion === false ? 'Motion Off' : 'Motion On'}
        </div>
      `;
    }

    setDeviceMode(mode) {
        const frame = this.container; // The container acts as the frame base
        // Reset
        frame.className = "bg-white shadow-xl overflow-hidden relative flex flex-col transition-all duration-300 mx-auto";

        if (mode === 'phone') {
            frame.classList.add('device-frame-common', 'device-frame-phone');
        } else if (mode === 'tablet') {
            frame.classList.add('device-frame-common', 'device-frame-tablet');
        } else {
            frame.classList.add('device-frame-desktop', 'w-full', 'min-h-[600px]', 'border', 'border-gray-200', 'rounded-xl');
        }
    }

    toggleFullscreen(wrapper) {
        if (!document.fullscreenElement) {
            wrapper.requestFullscreen().catch(err => console.error(err));
        } else {
            document.exitFullscreen();
        }
    }
}
