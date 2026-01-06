
import BaseStep from './BaseStep.js';
import { resolveLocalized } from './utils.js';

export default class FillInTheBlankStep extends BaseStep {
    static get id() { return 'fillInTheBlank'; }
    static get version() { return '1.0.0'; }
    static get displayName() { return 'Fill In The Blank'; }
    static get description() { return 'Choose the correct word to complete the sentence.'; }
    static get category() { return 'assessment'; }
    static get tags() { return ['grammar', 'vocab', 'quiz']; }

    static get editorSchema() {
        return {
            fields: [
                { key: "prompt", label: "Instruction", type: "text", default: "Complete the sentence:" },
                { key: "question", label: "Sentence (use ___ for blank)", type: "textarea", default: "The cat is ___ the table." },
                {
                    key: "options",
                    label: "Options",
                    type: "array",
                    itemSchema: {
                        fields: [
                            { key: "text", label: "Option Text", type: "text" },
                            { key: "isCorrect", label: "Is Correct?", type: "checkbox" },
                            { key: "feedback", label: "Feedback (Optional)", type: "text" }
                        ]
                    },
                    default: [
                        { text: "on", isCorrect: true, feedback: "Correct position!" },
                        { text: "under", isCorrect: false, feedback: "Look closer." }
                    ]
                }
            ]
        };
    }

    static get defaultConfig() {
        return {
            title: "Fill In The Blank",
            prompt: "Complete the sentence:",
            question: "This is a ___.",
            options: [
                { text: "test", isCorrect: true },
                { text: "wrong", isCorrect: false }
            ]
        };
    }

    static render({ container, config, context }) {
        const lang = context.lang || 'en';
        // Mock speak function or import it if we move speech utils
        // For now, let's keep it simple or accept it as a dependency
        // We'll define a simple helper or assume window.speechSynthesis for now if needed, 
        // but looking at original code it imported 'speak' from utils.
        // We will inline the logic or use a shared util if we had one.
        // For Shared steps, we relying on standard APIs or passed in 'speak' context would be better.
        // I'll stick to basic DOM for the shared renderer to avoid complex dependency chains for now.

        const prompt = resolveLocalized(config.prompt) || "Complete the sentence:";
        const question = resolveLocalized(config.question) || "___";
        const options = config.options || [];

        const formattedQuestion = question.replace(
            "___",
            `<span id="blankSpot" class="font-bold text-purple-600 underline decoration-dashed decoration-2">___</span>`
        );

        container.innerHTML = `
            <div class="p-6 bg-white/90 rounded-xl shadow-xl max-w-2xl mx-auto border border-gray-100">
                <h3 class="text-xl font-semibold mb-3 text-center text-gray-800">${prompt}</h3>
                <p class="text-gray-700 bg-gray-100 p-4 rounded-lg mb-4 text-center text-lg">${formattedQuestion}</p>

                <div id="choice-container" class="grid sm:grid-cols-2 gap-3">
                    <!-- Options injected here -->
                </div>

                <p id="feedback-message" class="mt-6 h-10 text-center font-semibold text-lg transition-all"></p>

                <div id="controls" class="hidden mt-6 flex justify-center">
                    <button id="retryBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">🔁 Try Again</button>
                </div>
                 <style>
                    .correct-glow { animation: glow-green 0.8s ease-in-out; }
                    .wrong-shake { animation: shake 0.4s ease-in-out; }
                    @keyframes glow-green {
                        0% { text-shadow: 0 0 0 #22c55e; }
                        50% { text-shadow: 0 0 10px #22c55e; }
                        100% { text-shadow: 0 0 0 #22c55e; }
                    }
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-5px); }
                        75% { transform: translateX(5px); }
                    }
                </style>
            </div>
        `;

        const choiceContainer = container.querySelector("#choice-container");
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = "choice-btn w-full text-left p-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-800 font-medium";
            btn.textContent = resolveLocalized(opt.text);
            btn.onclick = () => handleChoice(btn, opt);
            choiceContainer.appendChild(btn);
        });

        const feedbackEl = container.querySelector("#feedback-message");
        const blankSpot = container.querySelector("#blankSpot");
        const retryBtn = container.querySelector("#retryBtn");
        const controls = container.querySelector("#controls");

        const correctAnswerObj = options.find(opt => opt.isCorrect);
        const correctAnswerText = resolveLocalized(correctAnswerObj?.text) || "???";

        function handleChoice(button, selectedData) {
            // Disable all
            const allBtns = container.querySelectorAll(".choice-btn");
            allBtns.forEach(b => {
                b.disabled = true;
                b.classList.remove("hover:bg-gray-50");
            });

            if (selectedData.isCorrect) {
                // Correct
                button.classList.replace("border-gray-300", "border-green-500");
                button.classList.add("bg-green-500", "text-white");

                feedbackEl.textContent = "Correct!"; // Could use localization logic if passed in context
                feedbackEl.className = "mt-6 h-10 text-center font-semibold text-green-600 correct-glow";

                blankSpot.textContent = correctAnswerText;
                blankSpot.classList.add("text-green-600", "font-bold");

                playAudio("https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.wav");
                controls.classList.remove("hidden");
            } else {
                // Incorrect
                button.classList.replace("border-gray-300", "border-red-500");
                button.classList.add("bg-red-500", "text-white", "wrong-shake");

                feedbackEl.textContent = resolveLocalized(selectedData.feedback) || "Not quite.";
                feedbackEl.className = "mt-6 h-10 text-center font-semibold text-red-600";

                playAudio("https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.wav");

                // Highlight correct
                allBtns.forEach(btn => {
                    if (btn.textContent === correctAnswerText) {
                        btn.classList.replace("border-gray-300", "border-green-500");
                        btn.classList.add("bg-green-500", "text-white");
                    }
                });
                blankSpot.textContent = correctAnswerText;
                blankSpot.classList.add("text-green-600", "font-bold");
                controls.classList.remove("hidden");
            }
        }

        retryBtn.onclick = () => {
            // Simple re-render by calling static render again?
            // Easier to separate setup from render, but here we can just rebuild the content for now.
            // Ideally we shouldn't rely on recursion of static methods if we want to save state, 
            // but for simple drill, it's fine.
            FillInTheBlankStep.render({ container, config, context });
        };

        function playAudio(url) {
            try { new Audio(url).play().catch(() => { }); } catch (e) { }
        }
    }
}
