// js/steps/renderStep.js

// --- Universal Localizer (we’ll later move this to utils/locale.js) ---
function getUserLang() {
  const lang = (localStorage.getItem("language") || "en").toLowerCase();
  return lang === "ky" ? "kg" : lang;
}

export function resolveLocalized(val, lang = getUserLang()) {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val[lang] ?? val.en ?? Object.values(val)[0] ?? "";
}

// --- Core Step Renderer ---
export async function renderStep(container, stepData) {
  if (!stepData || !stepData.type) {
    container.innerHTML = `<p class="text-red-600">⚠️ Invalid step data.</p>`;
    return;
  }

  const type = stepData.type;
  const normalizedType =
    type.charAt(0).toUpperCase() + type.slice(1); // e.g. "primer" → "Primer"
  const filePath = `./render${normalizedType}.js`;

  try {
    const module = await import(filePath);
    const renderFn = module.default;

    if (typeof renderFn !== "function") {
      throw new Error(`No default export in ${filePath}`);
    }

    // Clear container & run the renderer
    container.innerHTML = "";
    await renderFn(container, stepData);
  } catch (err) {
    console.error(`❌ Failed to load step "${type}" from ${filePath}:`, err);
    container.innerHTML = `
      <div class="text-red-600 bg-red-50 p-3 rounded">
        <p>⚠️ Unable to render step type: <strong>${type}</strong></p>
        <p class="text-sm">Check console for more info.</p>
      </div>`;
  }
}
