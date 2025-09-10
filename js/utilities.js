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


/**
 * Updates the displayed point balances on the dashboard.
 */
export function updateDashboardPoints() {
  document.getElementById("physicalPoints").textContent = studentData.points.physical;
  document.getElementById("cognitivePoints").textContent = studentData.points.cognitive;
  document.getElementById("creativePoints").textContent = studentData.points.creative;
  document.getElementById("socialPoints").textContent = studentData.points.social;

  // Update labels to current language
  document.querySelector(".point-physical .label").textContent = getText("physicalPoints");
  document.querySelector(".point-cognitive .label").textContent = getText("cognitivePoints");
  document.querySelector(".point-creative .label").textContent = getText("creativePoints");
  document.querySelector(".point-social .label").textContent = getText("socialPoints");
}

/**
 * Updates the displayed point balances on the store screen.
 */
export function updateStorePoints() {
  document.getElementById("storePhysicalPoints").textContent = studentData.points.physical;
  document.getElementById("storeCognitivePoints").textContent = studentData.points.cognitive;
  document.getElementById("storeCreativePoints").textContent = studentData.points.creative;
  document.getElementById("storeSocialPoints").textContent = studentData.points.social;
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
