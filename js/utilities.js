// js/utilities.js

import { getText } from "./i18n.js";
import { studentData } from "./config.js";  // ← import global state

/**
 * Displays a temporary message to the user.
 */
export function showMessage(key, duration = 3000, ...args) {
  const box = document.getElementById("messageBox");
  box.textContent = getText(key, ...args);
  box.classList.add("active");
  setTimeout(() => box.classList.remove("active"), duration);
}
function safeSetText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}


/**
 * Updates the displayed point balances on the dashboard.
 */
export function updateDashboardPoints() {
  safeSetText("physicalPoints",  studentData.points?.physical ?? 0);
  safeSetText("cognitivePoints", studentData.points?.cognitive ?? 0);
  safeSetText("creativePoints",  studentData.points?.creative ?? 0);
  safeSetText("socialPoints",    studentData.points?.social ?? 0);
}

/**
 * Updates the displayed point balances on the store screen.
 */
export function updateStorePoints() {
  safeSetText("storePhysicalPoints",  studentData.points?.physical ?? 0);
  safeSetText("storeCognitivePoints", studentData.points?.cognitive ?? 0);
  safeSetText("storeCreativePoints",  studentData.points?.creative ?? 0);
  safeSetText("storeSocialPoints",    studentData.points?.social ?? 0);
}

/**
 * Checks if the student has enough points to buy an item.
 */
export function canAfford(cost) {
  return Object.entries(cost).every(([type, amt]) => studentData.points[type] >= amt);
}

/**
 * Deducts points from studentData based on item cost.
 */
export function deductPoints(cost) {
  Object.entries(cost).forEach(([type, amt]) => {
    studentData.points[type] -= amt;
  });
}
export function showGlobalLoader(message = 'Loading...') {
  const overlay = document.getElementById('global-loading-overlay');
  const textEl = document.getElementById('loading-text');
  textEl.textContent = message;
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });
}

export function hideGlobalLoader(delay = 300) {
  const overlay = document.getElementById('global-loading-overlay');
  overlay.classList.remove('active');
  setTimeout(() => {
    overlay.classList.add('hidden');
  }, delay);
}

// js/utils.js
export function formatLocationType(type) {
  return type.replace(/([A-Z])/g, ' $1').toLowerCase();
}
