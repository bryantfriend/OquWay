// js/Games/scienceExperiment.js

import { registerGame } from "../gamesRegistry.js";
import { showMessage } from "../utilities.js";
import { getText } from "../i18n.js";
import { studentData } from "../config.js";

const screenId = "scienceExperimentScreen";

function ensureScreenHtmlExists() {
  if (!document.getElementById(screenId)) {
    const container = document.getElementById("app") || document.body;
    container.insertAdjacentHTML("beforeend", screenHtml);
  }
}

// Render the screen content
export function renderScienceExperiment() {
  ensureScreenHtmlExists();

  document.querySelector(`#${screenId} h1`).textContent =
    getText("scienceExperimentTitle");

  document.querySelector(`#${screenId} p[data-i18n="scienceExperimentName"]`).textContent =
    getText("scienceExperimentName");

  document.querySelector(`#${screenId} p[data-i18n="scienceExperimentDesc"]`).textContent =
    getText("scienceExperimentDesc");

  const textarea = document.getElementById("observationTextarea");
  textarea.value = "";
  textarea.placeholder = getText("observationPlaceholder");

  const submitBtn = document.getElementById("submitObservationBtn");
  submitBtn.textContent = getText("submitObservationBtn");
  submitBtn.disabled = false;

  const backBtn = document.getElementById("backFromScienceExperimentBtn");
  backBtn.textContent = getText("backToActivitiesBtn");
}

function submitObservation() {
  const obs = document.getElementById("observationTextarea").value.trim();
  if (obs.length < 20) {
    return showMessage("observationTooShort", 2000);
  }
  showMessage("observationSuccess", 2000);
  studentData.points.cognitive += 10;
  document.getElementById("submitObservationBtn").disabled = true;
}

export function initScienceExperiment() {
  ensureScreenHtmlExists();

  document.getElementById("submitObservationBtn")
    .addEventListener("click", submitObservation);

  document.getElementById("backFromScienceExperimentBtn")
    .addEventListener("click", () => {
      import("../activitiesList.js").then(m => m.renderActivities());
      document.getElementById("activityScreen").classList.add("active");
    });
}

const screenHtml = `
<div id="${screenId}" class="screen">
  <h1 data-i18n="scienceExperimentTitle"></h1>
  <div class="science-container">
    <p data-i18n="scienceExperimentName"></p>
    <p data-i18n="scienceExperimentDesc"></p>
    <textarea id="observationTextarea" rows="6" placeholder=""></textarea>
    <button id="submitObservationBtn" data-i18n="submitObservationBtn"></button>
  </div>
  <button id="backFromScienceExperimentBtn" data-i18n="backToActivitiesBtn"></button>
</div>
`;

registerGame({
  id: "science-experiment",
  icon: "🔬",
  titleKey: "scienceExperimentTitle",
  descriptionKey: "scienceExperimentName",
  screenId,
  screenHtml,
  render: renderScienceExperiment,
  init: initScienceExperiment
});
