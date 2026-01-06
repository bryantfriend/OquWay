// js/steps/renderAudioLesson.js
import { speak, stopSpeech, speakWithProfile } from "../utils/speech.js";
import { resolveLocalized, getUserLang } from "../utils/locale.js";
import { db } from "../firebase-init.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

export default async function renderAudioLesson(container, part) {
  const lang = getUserLang();
  const title = resolveLocalized(part.title, lang);
  const items = part.items || [];

  const userId = localStorage.getItem("userId");
  const courseId = localStorage.getItem("activeCourseDocId");
  const moduleId = localStorage.getItem("activeModuleId") || "defaultModule";

  const progressRef = userId
    ? doc(db, "userProgress", userId, "modules", moduleId)
    : null;

  let learned = new Set();

  if (progressRef) {
    try {
      const snap = await getDoc(progressRef);
      if (snap.exists()) {
        const data = snap.data();
        learned = new Set(data.learnedWords || []);
      }
    } catch (err) {
      console.warn("⚠️ Could not load progress:", err);
    }
  }

  container.innerHTML = `
    <div class="p-4 max-w-2xl mx-auto">
      <h3 class="text-xl font-bold text-center mb-4 text-gray-800">${title}</h3>

      <div class="flex justify-center gap-3 mb-4">
        <button id="playAllBtn" class="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition">▶️ Play All</button>
        <button id="stopBtn" class="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition">⏹ Stop</button>
        <button id="shuffleBtn" class="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition">🔀 Random</button>
      </div>

      <ul id="audio-list" class="space-y-3">
        ${items
          .map((item) => {
            const word = resolveLocalized(item.word, "en");
            const translation = resolveLocalized(item.translation, lang);
            const learnedClass = learned.has(word)
              ? "bg-green-100"
              : "bg-gray-100";
            return `
              <li class="audio-item flex items-center justify-between gap-3 p-3 rounded-lg ${learnedClass} hover:bg-blue-50 transition cursor-pointer"
                  data-text="${word}" data-lang="en">
                <div>
                  <p class="font-semibold text-lg">${word}</p>
                  <p class="text-gray-600 text-sm">${translation}</p>
                </div>
                <button class="speak-btn text-blue-600 hover:text-blue-800" title="Play word">🔊</button>
              </li>
            `;
          })
          .join("")}
      </ul>

      <div id="progressBar" class="w-full bg-gray-200 rounded-full h-2 mt-6 overflow-hidden hidden">
        <div class="h-full bg-blue-500 transition-all duration-300" style="width: 0%"></div>
      </div>

      <p id="rewardMsg" class="text-center text-green-700 font-semibold mt-4 hidden"></p>
    </div>
  `;

  const audioList = container.querySelector("#audio-list");
  const playAllBtn = container.querySelector("#playAllBtn");
  const stopBtn = container.querySelector("#stopBtn");
  const shuffleBtn = container.querySelector("#shuffleBtn");
  const progressBar = container.querySelector("#progressBar");
  const progressFill = progressBar.querySelector("div");
  const rewardMsg = container.querySelector("#rewardMsg");
  const itemsEls = audioList.querySelectorAll(".audio-item");

  const resetStyles = () => {
    itemsEls.forEach((li) =>
      li.classList.remove("bg-blue-100", "ring-2", "ring-blue-400", "scale-[1.02]")
    );
  };

  const markLearned = async (word) => {
    learned.add(word);
    if (progressRef) {
      try {
        await updateDoc(progressRef, {
          learnedWords: Array.from(learned),
        });
      } catch {
        await setDoc(progressRef, { learnedWords: Array.from(learned) }, { merge: true });
      }
    }
    await awardIntentionPoints({ cognitive: 1 }); // +1 🧠 per word
  };

  const awardIntentionPoints = async (points) => {
    if (!userId) return;
    try {
      const userRef = doc(db, "users", userId);
      const updateData = {};
      if (points.cognitive) updateData["points.cognitive"] = increment(points.cognitive);
      if (points.creative) updateData["points.creative"] = increment(points.creative);
      if (points.social) updateData["points.social"] = increment(points.social);
      if (points.physical) updateData["points.physical"] = increment(points.physical);
      await updateDoc(userRef, updateData);

      // Small UI feedback
      const label = Object.keys(points)
        .map((k) => `${getEmoji(k)} +${points[k]}`)
        .join("  ");
      rewardMsg.textContent = label;
      rewardMsg.classList.remove("hidden");
      showConfetti();
      setTimeout(() => rewardMsg.classList.add("hidden"), 3000);
    } catch (err) {
      console.warn("Could not update intention points:", err);
    }
  };

  const getEmoji = (type) => {
    const map = {
      physical: "💪",
      cognitive: "🧠",
      creative: "🎨",
      social: "🤝",
    };
    return map[type] || "✨";
  };

  const showConfetti = () => {
    const confetti = document.createElement("div");
    confetti.className = "fixed inset-0 pointer-events-none overflow-hidden z-50";
    confetti.innerHTML = `<div class="absolute inset-0 animate-fall bg-[radial-gradient(circle,_#60a5fa_20%,_transparent_20%)] bg-[length:20px_20px] opacity-60"></div>`;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 1500);
  };

  const playWord = (li) => {
    resetStyles();
    li.classList.add("bg-blue-100", "ring-2", "ring-blue-400", "scale-[1.02]");
    const text = li.dataset.text;
    const lang = li.dataset.lang;
    const utterance = speak(text, lang);
    if (utterance) {
      utterance.onend = async () => {
        li.classList.remove("bg-blue-100", "ring-2");
        li.classList.add("bg-green-100");
        await markLearned(text);
      };
    }
  };

  // Click single item
  audioList.addEventListener("click", (e) => {
    const li = e.target.closest(".audio-item");
    if (!li) return;
    playWord(li);
  });

  // Stop
  stopBtn.addEventListener("click", () => {
    stopSpeech();
    resetStyles();
    progressBar.classList.add("hidden");
  });

  // Play All
  playAllBtn.addEventListener("click", () => {
    let index = 0;
    const total = itemsEls.length;
    if (total === 0) return;

    progressBar.classList.remove("hidden");
    progressFill.style.width = "0%";

    async function next() {
      if (index >= total) {
        resetStyles();
        progressFill.style.width = "100%";
        progressBar.classList.add("hidden");
        await awardIntentionPoints({ creative: 2 }); // 🎨 bonus for completing all
        return;
      }

      resetStyles();
      const li = itemsEls[index];
      li.scrollIntoView({ behavior: "smooth", block: "center" });
      li.classList.add("bg-blue-100", "ring-2", "ring-blue-400");
      const utterance = speak(li.dataset.text, li.dataset.lang);

      progressFill.style.width = `${((index + 1) / total) * 100}%`;

      if (utterance) {
        utterance.onend = async () => {
          li.classList.remove("bg-blue-100", "ring-2");
          li.classList.add("bg-green-100");
          await markLearned(li.dataset.text);
          index++;
          next();
        };
      } else {
        index++;
        next();
      }
    }
    next();
  });

  // Random
  shuffleBtn.addEventListener("click", () => {
    const randomIndex = Math.floor(Math.random() * itemsEls.length);
    const li = itemsEls[randomIndex];
    playWord(li);
    li.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}
