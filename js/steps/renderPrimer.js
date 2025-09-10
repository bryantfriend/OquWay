// js/steps/renderPrimer.js

// This helper function gets the right text for the user's selected language.
function resolveLocalized(val) {
    if (!val) return "";
    if (typeof val === "string") return val; // Handles cases where text is not an object
    
    // Gets language from storage, defaults to 'en'
    const lang = (localStorage.getItem("language") || "en").toLowerCase();
    // Special case for Kyrgyz language code
    const normalizedLang = lang === "ky" ? "kg" : lang;

    // Return the correct language string, with fallbacks
    return val[normalizedLang] ?? val.en ?? Object.values(val)[0] ?? "";
}

/**
 * Renders the "primer" step.
 * Note the two arguments: `container` and `part`.
 * This is the function that must be the default export.
 */
export default function renderPrimer(container, part) {
    // Use the helper to get the correct text string
    const primerText = resolveLocalized(part.text);

    // This is the most important part: we set the container's HTML directly.
    // We do not use a 'return' statement.
    container.innerHTML = `
        <div class="space-y-4 p-4 animate-fade-in">
            <img src="${part.src}" alt="Primer" class="mx-auto rounded-lg shadow-md max-h-80">

            <p class="text-lg text-center text-gray-800 whitespace-pre-line">${primerText}</p>
        </div>
    `;
}