export class Toast {
    static container = null;

    static init() {
        if (!this.container) {
            this.container = document.createElement("div");
            this.container.className = "fixed bottom-5 right-5 flex flex-col gap-3 z-50 pointer-events-none";
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show a toast message
     * @param {string} message 
     * @param {'success'|'error'|'info'} type 
     * @param {number} duration ms
     */
    static show(message, type = "success", duration = 3000) {
        this.init();

        const colors = {
            success: "bg-green-600 border-green-700",
            error: "bg-red-600 border-red-700",
            info: "bg-blue-600 border-blue-700"
        };

        const icons = {
            success: "✓",
            error: "✕",
            info: "ℹ"
        };

        const toast = document.createElement("div");
        toast.className = `${colors[type]} border-l-4 text-white px-4 py-3 rounded shadow-lg transform translate-y-10 opacity-0 transition-all duration-300 pointer-events-auto flex items-center gap-3 font-medium min-w-[200px]`;
        toast.innerHTML = `
            <span class="text-xl">${icons[type]}</span>
            <span>${message}</span>
        `;

        this.container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.remove("translate-y-10", "opacity-0");
        });

        setTimeout(() => {
            toast.classList.add("translate-y-4", "opacity-0");
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    static success(msg) { this.show(msg, 'success'); }
    static error(msg) { this.show(msg, 'error'); }
    static info(msg) { this.show(msg, 'info'); }
}
