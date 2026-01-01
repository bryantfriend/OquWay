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
const fullscreenBtn = document.getElementById("fullscreenBtn");

function toggleFullscreen() {
  const elem = document.documentElement;

  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen(); // iOS / Safari
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}
let kioskEnabled = false;

function enableKioskMode() {
  kioskEnabled = true;

  // Disable right-click
  document.addEventListener("contextmenu", preventDefault, true);

  // Disable key combos
  document.addEventListener("keydown", blockKeys, true);

  // Lock scrolling bounce
  document.body.style.overflow = "hidden";

  // Force fullscreen if possible
  document.documentElement.requestFullscreen?.();

  localStorage.setItem("kiosk", "on");
}

function disableKioskMode() {
  kioskEnabled = false;

  document.removeEventListener("contextmenu", preventDefault, true);
  document.removeEventListener("keydown", blockKeys, true);

  document.body.style.overflow = "";

  localStorage.removeItem("kiosk");
}

function preventDefault(e) {
  e.preventDefault();
}

function blockKeys(e) {
  const blocked = ["Escape", "Tab", "Meta", "Alt", "Control", "F5"];
  if (blocked.includes(e.key)) {
    e.preventDefault();
  }
}

document.getElementById("kioskBtn").addEventListener("click", () => {
  kioskEnabled ? disableKioskMode() : enableKioskMode();
});

if (localStorage.getItem("kiosk") === "on") {
  enableKioskMode();
}
let tapCount = 0;
let tapTimer;

document.querySelector(".container").addEventListener("click", () => {
  tapCount++;
  clearTimeout(tapTimer);

  tapTimer = setTimeout(() => (tapCount = 0), 800);

  if (tapCount === 5) {
    const code = prompt("Teacher code:");
    if (code === "4321") {
      disableKioskMode();
    }
    tapCount = 0;
  }
});


fullscreenBtn.addEventListener("click", toggleFullscreen);

