
// js/steps/renderIntentCheck.js
import { resolveLocalized } from "../../../Shared/steps/renderStep.js";

export default function renderIntentCheck(container, stepData) {
    const question = resolveLocalized(stepData.question) || "Question text...";
    const options = stepData.options || [];

    // Render logic
    container.innerHTML = `
        <div class="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg animate-fade-in border-t-4 border-blue-500">
            <h2 class="text-2xl font-bold mb-6 text-gray-800 text-center">${question}</h2>
            
            <div class="space-y-3">
                ${options.map((opt, idx) => `
                    <button class="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition flex items-center group relative overflow-hidden"
                            onclick="this.nextElementSibling.classList.toggle('hidden');">
                        <span class="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mr-4 group-hover:bg-blue-200 group-hover:text-blue-700 transition">
                            ${String.fromCharCode(65 + idx)}
                        </span>
                        <span class="font-medium text-gray-700 group-hover:text-gray-900">${resolveLocalized(opt.text)}</span>
                    </button>
                    <div class="hidden ml-12 p-3 bg-gray-50 text-sm rounded-b-lg border-l-2 ${opt.isCorrect ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'} animate-fade-in">
                        ${opt.isCorrect ? '✅ Correct!' : '❌ Incorrect.'} ${opt.feedback ? resolveLocalized(opt.feedback) : ''}
                    </div>
                `).join('')}
            </div>

            <div class="mt-8 text-center">
                 <button class="px-6 py-2 bg-blue-600 text-white rounded-full font-bold shadow hover:bg-blue-700 transition transform hover:-translate-y-1">
                    Check Answer
                 </button>
            </div>
        </div>
    `;
}
