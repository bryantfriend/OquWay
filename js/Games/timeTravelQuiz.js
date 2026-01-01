// js/Games/timeTravelQuiz.js

import { registerGame } from "../gamesRegistry.js";
import { TIME_TRAVEL_QUIZ_QUESTIONS } from "../data.js";
import { showMessage } from "../utilities.js";
import { getText } from "../i18n.js";
import { studentData } from "../config.js";

const screenId = "timeTravelQuizScreen";
let currentQuestionIndex = 0;

function loadQuestion(index) {
  const q = TIME_TRAVEL_QUIZ_QUESTIONS[index];
  if (!q) {
    showMessage("quizAllDone", 3000);
    studentData.points.cognitive += 20;
    import("../activitiesList.js").then(m => m.renderActivities());
    document.getElementById("activityScreen").classList.add("active");
    return;
  }

  document.querySelector(`#${screenId} .question`).textContent = getText(q.questionKey);
  const container = document.getElementById("quizOptionsContainer");
  container.innerHTML = "";

  q.options.sort(() => 0.5 - Math.random()).forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => handleAnswer(opt, q.correctAnswer));
    container.appendChild(btn);
  });

  document.getElementById("nextQuizBtn").style.display = "none";
}

function handleAnswer(selected, correct) {
  document.querySelectorAll(".quiz-option-btn").forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === correct) btn.classList.add("correct");
    if (btn.textContent === selected && selected !== correct) btn.classList.add("incorrect");
  });

  if (selected === correct) {
    showMessage("quizCorrect", 2000);
    studentData.points.cognitive += 5;
  } else {
    showMessage("quizIncorrect", 2000);
  }

  document.getElementById("nextQuizBtn").style.display = "block";
}

export function renderTimeTravelQuiz() {
  currentQuestionIndex = 0;
  loadQuestion(currentQuestionIndex);

  document.getElementById("nextQuizBtn").textContent = getText("nextBtn");
  document.getElementById("backFromTimeTravelQuizBtn").textContent = getText("backToActivitiesBtn");
}

export function initTimeTravelQuiz() {
  document.getElementById("nextQuizBtn").addEventListener("click", () => {
    currentQuestionIndex++;
    loadQuestion(currentQuestionIndex);
  });

  document.getElementById("backFromTimeTravelQuizBtn").addEventListener("click", () => {
    import("../activitiesList.js").then(m => m.renderActivities());
    document.getElementById("activityScreen").classList.add("active");
  });
}

const screenHtml = `
<div id="${screenId}" class="screen">
  <h1 data-i18n="timeTravelQuizTitle"></h1>
  <div class="quiz-container">
    <p class="question" data-i18n=""></p>
    <div id="quizOptionsContainer" class="options-container"></div>
    <button id="nextQuizBtn" style="display:none;" data-i18n="nextBtn"></button>
  </div>
  <button id="backFromTimeTravelQuizBtn" data-i18n="backToActivitiesBtn"></button>
</div>
`;

registerGame({
  id: "time-travel-quiz",
  icon: "🗺️",
  titleKey: "timeTravelQuizTitle",
  descriptionKey: "timeTravelQuizPrompt",
  screenId,
  screenHtml,
  render: renderTimeTravelQuiz,
  init: initTimeTravelQuiz
});
