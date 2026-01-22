
// js/steps/renderPrimer.js

import { resolveLocalized } from "../../../Shared/steps/renderStep.js";

/**
 * Renders the "primer" step.
 */
export default function renderPrimer(container, stepData) {
    const primerText = resolveLocalized(stepData.text);
    // Use 'image' (new schema) or 'src' (legacy)
    const imgSrc = stepData.image || stepData.src;

    let imgBlock = '';
    if (imgSrc) {
        imgBlock = `
            <div class="inline-block relative rounded-lg overflow-hidden shadow-md">
                <img src="${imgSrc}" alt="Primer" class="max-h-80 object-cover">
            </div>`;
    }

    container.innerHTML = `
        <div class="space-y-4 p-4 animate-fade-in text-center">
            ${imgBlock}
            <p class="text-lg text-gray-800 whitespace-pre-line leading-relaxed max-w-2xl mx-auto">${primerText}</p>
        </div>
    `;
}
