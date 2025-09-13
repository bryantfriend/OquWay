// js/steps/renderDialogue.js

import { speak } from './speech.js';

// --- HELPER FUNCTIONS ---

/**
 * Gets the current language from localStorage.
 * Normalizes 'ky' to 'kg' for consistency with Firestore.
 * @returns {string} The current language code (e.g., 'en', 'kg').
 */
function getLang() {
    const raw = (localStorage.getItem("language") || "en").toLowerCase();
    return raw === "ky" ? "kg" : raw;
}

/**
 * Resolves a potentially localized value to a string for the current language.
 * @param {string|Object} val - The value to resolve.
 * @returns {string} The resolved string.
 */
function resolveLocalized(val) {
    if (!val) return "";
    if (typeof val === "string") return val;
    const lang = getLang();
    return val[lang] ?? val.en ?? Object.values(val)[0] ?? "";
}


// --- MAIN RENDER FUNCTION ---

/**
 * Renders a dialogue sequence based on the provided part data.
 * @param {HTMLElement} container - The DOM element to render the component into.
 * @param {Object} part - The data object from Firestore for this dialogue step.
 */
export default function renderDialogue(container, part) {
    // 1. Resolve the main title for the dialogue
    const title = resolveLocalized(part.title);
    const lines = part.lines || [];

    if (lines.length === 0) {
        container.innerHTML = `<p class="text-center text-red-500">No dialogue lines found for this activity.</p>`;
        return;
    }

    // 2. Generate the HTML for each dialogue line
    const dialogueHtml = lines.map(line => {
        const text = resolveLocalized(line.text);
        const role = resolveLocalized(line.role).toLowerCase();

        // Determine styling based on the role.
        // We'll assume the "guest" is the user/player.
        const isGuest = role === 'guest';
        const bubbleAlignment = isGuest ? 'justify-end' : 'justify-start';
        const bubbleColor = isGuest ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800';
        const bubbleBorder = isGuest ? 'rounded-br-none' : 'rounded-bl-none';
        const speakerName = isGuest ? 'You' : role.charAt(0).toUpperCase() + role.slice(1);

        // CORRECTED SVG icon path
        const speakIconSvg = `
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd"></path>
            </svg>
        `;

        return `
            <div class="flex ${bubbleAlignment} mb-3 animate-fade-in">
                <div class="w-full max-w-md">
                    <p class="text-sm font-semibold mb-1 ${isGuest ? 'text-right' : 'text-left'}">${speakerName}</p>
                    <div class="${bubbleColor} ${bubbleBorder} rounded-xl p-3 shadow-md flex items-center justify-between">
                        <p class="mr-2">${text}</p>
                        <button class="dialogue-speak-btn flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isGuest ? 'bg-white/20 hover:bg-white/40' : 'bg-gray-500/20 hover:bg-gray-500/40'} transition" data-text="${text}">
                            ${speakIconSvg}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // 3. Assemble the final HTML for the container
    container.innerHTML = `
        <div class="p-4 max-w-2xl mx-auto">
            <h2 class="text-xl font-bold text-center text-gray-800 mb-4 p-3 bg-gray-100 rounded-lg">${title}</h2>
            <div id="dialogue-container">
                ${dialogueHtml}
            </div>
        </div>
    `;

    // 4. Add event listeners to all the speak buttons
    container.querySelectorAll('.dialogue-speak-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const textToSpeak = e.currentTarget.dataset.text;
            if (textToSpeak) {
                speak(textToSpeak, getLang());
            }
        });
    });
}

