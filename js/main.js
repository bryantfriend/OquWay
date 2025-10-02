// js/main.js
import { setLanguage } from "./i18n.js";
import { navigateTo } from "./router.js";
import { renderLoginScreen } from "./screens/loginScreen.js";

import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { initializeApp } from "firebase/app";

// (if not already initialized somewhere else)
const firebaseConfig = { /* ...your config... */ };
initializeApp(firebaseConfig);

function normalizeLang(l = "en") {
  const v = String(l).toLowerCase();
  return v === "ky" ? "kg" : v;
}

document.addEventListener("DOMContentLoaded", async () => {
  const savedLang = normalizeLang(localStorage.getItem("language") || "en");
  setLanguage(savedLang);

  document.addEventListener("click", (e) => {
    const img = e.target.closest("#languageSwitcher img");
    if (!img) return;
    setLanguage(normalizeLang(img.dataset.lang));
  });

  const auth = getAuth();

  // Wait for auth state. If no user, sign in anonymously, then proceed.
  onAuthStateChanged(auth, async (user) => {
    try {
      if (!user) {
        await signInAnonymously(auth); // creates/stores a persistent anon user
        return; // onAuthStateChanged will fire again with the new user
      }

      // 🔐 We are now authenticated (anonymously).
      // Safe to call screens that use Firestore:
      await renderLoginScreen(document.getElementById("screenContainer"));
    } catch (err) {
      console.error("Auth error:", err);
      // Optionally render a friendly error UI here
    } finally {
      const loadingScreen = document.getElementById("loadingScreen");
      if (loadingScreen) loadingScreen.style.display = "none";
      document.body.classList.remove("overflow-hidden");
    }
  });
});
