// js/Games/memoryChallenge.js

import { registerGame }                from "../gamesRegistry.js";
import { MEMORY_CHALLENGE_QUESTIONS }  from "../data.js";
import { getText }                     from "../i18n.js";
import { showMessage }                 from "../utilities.js";
import { studentData }                 from "../config.js";

const screenId = "memoryChallengeScreen";
let currentIdx = 0;

// Render function: resets index and loads first question
export function renderMemoryChallenge() {
  currentIdx = 0;
  loadMemoryQuestion(currentIdx);
}

// Internal: load question i, or finish if none left
function loadMemoryQuestion(i) {
  const q = MEMORY_CHALLENGE_QUESTIONS[i];
  if (!q) {
    showMessage("memoryAllDone", 3000);
    studentData.points.cognitive += 20;
    import("../activitiesList.js").then(m => m.renderActivities());
    document.getElementById("activityScreen").classList.add("active");
    return;
  }

  // Set fact text
  document.getElementById("memoryFactDisplay").textContent =
    getText(q.factKey);

  // Clear previous options
  const cont = document.getElementById("memoryOptionsContainer");
  cont.innerHTML = "";

  // Shuffle and render options
  q.options
    .slice()
    .sort(() => 0.5 - Math.random())
    .forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "memory-option-btn";
      btn.textContent = opt;
      btn.addEventListener("click", () =>
        handleMemoryAnswer(opt, q.correctAnswer)
      );
      cont.appendChild(btn);
    });

  // Hide next button until an answer is chosen
  document.getElementById("nextMemoryChallengeBtn").style.display = "none";
}

// Handle answer selection: mark correct/incorrect, show message, reveal Next
function handleMemoryAnswer(answer, correct) {
  document.querySelectorAll(".memory-option-btn").forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
    if (b.textContent === answer && answer !== correct) b.classList.add("incorrect");
  });

  if (answer === correct) {
    showMessage("memoryCorrect", 2000);
    studentData.points.cognitive += 5;
  } else {
    showMessage("memoryIncorrect", 2000);
  }

  document.getElementById("nextMemoryChallengeBtn").style.display = "block";
}

// Init function: wire up Next and Back buttons
export function initMemoryChallenge() {
  document
    .getElementById("nextMemoryChallengeBtn")
    .addEventListener("click", () => {
      currentIdx++;
      loadMemoryQuestion(currentIdx);
    });

  document
    .getElementById("backFromMemoryChallengeBtn")
    .addEventListener("click", () => {
      import("../activitiesList.js").then(m => m.renderActivities());
      document.getElementById("activityScreen").classList.add("active");
    });
}

// HTML template for the memory challenge screen
const screenHtml = `
<div id="${screenId}" class="screen">
  <h1 data-i18n="memoryChallengeTitle"></h1>
  <div class="memory-challenge-container">
    <p data-i18n="memoryFactPrompt"></p>
    <p id="memoryFactDisplay" class="fact-display"></p>
    <div id="memoryOptionsContainer" class="memory-options"></div>
    <button id="nextMemoryChallengeBtn" class="check-code-btn" data-i18n="nextChallengeBtn"></button>
  </div>
  <button id="backFromMemoryChallengeBtn" class="back-btn" data-i18n="backToActivitiesBtn"></button>
</div>
`;

// Register this game so it’s auto‐discovered and injected
registerGame({
  id:             "memory-challenge",
  icon:           "🧠",
  titleKey:       "memoryChallengeTitle",
  descriptionKey: "memoryFactPrompt",
  screenId:       screenId,
  screenHtml:     screenHtml,
  render:         renderMemoryChallenge,
  init:           initMemoryChallenge
});
