// js/steps/renderMatchingGame.js

import { speak } from './speech.js'; // <-- PATH UPDATED to look in the current folder

// Helper to get localized text
function resolveLocalized(val) {
    // ... (rest of the function is the same)
    if (!val) return "";
    if (typeof val === "string") return val;
    const lang = (localStorage.getItem("language") || "en").toLowerCase();
    const normalizedLang = lang === "ky" ? "kg" : lang;
    return val[normalizedLang] ?? val.en ?? Object.values(val)[0] ?? [];
}

export default function renderMatchingGame(container, part) {
    // The rest of this file is exactly the same as before.
    // ...
    const pairs = resolveLocalized(part.pairs);
    if (!pairs || pairs.length === 0) {
        container.innerHTML = `<p class="text-red-500">Error: No pairs found for this game.</p>`;
        return;
    }

    const answerKey = new Map(pairs);
    let correctMatches = 0;
    let selectedTermEl = null;

    const columnA = pairs.map(p => p[0]);
    let columnB = pairs.map(p => p[1]);

    for (let i = columnB.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [columnB[i], columnB[j]] = [columnB[j], columnB[i]];
    }

    const termsHtml = columnA.map(term => `
        <div class="p-3 mb-2 bg-white border rounded-lg cursor-pointer shadow-sm transition-all duration-200 hover:ring-2 hover:ring-blue-400" data-term="${term}">
            ${term}
        </div>
    `).join('');

    const targetsHtml = columnB.map(target => `
        <div class="p-3 mb-2 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center min-h-[50px] transition-all duration-200" data-target="${target}">
            <span class="text-gray-500 italic">${target}</span>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="p-4 animate-fade-in max-w-2xl mx-auto">
            <h3 class="text-xl font-bold text-center text-gray-800 mb-2">Match the Pairs</h3>
            <p class="text-center text-gray-600 mb-6">Select a word on the left, then click its matching meaning on the right.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <div id="terms-container">${termsHtml}</div>
                <div id="targets-container">${targetsHtml}</div>
            </div>

            <div id="completion-message" class="hidden text-center mt-8 p-6 bg-green-100 border-2 border-green-500 rounded-lg animate-fade-in">
                <h4 class="text-2xl font-bold text-green-800">🎉 Well Done!</h4>
                <p class="text-green-700 mt-2">You've matched all the pairs correctly.</p>
            </div>
        </div>
        
        <style>
            .selected {
                transform: scale(1.05);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.7);
                border-color: transparent !important;
            }
            .correct {
                background-color: #D1FAE5 !important;
                color: #065F46;
                cursor: default !important;
                opacity: 0.7;
            }
            .incorrect-shake {
                animation: shake 0.5s ease-in-out;
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                20%, 60% { transform: translateX(-8px); }
                40%, 80% { transform: translateX(8px); }
            }
        </style>
    `;

    const termElements = container.querySelectorAll('[data-term]');
    const targetElements = container.querySelectorAll('[data-target]');
    const completionMessage = container.querySelector('#completion-message');

    termElements.forEach(termEl => {
        termEl.addEventListener('click', () => {
            if (termEl.classList.contains('correct')) return;

            speak(termEl.dataset.term, 'en');

            if (selectedTermEl === termEl) {
                selectedTermEl.classList.remove('selected');
                selectedTermEl = null;
                return;
            }
            
            if (selectedTermEl) {
                selectedTermEl.classList.remove('selected');
            }
            selectedTermEl = termEl;
            selectedTermEl.classList.add('selected');
        });
    });
    
    // ... (the targetElements listener remains unchanged)
    targetElements.forEach(targetEl => {
        targetEl.addEventListener('click', () => {
            if (!selectedTermEl || targetEl.matched) return;

            const termValue = selectedTermEl.dataset.term;
            const targetValue = targetEl.dataset.target;

            if (answerKey.get(termValue) === targetValue) {
                selectedTermEl.classList.remove('selected');
                selectedTermEl.classList.add('correct');
                targetEl.innerHTML = `<span class="font-semibold">${termValue}</span>`;
                targetEl.classList.add('correct');
                targetEl.classList.remove('bg-gray-100');
                targetEl.matched = true;
                selectedTermEl = null;
                correctMatches++;
                
                if (correctMatches === pairs.length) {
                    completionMessage.classList.remove('hidden');
                }

            } else {
                selectedTermEl.classList.add('incorrect-shake');
                targetEl.classList.add('incorrect-shake');
                setTimeout(() => {
                    if (selectedTermEl) selectedTermEl.classList.remove('selected', 'incorrect-shake');
                    targetEl.classList.remove('incorrect-shake');
                    selectedTermEl = null;
                }, 500);
            }
        });
    });
}