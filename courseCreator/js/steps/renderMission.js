
// js/steps/renderMission.js
import { resolveLocalized } from "../../../Shared/steps/renderStep.js";

export default function renderMission(container, stepData) {
    const text = resolveLocalized(stepData.text);

    container.innerHTML = `
        <div class="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-8 rounded-xl shadow-xl text-center animate-fade-in my-4">
            <div class="text-6xl mb-4 animate-bounce">🚀</div>
            <h2 class="text-2xl font-bold mb-4 uppercase tracking-widest">Your Mission</h2>
            <p class="text-lg leading-relaxed max-w-2xl mx-auto">${text}</p>
        </div>
    `;
}
