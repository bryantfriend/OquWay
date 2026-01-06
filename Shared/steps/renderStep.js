import { Registry } from "./Registry.js";
import { resolveLocalized } from "./utils.js"; // Import from utils to avoid circular dep

// Ensure Registry is initialized (Async check inside renderStep)
// Registry.init(); // Moved inside

// Export resolveLocalized from here as well for backward compatibility if needed, 
// though direct import from utils is preferred.
export { resolveLocalized };

// --- Core Step Renderer ---
export async function renderStep(container, stepData, extraContext = {}) {
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
        // Render using Engine Interface
        // Note: Engine.render expects { container, config, context, onComplete }
        const lang = (localStorage.getItem("language") || "en").toLowerCase();

        // Prepare Context
        const context = {
            lang: lang,
            ...extraContext,
            ...stepData._context
        };

        // Call Static Render
        Engine.render({
            container,
            config: stepData, // Pass the stepData as config
            context,
            onComplete: (result) => {
                console.log(`[Step ${stepData.type}] Completed:`, result);
                // Trigger global event if needed
                container.dispatchEvent(new CustomEvent('step-complete', { detail: result, bubbles: true }));
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
