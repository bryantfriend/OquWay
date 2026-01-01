
// js/Games/readingTime.js

import { registerGame }               from "../gamesRegistry.js";
import { READING_CORRECT_ANSWER }     from "../data.js";
import { showMessage, updateDashboardPoints } from "../utilities.js";
import { getText }                    from "../i18n.js";
import { studentData }                from "../config.js";

const screenId = "readingTimeScreen";

// Render function: set up story, question, reset options & buttons
export function renderReadingTime() {
  // Header
  document.querySelector(`#${screenId} h1`).textContent =
    getText("readingTimeTitle");
  // Story title, content, question
  document.querySelector(
    `#${screenId} p[data-i18n="squeakyStoryTitle"]`
  ).textContent = getText("squeakyStoryTitle");
  document.querySelector(
    `#${screenId} p[data-i18n="squeakyStoryContent"]`
  ).textContent = getText("squeakyStoryContent");
  document.querySelector(
    `#${screenId} p[data-i18n="squeakyQuestion"]`
  ).textContent = getText("squeakyQuestion");

  // Reset radio buttons
  document
    .querySelectorAll(`#${screenId} input[name="readingAnswer"]`)
    .forEach(radio => {
      radio.checked = false;
      radio.disabled = false;
      radio.closest("label").classList.remove("selected");
    });

  // Reset Check Answer button
  const checkBtn = document.getElementById("checkReadingAnswerBtn");
  checkBtn.textContent = getText("checkAnswerBtn");
  checkBtn.disabled   = false;

  // Reset Back button
  const backBtn = document.getElementById("backFromReadingTimeBtn");
  backBtn.textContent = getText("backToActivitiesBtn");
}

// Handler for checking the selected answer
function checkReadingAnswer() {
  const selected = document.querySelector(
    `#${screenId} input[name="readingAnswer"]:checked`
  );
  if (!selected) {
    showMessage("readingNoSelection", 2000);
    return;
  }
  if (selected.value === READING_CORRECT_ANSWER) {
    showMessage("readingCorrect", 2000);
    studentData.points.cognitive += 10;
    updateDashboardPoints();
    document.getElementById("checkReadingAnswerBtn").disabled = true;
  } else {
    showMessage("readingIncorrect", 2000);
  }
}

// Init function: wire up buttons and label highlighting
export function initReadingTime() {
  // Check Answer button
  document.getElementById("checkReadingAnswerBtn")
    .addEventListener("click", checkReadingAnswer);

  // Back button
  document.getElementById("backFromReadingTimeBtn")
    .addEventListener("click", () => {
      import("../activitiesList.js").then(m => m.renderActivities());
      document.getElementById("activityScreen").classList.add("active");
    });

  // Highlight selected label
  document
    .querySelectorAll(`#${screenId} label`)
    .forEach(label => {
      label.addEventListener("click", () => {
        document
          .querySelectorAll(`#${screenId} label`)
          .forEach(l => l.classList.remove("selected"));
        label.classList.add("selected");
      });
    });
}

// HTML template for the Reading Time screen
const screenHtml = `
<div id="${screenId}" class="screen">
  <h1 data-i18n="readingTimeTitle"></h1>
  <div class="reading-time-container">
    <p data-i18n="squeakyStoryTitle"></p>
    <p data-i18n="squeakyStoryContent"></p>
    <p data-i18n="squeakyQuestion"></p>
    <div id="readingOptions" class="reading-options">
      <label class="reading-option">
        <input type="radio" name="readingAnswer" value="apples">
        <span data-i18n="applesOption"></span>
      </label>
      <label class="reading-option">
        <input type="radio" name="readingAnswer" value="nuts">
        <span data-i18n="nutsOption"></span>
      </label>
      <label class="reading-option">
        <input type="radio" name="readingAnswer" value="playing">
        <span data-i18n="playingOption"></span>
      </label>
    </div>
    <button
      id="checkReadingAnswerBtn"
      class="check-code-btn"
      data-i18n="checkAnswerBtn"
    ></button>
  </div>
  <button
    id="backFromReadingTimeBtn"
    class="back-btn"
    data-i18n="backToActivitiesBtn"
  ></button>
</div>
`;

// Register this game so it’s auto‐discovered and injected
registerGame({
  id:             "reading-time",
  icon:           "📖",
  titleKey:       "readingTimeTitle",
  descriptionKey: "squeakyStoryTitle",
  screenId:       screenId,
  screenHtml:     screenHtml,
  render:         renderReadingTime,
  init:           initReadingTime
});

