import { Registry } from "./Registry.js";
import { resolveLocalized } from "./utils.js";

export { resolveLocalized };

// --- Core Step Renderer ---
export async function renderStep(container, stepData, extraContext = {}) {
    // 🔥 MOVE cleanup logic HERE (container exists now)
    if (container.cleanup) {
        try { container.cleanup(); } catch (e) { console.warn(e); }
        container.cleanup = null;
    }

    // Ensure Registry is ready (including Cloud steps)
    await Registry.init(extraContext.db);

    if (!stepData || !stepData.type) {
        container.innerHTML = `<p class="text-red-600">⚠️ Invalid step data.</p>`;
        return;
    }

    const Engine = Registry.get(stepData.type);

    if (!Engine) {
        console.warn(`[renderStep] Unknown engine: ${stepData.type}`);
        container.innerHTML = `
            <div class="text-red-600 bg-red-50 p-3 rounded border border-red-200">
                <p class="font-bold">⚠️ Unknown Step Type: "${stepData.type}"</p>
                <p class="text-xs">Engine not registered.</p>
            </div>`;
        return;
    }

    try {
        const lang = (localStorage.getItem("language") || "en").toLowerCase();

        const context = {
            lang,
            ...extraContext,
            ...stepData._context
        };

        if (typeof Engine.validateConfig === "function") {
            const validation = Engine.validateConfig(stepData);
            if (!validation.valid) {
                console.warn(`[Step ${stepData.type}] Invalid config`, validation.errors);
            }
        }

        Engine.render({
            container,
            config: stepData,
            context,
            onComplete: (result) => {
                console.log(`[Step ${stepData.type}] Completed:`, result);
                container.dispatchEvent(
                    new CustomEvent("step-complete", {
                        detail: result,
                        bubbles: true
                    })
                );
            }
        });

    } catch (err) {
        console.error(`❌ Failed to render step "${stepData.type}":`, err);
        container.innerHTML = `
            <div class="text-red-600 bg-red-50 p-3 rounded border border-red-200">
                <p class="font-bold">⚠️ Error Rendering Step</p>
                <p class="text-xs font-mono mt-1">${err.message}</p>
            </div>`;
    }
}
