
import BaseStep from './BaseStep.js';
import { resolveLocalized } from './utils.js';

export default class GrammarMiniStep extends BaseStep {
    static get id() { return 'grammarMini'; }
    static get version() { return '1.0.0'; }
    static get displayName() { return 'Grammar Mini'; }
    static get description() { return 'A mini-lesson on a grammar point with a quick quiz.'; }
    static get category() { return 'content'; }
    static get tags() { return ['grammar', 'explanation']; }

    static get editorSchema() {
        return {
            fields: [
                { key: "focus", label: "Grammar Focus", type: "text", default: "Present Simple" },
                { key: "explanation", label: "Explanation", type: "textarea", default: "Use this for facts." },
                {
                    key: "examples",
                    label: "Examples",
                    type: "array",
                    default: ["I **eat** apples.", "He **runs** fast."]
                },
                {
                    key: "quiz",
                    label: "Quiz Questions",
                    type: "array",
                    itemSchema: {
                        fields: [
                            { key: "question", label: "Question", type: "text" },
                            { key: "options", label: "Options", type: "array" },
                            { key: "answer", label: "Correct Answer (Text)", type: "text" }
                        ]
                    },
                    default: []
                }
            ]
        };
    }

    static get defaultConfig() {
        return {
            title: "Grammar Lesson",
            focus: "Subject Pronouns",
            explanation: "I, You, He, She, It, We, They help us replace names.",
            examples: ["**She** is a doctor.", "**We** are happy."],
            quiz: [
                { question: "___ am a student.", options: ["I", "He"], answer: "I" }
            ]
        };
    }

    static render({ container, config, context }) {
        const focus = resolveLocalized(config.focus);
        const explanation = resolveLocalized(config.explanation);
        const examples = config.examples || [];
        // Support localized array or simple array
        // If config.examples is {en: [], ...}, resolveLocalized might stick to one logic. 
        // Our resolveLocalized handles strings/objects, but arrays? 
        // Let's assume it's an array of strings for now (legacy format).
        // If it's an object {en: ["..."]}, we need to pick it manually if resolveLocalized doesn't handle array detection.
        // But for safety:
        const rawExamples = Array.isArray(examples) ? examples : (examples[context.lang] || examples.en || []);

        const quizItems = config.quiz || [];

        const examplesHtml = rawExamples.map(ex => `<li class="mb-1 bg-gray-50 p-2 rounded text-sm">${ex.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`).join('');

        const quizHtml = quizItems.map((item, index) => {
            const question = resolveLocalized(item.question);
            const options = item.options || []; // assume array of strings
            const formattedQuestion = question.replace('___', '<span class="font-bold text-purple-600">___</span>');

            const optionsHtml = options.map(opt => `<button class="quiz-option-btn p-2 border rounded hover:bg-gray-100 text-sm transition" data-quiz-index="${index}">${opt}</button>`).join('');

            return `
                <div class="quiz-item mt-4 bg-white p-3 rounded border shadow-sm" data-answer="${resolveLocalized(item.answer)}">
                    <p class="mb-2 font-medium text-gray-800">${formattedQuestion}</p>
                    <div class="grid grid-cols-2 gap-2">${optionsHtml}</div>
                    <div class="quiz-feedback mt-2 h-6 text-sm font-semibold"></div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="p-4 border border-purple-200 bg-purple-50/50 rounded-xl">
                <div class="mb-6">
                    <h3 class="text-xl font-bold text-purple-800 mb-2 flex items-center gap-2">
                        <span class="bg-purple-100 p-1 rounded text-2xl">💡</span> ${focus}
                    </h3>
                    <p class="text-gray-700 leading-relaxed">${explanation}</p>
                </div>
                
                ${examplesHtml ? `
                <div class="mb-6">
                    <h4 class="font-semibold text-purple-700 mb-2 uppercase text-xs tracking-wider">Examples</h4>
                    <ul class="space-y-2 text-gray-800">${examplesHtml}</ul>
                </div>` : ''}
                
                ${quizHtml ? `
                <hr class="border-purple-200 my-4">
                <div>
                     <h4 class="font-semibold text-purple-700 mb-3 uppercase text-xs tracking-wider">Quick Check</h4>
                     <div id="quiz-container">${quizHtml}</div>
                </div>` : ''}
            </div>
        `;

        container.querySelector('#quiz-container')?.addEventListener('click', e => {
            if (!e.target.classList.contains('quiz-option-btn')) return;

            const button = e.target;
            const quizItem = button.closest('.quiz-item');
            const feedbackEl = quizItem.querySelector('.quiz-feedback');
            const correctAnswer = quizItem.dataset.answer;
            const selectedAnswer = button.textContent;

            // disable only for this item
            quizItem.querySelectorAll('.quiz-option-btn').forEach(btn => btn.disabled = true);

            if (selectedAnswer === correctAnswer) {
                button.classList.add('bg-green-500', 'text-white', 'border-green-500');
                feedbackEl.innerHTML = '<span class="text-green-600">✅ Correct!</span>';
            } else {
                button.classList.add('bg-red-500', 'text-white', 'border-red-500');
                feedbackEl.innerHTML = `<span class="text-red-600">❌ The answer is '${correctAnswer}'</span>`;
            }
        });
    }
}
