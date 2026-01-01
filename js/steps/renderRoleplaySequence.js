// js/steps/renderRoleplaySequence.js
import { speak, stopSpeech, speakWithProfile } from "../utils/speech.js";
import { resolveLocalized, getUserLang } from "../utils/locale.js";
import { db } from "../firebase-init.js";
import {
  doc,
  updateDoc,
  setDoc,
  getDoc,
  increment,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

let currentSceneIndex = 0;
let partData = null;
let sceneContainer = null;
let isChoiceActive = true;
let bgContainer = null;

export default async function renderRoleplaySequence(container, part) {
  partData = part;
  currentSceneIndex = 0;
  const lang = getUserLang();
  const scenario = resolveLocalized(part.scenario, lang);

  // Load user info for rewards
  const userId = localStorage.getItem("userId");
  const moduleId = localStorage.getItem("activeModuleId") || "defaultModule";

  container.innerHTML = `
    <div class="relative p-4 max-w-2xl mx-auto overflow-hidden rounded-xl shadow-lg bg-white/70 backdrop-blur">
      <div id="bg-container" class="absolute inset-0 -z-10 bg-cover bg-center transition-all duration-1000"></div>
      <h3 class="text-lg font-bold mb-3 text-center bg-gray-100 p-2 rounded">${scenario}</h3>

      <div id="progressBarOuter" class="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div id="progressBarInner" class="h-full bg-blue-500 transition-all duration-300" style="width:0%"></div>
      </div>

      <div id="scenes-container" class="space-y-4 overflow-y-auto max-h-[60vh]"></div>

      <p id="rewardMsg" class="text-center text-green-700 font-semibold mt-4 hidden"></p>
    </div>
  `;

  sceneContainer = container.querySelector("#scenes-container");
  bgContainer = container.querySelector("#bg-container");
  const progressBarInner = container.querySelector("#progressBarInner");
  const rewardMsg = container.querySelector("#rewardMsg");
  sceneContainer.addEventListener("click", handleOptionClick);

  renderScene();

  // 🔹 Helper: Firestore reward system
  async function awardIntentionPoints(points) {
    if (!userId) return;
    const userRef = doc(db, "users", userId);
    const updateData = {};
    if (points.cognitive) updateData["points.cognitive"] = increment(points.cognitive);
    if (points.social) updateData["points.social"] = increment(points.social);
    await updateDoc(userRef, updateData);
    showReward(points);
  }

  function showReward(points) {
    const label = Object.keys(points)
      .map((k) => `${getEmoji(k)} +${points[k]}`)
      .join("  ");
    rewardMsg.textContent = label;
    rewardMsg.classList.remove("hidden");
    showConfetti();
    setTimeout(() => rewardMsg.classList.add("hidden"), 2500);
  }

  const getEmoji = (type) => {
    const map = { cognitive: "🧠", social: "🤝" };
    return map[type] || "✨";
  };

  const showConfetti = () => {
    const confetti = document.createElement("div");
    confetti.className = "fixed inset-0 pointer-events-none overflow-hidden z-50";
    confetti.innerHTML = `<div class="absolute inset-0 animate-fall bg-[radial-gradient(circle,_#86efac_20%,_transparent_20%)] bg-[length:20px_20px] opacity-70"></div>`;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 1200);
  };

  // 🔹 Helper: Typewriter effect
  function typeText(element, text, speed = 25, callback) {
    let i = 0;
    element.textContent = "";
    const interval = setInterval(() => {
      element.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        if (callback) callback();
      }
    }, speed);
  }

  // 🔹 Core scene rendering
  function renderScene() {
    if (!partData || !sceneContainer) return;
    const scene = partData.scenes[currentSceneIndex];
    const lang = getUserLang();

    // Update progress bar
    const progress = Math.round((currentSceneIndex / partData.scenes.length) * 100);
    progressBarInner.style.width = `${progress}%`;

    if (!scene) {
      endSequence();
      return;
    }

    // Background
    if (scene.background) {
      bgContainer.style.backgroundImage = `url('/assets/backgrounds/${scene.background}')`;
    }

    let sceneHtml = "";

    // NPC scene
// NPC scene
if (scene.character !== "You") {
  const dialogue = resolveLocalized(scene.dialogue, lang);
  const avatar = scene.avatar
    ? `<img src="${scene.avatar}" class="w-10 h-10 rounded-full mr-2 border border-gray-300">`
    : "";
  const mood = scene.mood ? `<span class="ml-2 text-sm text-gray-500">(${scene.mood})</span>` : "";

  sceneHtml = `
    <div class="mb-4 p-3 bg-gray-100 rounded-lg shadow-sm animate-fade-in">
      <div class="flex items-center mb-1">
        ${avatar}
        <span class="font-bold">${scene.character}</span>
        ${mood}
      </div>
      <p class="dialogue-text text-gray-800"></p>
    </div>
  `;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = sceneHtml;
  const sceneEl = wrapper.firstElementChild;
  const textEl = sceneEl.querySelector(".dialogue-text");
  const avatarImg = sceneEl.querySelector("img");
  sceneContainer.appendChild(sceneEl);
  sceneContainer.scrollTop = sceneContainer.scrollHeight;

  // --- Voice playback with avatar animation ---
  const voiceProfile = scene.voice || "female_en_soft";
  const utter = speakWithProfile(dialogue, voiceProfile, avatarImg);

  // Animate avatar while speaking
  if (utter && avatarImg) {
    avatarImg.classList.add("avatar-talking");
    utter.onend = () => {
      avatarImg.classList.remove("avatar-talking");
      awardIntentionPoints({ cognitive: 1 });
    };
  }

  // Typewriter dialogue text
  typeText(textEl, dialogue, 25);
  currentSceneIndex++;
  setTimeout(renderScene, dialogue.length * 35 + 1000);
} else {
      // Player choices
      const prompt = resolveLocalized(scene.prompt, lang);
      const optionsHtml = scene.options
        .map((opt) => {
          const text = resolveLocalized(opt.text, lang);
          const escaped = JSON.stringify(opt).replace(/'/g, "&apos;");
          return `
            <button class="player-option-btn w-full text-left p-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition mb-2" data-option='${escaped}'>
              ${text}
            </button>`;
        })
        .join("");

      sceneHtml = `
        <div class="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 animate-fade-in">
          <p class="font-semibold text-blue-800 mb-2">${prompt}</p>
          <div>${optionsHtml}</div>
          <div class="feedback-container mt-2 h-8 text-sm font-semibold"></div>
        </div>`;
      sceneContainer.innerHTML += sceneHtml;
      sceneContainer.scrollTop = sceneContainer.scrollHeight;
      isChoiceActive = true;
    }
  }

  // 🔹 Handle player choices
  async function handleOptionClick(e) {
    const btn = e.target.closest(".player-option-btn");
    if (!btn || !isChoiceActive) return;
    isChoiceActive = false;

    const optionData = JSON.parse(btn.dataset.option);
    const lang = getUserLang();
    const parent = btn.parentElement;
    const feedbackContainer = parent.nextElementSibling;

    parent.querySelectorAll(".player-option-btn").forEach((b) => {
      b.disabled = true;
      b.classList.add("opacity-60");
    });

    if (optionData.isCorrect) {
      btn.classList.remove("border-gray-300", "opacity-60");
      btn.classList.add("bg-green-100", "border-green-500", "ring-2", "ring-green-400");
      awardIntentionPoints({ cognitive: 1, social: 1 });

      // Optional correct sound
      const correctSound = new Audio("/sounds/correct.mp3");
      correctSound.play();

      currentSceneIndex++;
      setTimeout(renderScene, 900);
    } else {
      btn.classList.remove("border-gray-300", "opacity-60");
      btn.classList.add("bg-red-100", "border-red-500", "shake");
      const feedback = resolveLocalized(optionData.feedback, lang);
      if (feedback && feedbackContainer) {
        feedbackContainer.innerHTML = `<p class="text-red-600">${feedback}</p>`;
      }

      // Optional wrong sound
      const wrongSound = new Audio("/sounds/wrong.mp3");
      wrongSound.play();

      setTimeout(() => {
        btn.classList.remove("bg-red-100", "border-red-500", "shake");
        parent.querySelectorAll(".player-option-btn").forEach((b) => {
          b.disabled = false;
          b.classList.remove("opacity-60");
        });
        if (feedbackContainer) feedbackContainer.innerHTML = "";
        isChoiceActive = true;
      }, 2000);
    }
  }

  // 🔹 End sequence
  function endSequence() {
    sceneContainer.innerHTML += `
      <div class="text-center p-4 bg-green-100 border border-green-400 rounded-lg animate-fade-in">
        <h3 class="text-xl font-bold text-green-800 mb-2">🎉 Roleplay Complete!</h3>
        <p class="text-gray-700">Excellent communication! You've earned 🤝 +2 Social Points.</p>
        <button class="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onclick="location.reload()">🔁 Replay</button>
      </div>
    `;
    awardIntentionPoints({ social: 2 });
  }
}
