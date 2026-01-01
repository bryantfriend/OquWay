// js/utils/locale.js

/**
 * Gets the user’s current language preference.
 * Stored in localStorage under "language", defaulting to English.
 * Normalizes 'ky' → 'kg' to match your internal convention.
 * @returns {string} - language code (e.g., 'en', 'ru', 'kg')
 */
export function getUserLang() {
  const stored = (localStorage.getItem("language") || "en").toLowerCase();
  return stored === "ky" ? "kg" : stored;
}

/**
 * Resolves a localized field (object or string) into a final display string.
 * @param {Object|string} val - The localized value ({ en: "", ru: "", kg: "" }) or plain string.
 * @param {string} [lang=getUserLang()] - Preferred language.
 * @returns {string} - The localized string, or a fallback.
 */
export function resolveLocalized(val, lang = getUserLang()) {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val[lang] ?? val.en ?? Object.values(val)[0] ?? "";
}

/**
 * Sets the user’s preferred language and saves it to localStorage.
 * Automatically reloads the page (optional).
 * @param {string} lang - e.g. 'en', 'ru', 'kg'
 * @param {boolean} [reload=false]
 */
export function setUserLang(lang, reload = false) {
  const normalized = lang.toLowerCase() === "ky" ? "kg" : lang.toLowerCase();
  localStorage.setItem("language", normalized);
  if (reload) location.reload();
}

/**
 * Returns a readable label for a given language code.
 * Useful for dropdowns or UI selectors.
 * @param {string} lang - e.g. 'en'
 * @returns {string}
 */
export function getLangLabel(lang) {
  const labels = { en: "English", ru: "Русский", kg: "Кыргызча" };
  return labels[lang] || lang.toUpperCase();
}
