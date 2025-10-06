// js/main.js
// 🌟 Central entry point for OquWay (modular version)

import { setLanguage } from "./i18n.js";
import { navigateTo } from "./router.js";
import { renderLoginScreen } from "./screens/loginScreen.js";
import "./config.js";
import "./data.js";
import "./utilities.js";

// ✅ Import initialized Firebase objects (already created in firebase-init.js)
import { app, auth, db, storage } from "./firebase-init.js";

import {
  onAuthStateChanged,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

function normalizeLang(l = "en") {
  const v = String(l).toLowerCase();
  return v === "ky" ? "kg" : v;
}

document.addEventListener("DOMContentLoaded", async () => {
  // 🌐 Language setup
  const savedLang = normalizeLang(localStorage.getItem("language") || "en");
  setLanguage(savedLang);

  document.addEventListener("click", (e) => {
    const img = e.target.closest("#languageSwitcher img");
    if (!img) return;
    setLanguage(normalizeLang(img.dataset.lang));
  });

  // 🔒 Authentication flow
  onAuthStateChanged(auth, async (user) => {
    try {
      if (!user) {
        await signInAnonymously(auth);
        return; // will trigger again once signed in
      }

      // ✅ Authenticated (anonymous or real)
      await renderLoginScreen(document.getElementById("screenContainer"));
    } catch (err) {
      console.error("Auth error:", err);
    } finally {
      const loadingScreen = document.getElementById("loadingScreen");
      if (loadingScreen) loadingScreen.style.display = "none";
      document.body.classList.remove("overflow-hidden");
    }
  });
});
