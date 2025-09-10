// js/main.js
import { setLanguage } from "./i18n.js";
import { navigateTo } from "./router.js";
import { renderLoginScreen } from "./screens/loginScreen.js";

function normalizeLang(l = "en") {
  const v = String(l).toLowerCase();
  return v === "ky" ? "kg" : v;
}

document.addEventListener("DOMContentLoaded", async () => {
  const savedLang = normalizeLang(localStorage.getItem("language") || "en");
  setLanguage(savedLang);

  // Click anywhere; if it's a flag, switch
  document.addEventListener("click", (e) => {
    const img = e.target.closest("#languageSwitcher img");
    if (!img) return;
    setLanguage(normalizeLang(img.dataset.lang));
  });

  await renderLoginScreen(document.getElementById("screenContainer"));

  const loadingScreen = document.getElementById("loadingScreen");
  if (loadingScreen) loadingScreen.style.display = "none";
  document.body.classList.remove("overflow-hidden");
});
