// js/steps/renderIntentCheck.js
import { currentLang as i18nLang } from "../i18n.js";

// normalize language (support both "kg" and "ky"; fall back to "en")
function getLang() {
  const fromStorage = localStorage.getItem("language");
  const lang = (fromStorage || i18nLang || "en").toLowerCase();
  if (lang === "ky") return "kg"; // unify to "kg" since your flags use data-lang="kg"
  return lang;
}

// pick text from either a string or { en, ru, kg } object
function pickText(value, lang) {
  if (!value) return "";
  if (typeof value === "string") return value; // legacy format
  if (typeof value === "object") {
    const aliases = lang === "kg" ? ["kg", "ky", "en"] : lang === "ky" ? ["ky", "kg", "en"] : [lang, "en"];
    for (const key of aliases) if (value[key]) return value[key];
  }
  return "";
}

// pick array from either an array or { en:[], ru:[], kg:[] }
function pickArray(value, lang) {
  if (!value) return [];
  if (Array.isArray(value)) return value; // legacy format
  if (typeof value === "object") {
    const aliases = lang === "kg" ? ["kg", "ky", "en"] : lang === "ky" ? ["ky", "kg", "en"] : [lang, "en"];
    for (const key of aliases) if (Array.isArray(value[key])) return value[key];
  }
  return [];
}

export default function render(container, part) {
  const lang = getLang();

  const question = pickText(part.question, lang) || "…";
  const options  = pickArray(part.options, lang);
  const opts = options.length ? options : ["—"];

  const moduleId = localStorage.getItem("activeModuleId") || "";

  container.innerHTML = `
    <div>
      <h3 class="text-lg font-semibold mb-2">${question}</h3>
      <div class="space-y-2">
        ${opts.map((opt, idx) => `
          <button
            class="intent-opt block bg-purple-600 text-white w-full px-3 py-2 rounded"
            data-opt-index="${idx}"
          >${opt}</button>
        `).join('')}
      </div>
      <p id="intentNotice" class="text-sm text-gray-500 mt-3"></p>
    </div>
  `;

  const notice = container.querySelector("#intentNotice");
  container.querySelectorAll(".intent-opt").forEach(btn => {
    btn.addEventListener("click", () => {
      const chosen = btn.textContent.trim();
      try {
        const key = `intentChoice:${moduleId}`;
        localStorage.setItem(key, JSON.stringify({ choice: chosen, ts: Date.now(), lang }));
      } catch {}

      notice.textContent =
        lang === "ru" ? "Сохранено." :
        lang === "kg" ? "Сакталды." :
        "Saved.";

      container.querySelectorAll(".intent-opt").forEach(b =>
        b.classList.remove("ring-2","ring-offset-2","ring-yellow-300")
      );
      btn.classList.add("ring-2","ring-offset-2","ring-yellow-300");
    });
  });
}
