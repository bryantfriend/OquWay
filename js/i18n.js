// js/i18n.js
import { translations } from "./data.js";
import { renderDashboard, initStudentDashboard } from "./studentDashboard.js";
import { renderStore } from "./store.js";

export let currentLang = "en";

// Normalize and alias "ky" -> "kg"
function normalizeLang(l = "en") {
  const v = String(l).toLowerCase();
  return v === "ky" ? "kg" : v;
}

// Safer getter: fallback to 'en', then first available language, then key
export function getText(key, ...args) {
  const lang = currentLang;
  const tLang = translations?.[lang] ?? {};
  let entry = tLang?.[key];

  if (entry === undefined) {
    // fallback to English
    entry = translations?.en?.[key];
  }
  if (entry === undefined) {
    // fallback to first language we have at all
    const firstLang = Object.keys(translations || {}).find(Boolean);
    entry = translations?.[firstLang]?.[key];
  }
  if (entry === undefined) {
    // final fallback: just the key
    entry = key;
  }
  return typeof entry === "function" ? entry(...args) : entry;
}

export function updateTextContent() {
  // 1) Swap all [data-i18n] content and placeholders
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if ((el.tagName === "INPUT" || el.tagName === "TEXTAREA") && el.placeholder !== undefined) {
      el.placeholder = getText(key);
    } else {
      el.textContent = getText(key);
    }
  });

  // 2) Re-render active screen (where needed)
  const activeId = document.querySelector(".screen.active")?.id;
  switch (activeId) {
    case "dashboardScreen":
      renderDashboard();
      initStudentDashboard();
      break;
    case "storeScreen":
      renderStore();
      break;
    case "activityScreen":
      renderActivities?.();
      break;
    default:
      break;
  }
}

export function setLanguage(lang) {
  const normalized = normalizeLang(lang);

  // Even if translations[normalized] is missing/partial, proceed and rely on fallbacks.
  currentLang = normalized;
  try { localStorage.setItem("language", normalized); } catch {}

  // <html lang="…">
  document.documentElement.setAttribute("lang", normalized);

  // highlight selected flag (treat ky as kg)
  document.querySelectorAll("#languageSwitcher img").forEach(img => {
    const imgLang = normalizeLang(img.dataset.lang);
    img.classList.toggle("selected", imgLang === normalized);
  });

  updateTextContent();

  // notify any listeners (e.g., module screen re-render)
  document.dispatchEvent(
    new CustomEvent("oquway:languageChanged", { detail: { lang: normalized } })
  );
}
