import { speak } from "../utils/speech.js";

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
  const options = part.options || [];

  const formattedQuestion = question.replace(
    "___",
    `<span id="blankSpot" class="font-bold text-purple-600 underline decoration-dashed decoration-2">___</span>`
  );

  container.innerHTML = `
    <div class="p-6 bg-white/90 rounded-xl shadow-xl max-w-2xl mx-auto">
      <h3 class="text-xl font-semibold mb-3 text-center text-gray-800">${prompt}</h3>
      <p class="text-gray-700 bg-gray-100 p-4 rounded-lg mb-4 text-center text-lg">${formattedQuestion}</p>

      <div id="choice-container" class="grid sm:grid-cols-2 gap-3">
        ${options
          .map(
            opt => `
              <button class="choice-btn w-full text-left p-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-800 font-medium" 
                      data-option='${JSON.stringify(opt)}'>
                ${resolveLocalized(opt.text, lang)}
              </button>`
          )
          .join("")}
      </div>

      <p id="feedback-message" class="mt-6 h-10 text-center font-semibold text-lg transition-all"></p>

      <div id="controls" class="hidden mt-6 flex justify-center">
        <button id="retryBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">🔁 Try Again</button>
      </div>

      <style>
        .correct-glow {
          animation: glow-green 0.8s ease-in-out;
        }
        .wrong-shake {
          animation: shake 0.4s ease-in-out;
        }
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

  const choiceButtons = container.querySelectorAll(".choice-btn");
  const feedbackEl = container.querySelector("#feedback-message");
  const blankSpot = container.querySelector("#blankSpot");
  const retryBtn = container.querySelector("#retryBtn");
  const controls = container.querySelector("#controls");

  const correctAnswerObj = options.find(opt => opt.isCorrect);
  const correctAnswerText = resolveLocalized(correctAnswerObj?.text, lang);

  const successSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.wav");
  const failSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.wav");

  choiceButtons.forEach(button => {
    button.addEventListener("click", () => {
      const selectedOptionData = JSON.parse(button.dataset.option);

      // Disable all buttons
      choiceButtons.forEach(btn => {
        btn.disabled = true;
        btn.classList.remove("hover:bg-gray-50");
      });

      if (selectedOptionData.isCorrect) {
        // ✅ Correct Answer
        button.classList.replace("border-gray-300", "border-green-500");
        button.classList.add("bg-green-500", "text-white");
        feedbackEl.textContent = resolveLocalized(
          { en: "Correct!", ru: "Правильно!", kg: "Туура!" },
          lang
        );
        feedbackEl.className = "mt-6 h-10 text-center font-semibold text-green-600 correct-glow";
        blankSpot.textContent = correctAnswerText;
        blankSpot.classList.add("text-green-600", "font-bold");
        successSound.play().catch(() => {});
        speak(correctAnswerText, lang);
        controls.classList.remove("hidden");
      } else {
        // ❌ Incorrect Answer
        button.classList.replace("border-gray-300", "border-red-500");
        button.classList.add("bg-red-500", "text-white", "wrong-shake");

        const feedbackText =
          resolveLocalized(selectedOptionData.feedback, lang) ||
          resolveLocalized({ en: "Not quite.", ru: "Не совсем.", kg: "Туура эмес." }, lang);
        feedbackEl.textContent = feedbackText;
        feedbackEl.className = "mt-6 h-10 text-center font-semibold text-red-600";
        failSound.play().catch(() => {});

        // Highlight correct option
        choiceButtons.forEach(btn => {
          if (btn.textContent.trim() === correctAnswerText) {
            btn.classList.replace("border-gray-300", "border-green-500");
            btn.classList.add("bg-green-500", "text-white");
          }
        });

        // Reveal answer in sentence
        blankSpot.textContent = correctAnswerText;
        blankSpot.classList.add("text-green-600", "font-bold");
        controls.classList.remove("hidden");
      }
    });
  });

  retryBtn.addEventListener("click", () => {
    renderFillInTheBlank(container, part);
  });
}
