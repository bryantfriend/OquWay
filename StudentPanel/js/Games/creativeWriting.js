// js/Games/creativeWriting.js

import { registerGame }                from "../gamesRegistry.js";
import { WORDS_FOR_WRITING,
         NUM_WORDS_TO_GENERATE }       from "../data.js";
import { getText }                     from "../i18n.js";
import { showMessage }                 from "../utilities.js";
import { studentData }                 from "../config.js";

const screenId = "creativeWritingScreen";

// Renders the UI each time the screen is shown or re-rendered
export function renderCreativeWriting() {
  // Update screen header and prompt
  document.querySelector(`#${screenId} h1`).textContent =
    getText("creativeWritingTitle");
  document.querySelector(
    `#${screenId} p[data-i18n="creativeWritingPrompt"]`
  ).textContent = getText("creativeWritingPrompt");

  // Generate and display random words
  const shuffled = WORDS_FOR_WRITING.slice().sort(() => 0.5 - Math.random());
  document.getElementById("randomWordsDisplay").textContent =
    shuffled.slice(0, NUM_WORDS_TO_GENERATE).join(", ");

  // Reset textarea and buttons
  const textarea = document.getElementById("creativeWritingTextarea");
  textarea.value = "";
  textarea.placeholder = getText("creativeWritingPlaceholder");

  const finishBtn = document.getElementById("finishWritingBtn");
  finishBtn.textContent = getText("finishWritingBtn");
  finishBtn.disabled = false;

  const backBtn = document.getElementById("backFromCreativeWritingBtn");
  backBtn.textContent = getText("backToActivitiesBtn");
}

// Handles the Finish Writing button click
function finishWriting() {
  const text = document.getElementById("creativeWritingTextarea").value.trim();
  // Require at least 10 words (~3 sentences)
  if (text.split(/\s+/).filter(w => w).length < 10) {
    showMessage("writingTooShort", 2000);
    return;
  }
  showMessage("writingSuccess", 2000);
  studentData.points.creative += 15;
  document.getElementById("finishWritingBtn").disabled = true;
}

// Wires up event listeners once at startup
export function initCreativeWriting() {
  document.getElementById("finishWritingBtn")
    .addEventListener("click", finishWriting);

  document.getElementById("backFromCreativeWritingBtn")
    .addEventListener("click", () => {
      import("../activitiesList.js").then(m => m.renderActivities());
      document.getElementById("activityScreen").classList.add("active");
    });
}

// The HTML template for this game screen
const screenHtml = `
<div id="${screenId}" class="screen">
  <h1 data-i18n="creativeWritingTitle"></h1>
  <div class="creative-writing-container">
    <p data-i18n="creativeWritingPrompt"></p>
    <p id="randomWordsDisplay" class="random-words"></p>
    <textarea
      id="creativeWritingTextarea"
      class="writing-textarea"
      placeholder=""
    ></textarea>
    <button
      id="finishWritingBtn"
      class="check-code-btn"
      data-i18n="finishWritingBtn"
    ></button>
  </div>
  <button
    id="backFromCreativeWritingBtn"
    class="back-btn"
    data-i18n="backToActivitiesBtn"
  ></button>
</div>
`;

// Register this game so it’s auto‐discovered and injected
registerGame({
  id:             "creative-writing",
  icon:           "✍️",
  titleKey:       "creativeWritingTitle",
  descriptionKey: "creativeWritingPrompt",
  screenId:       screenId,
  screenHtml:     screenHtml,
  render:         renderCreativeWriting,
  init:           initCreativeWriting
});
