// js/steps/renderFillInTheBlank.js

function getLang() {
    const raw = (localStorage.getItem("language") || "en").toLowerCase();
    return raw === "ky" ? "kg" : raw;
}

function resolveLocalized(val, lang = getLang()) {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val[lang] ?? val.en ?? Object.values(val)[0] ?? "";
}

export default function renderFillInTheBlank(container, part) {
    const lang = getLang();

    const prompt = resolveLocalized(part.prompt, lang) || "Complete the sentence:";
    const question = resolveLocalized(part.question, lang) || "___";
    const options = part.options || []; // Keep as array of objects

    const formattedQuestion = question.replace('___', '<span class="font-bold text-purple-600">___</span>');

    container.innerHTML = `
        <div class="p-2">
            <h3 class="text-lg font-semibold mb-2">${prompt}</h3>
            <p class="text-gray-700 bg-gray-100 p-4 rounded-lg mb-4 text-center text-lg">${formattedQuestion}</p>
            
            <div id="choice-container" class="grid grid-cols-1 gap-2">
                ${options.map(opt => {
                    // Embed the full option data in a data attribute
                    return `<button class="choice-btn w-full text-left p-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition" data-option='${JSON.stringify(opt)}'>
                                ${resolveLocalized(opt.text, lang)}
                            </button>`;
                }).join('')}
            </div>
            
            <p id="feedback-message" class="mt-4 h-10 text-center font-semibold"></p>
        </div>
    `;

    const choiceButtons = container.querySelectorAll('.choice-btn');
    const feedbackEl = container.querySelector('#feedback-message');
    const correctAnswerObj = options.find(opt => opt.isCorrect);
    const correctAnswerText = resolveLocalized(correctAnswerObj?.text, lang);

    choiceButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedOptionData = JSON.parse(button.dataset.option);
            
            choiceButtons.forEach(btn => {
                btn.disabled = true;
                btn.classList.remove('hover:bg-gray-50');
            });

            if (selectedOptionData.isCorrect) {
                button.classList.remove('border-gray-300');
                button.classList.add('bg-green-500', 'text-white', 'border-green-500');
                feedbackEl.textContent = resolveLocalized({ en: "Correct!", ru: "Правильно!", kg: "Туура!" }, lang);
                feedbackEl.className = 'mt-4 h-10 text-center font-semibold text-green-600';
            } else {
                button.classList.remove('border-gray-300');
                button.classList.add('bg-red-500', 'text-white', 'border-red-500');
                
                const feedbackText = resolveLocalized(selectedOptionData.feedback, lang) || resolveLocalized({ en: "Not quite.", ru: "Не совсем.", kg: "Туура эмес." }, lang);
                feedbackEl.textContent = feedbackText;
                feedbackEl.className = 'mt-4 h-10 text-center font-semibold text-red-600';

                // Highlight the correct answer
                choiceButtons.forEach(btn => {
                    if (btn.textContent.trim() === correctAnswerText) {
                        btn.classList.remove('border-gray-300');
                        btn.classList.add('bg-green-500', 'text-white', 'border-green-500');
                    }
                });
            }
        });
    });
}