// js/steps/renderReflection.js

// Helper function to get the right text for the user's selected language.
function resolveLocalized(val) {
    if (!val) return "";
    if (typeof val === "string") return val;
    
    const lang = (localStorage.getItem("language") || "en").toLowerCase();
    const normalizedLang = lang === "ky" ? "kg" : lang;

    return val[normalizedLang] ?? val.en ?? Object.values(val)[0] ?? "";
}

/**
 * Renders the "reflection" step, which asks the user a question to think about.
 */
export default function renderReflection(container, part) {
    // Get the localized prompt text
    const reflectionPrompt = resolveLocalized(part.prompt);

    // Set the container's innerHTML directly.
    // This one includes a simple textarea for the user to type in, though saving the text is not yet implemented.
    container.innerHTML = `
        <div class="p-6 text-center animate-fade-in">
            <div class="flex flex-col items-center justify-center bg-purple-50 border-2 border-purple-200 rounded-xl p-8 shadow-sm">
                <h3 class="text-2xl font-bold text-purple-800 mb-4">🧠 Reflection Time</h3>
                <p class="text-lg text-gray-700 leading-relaxed mb-6">${reflectionPrompt}</p>
                <textarea class="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition" placeholder="Write your thoughts here... (optional)"></textarea>
            </div>
        </div>
    `;
}