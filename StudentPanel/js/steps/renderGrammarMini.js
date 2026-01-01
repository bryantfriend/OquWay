// js/steps/renderGrammarMini.js

function getLang() {
    const raw = (localStorage.getItem("language") || "en").toLowerCase();
    return raw === "ky" ? "kg" : raw;
}

function resolveLocalized(val, lang = getLang()) {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val[lang] ?? val.en ?? Object.values(val)[0] ?? "";
}

export default function renderGrammarMini(container, part) {
    const lang = getLang();

    const focus = resolveLocalized(part.focus, lang);
    const explanation = resolveLocalized(part.explanation, lang);
    const examples = resolveLocalized(part.examples, lang) || [];
    const quizItems = part.quiz || [];

    const examplesHtml = examples.map(ex => `<li class="mb-1 bg-gray-50 p-2 rounded">${ex.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`).join('');

    const quizHtml = quizItems.map((item, index) => {
        const question = resolveLocalized(item.question, lang);
        const options = resolveLocalized(item.options, lang) || [];
        const formattedQuestion = question.replace('___', '<span class="font-bold text-purple-600">___</span>');
        
        const optionsHtml = options.map(opt => `<button class="quiz-option-btn p-2 border-2 rounded hover:bg-gray-100" data-quiz-index="${index}">${opt}</button>`).join('');

        return `
            <div class="quiz-item mt-4" data-answer="${resolveLocalized(item.answer, lang)}">
                <p class="mb-2">${formattedQuestion}</p>
                <div class="grid grid-cols-3 gap-2">${optionsHtml}</div>
                <div class="quiz-feedback mt-2 h-6"></div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="p-2 border-2 border-purple-200 bg-purple-50 rounded-lg">
            <h3 class="text-xl font-bold text-purple-800 mb-2">💡 Grammar Focus: ${focus}</h3>
            <p class="text-gray-700 mb-4">${explanation}</p>
            
            <h4 class="font-semibold text-purple-700">Examples:</h4>
            <ul class="list-disc list-inside my-2 text-gray-800">${examplesHtml}</ul>
            
            <hr class="my-4">
            
            <h4 class="font-semibold text-purple-700">Quick Quiz:</h4>
            <div id="quiz-container">${quizHtml}</div>
        </div>
    `;

    container.querySelector('#quiz-container').addEventListener('click', e => {
        if (!e.target.classList.contains('quiz-option-btn')) return;

        const button = e.target;
        const quizItem = button.closest('.quiz-item');
        const feedbackEl = quizItem.querySelector('.quiz-feedback');
        const correctAnswer = quizItem.dataset.answer;
        const selectedAnswer = button.textContent;

        quizItem.querySelectorAll('.quiz-option-btn').forEach(btn => btn.disabled = true);

        if (selectedAnswer === correctAnswer) {
            button.classList.add('bg-green-500', 'text-white', 'border-green-500');
            feedbackEl.innerHTML = '<p class="text-green-600">Correct!</p>';
        } else {
            button.classList.add('bg-red-500', 'text-white', 'border-red-500');
            feedbackEl.innerHTML = `<p class="text-red-600">Not quite. The answer is '${correctAnswer}'.</p>`;
        }
    });
}