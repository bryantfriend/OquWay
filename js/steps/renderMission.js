// js/steps/renderMission.js

// Helper function to get the right text for the user's selected language.
function resolveLocalized(val) {
    if (!val) return "";
    if (typeof val === "string") return val;
    
    const lang = (localStorage.getItem("language") || "en").toLowerCase();
    const normalizedLang = lang === "ky" ? "kg" : lang;

    return val[normalizedLang] ?? val.en ?? Object.values(val)[0] ?? "";
}

/**
 * Renders the "mission" step, which gives the user a real-world task.
 */
export default function renderMission(container, part) {
    // Get the localized prompt text
    const missionPrompt = resolveLocalized(part.prompt);

    // Set the container's innerHTML directly
    container.innerHTML = `
        <div class="p-6 text-center animate-fade-in">
            <div class="flex flex-col items-center justify-center bg-blue-50 border-2 border-blue-200 rounded-xl p-8 shadow-sm">
                <h3 class="text-2xl font-bold text-blue-800 mb-2">🎯 Your Mission</h3>
                <p class="text-lg text-gray-700 leading-relaxed">${missionPrompt}</p>
            </div>
        </div>
    `;
}