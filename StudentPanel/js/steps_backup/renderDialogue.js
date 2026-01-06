// js/steps/renderDialogue.js
import { speak, stopSpeech, speakWithProfile } from "../utils/speech.js";
import { resolveLocalized, getUserLang } from "../utils/locale.js";
import { db } from "../firebase-init.js";
import {
  doc,
  updateDoc,
  increment,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

export default function renderDialogue(container, part) {
  const lang = getUserLang();
  const title = resolveLocalized(part.title, lang);
  const lines = part.lines || [];

  if (lines.length === 0) {
    container.innerHTML = `<p class="text-center text-red-500">⚠️ No dialogue lines found.</p>`;
    return;
  }

  container.innerHTML = `
    <div class="p-4 max-w-2xl mx-auto">
      <h2 class="text-xl font-bold text-center text-gray-800 mb-4 p-3 bg-gray-100 rounded-lg">${title}</h2>

      <div id="dialogue-container" class="space-y-3 overflow-y-auto max-h-[65vh]"></div>

      <div class="flex justify-center gap-3 mt-4">
        <button id="autoPlayBtn" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">▶️ Auto Play</button>
        <button id="stopBtn" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">⏹ Stop</button>
      </div>

      <p id="rewardMsg" class="text-center text-green-700 font-semibold mt-3 hidden"></p>
    </div>
  `;

  const dialogueContainer = container.querySelector("#dialogue-container");
  const autoPlayBtn = container.querySelector("#autoPlayBtn");
  const stopBtn = container.querySelector("#stopBtn");
  const rewardMsg = container.querySelector("#rewardMsg");

  const userId = localStorage.getItem("userId");

  // --- Firestore helper for Intention Points ---
  async function awardIntentionPoints(points) {
    if (!userId) return;
    const userRef = doc(db, "users", userId);
    const updateData = {};
    if (points.cognitive) updateData["points.cognitive"] = increment(points.cognitive);
    if (points.creative) updateData["points.creative"] = increment(points.creative);
    await updateDoc(userRef, updateData);

    const label = Object.keys(points)
      .map((k) => `${getEmoji(k)} +${points[k]}`)
      .join("  ");
    rewardMsg.textContent = label;
    rewardMsg.classList.remove("hidden");
    showConfetti();
    setTimeout(() => rewardMsg.classList.add("hidden"), 2500);
  }

  const getEmoji = (type) => {
    const map = { cognitive: "🧠", creative: "🎨" };
    return map[type] || "✨";
  };

  const showConfetti = () => {
    const confetti = document.createElement("div");
    confetti.className = "fixed inset-0 pointer-events-none overflow-hidden z-50";
    confetti.innerHTML = `<div class="absolute inset-0 animate-fall bg-[radial-gradient(circle,_#38bdf8_20%,_transparent_20%)] bg-[length:20px_20px] opacity-70"></div>`;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 1000);
  };

  // --- Dialogue rendering ---
  const createLineHtml = (line, index) => {
    const text = resolveLocalized(line.text, lang);
    const role = resolveLocalized(line.role, lang).toLowerCase();
    const isGuest = role === "guest";

    const bubbleAlign = isGuest ? "justify-end" : "justify-start";
    const bubbleColor = isGuest ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800";
    const bubbleCorner = isGuest ? "rounded-br-none" : "rounded-bl-none";
    const speakerName = isGuest ? "You" : role.charAt(0).toUpperCase() + role.slice(1);

    return `
      <div class="flex ${bubbleAlign} mb-2 opacity-0 translate-y-4 transition-all duration-500 dialogue-line" data-index="${index}">
        <div class="max-w-md w-full">
          <p class="text-sm font-semibold mb-1 ${isGuest ? "text-right" : "text-left"}">${speakerName}</p>
          <div class="${bubbleColor} ${bubbleCorner} rounded-xl p-3 shadow-md flex items-center justify-between">
            <p class="mr-2">${text}</p>
            <button class="speak-btn w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/40 transition" data-text="${text}">
              🔊
            </button>
          </div>
        </div>
      </div>
    `;
  };

  // Render all lines but keep them initially hidden
  dialogueContainer.innerHTML = lines.map((line, i) => createLineHtml(line, i)).join("");

  const lineElements = Array.from(dialogueContainer.querySelectorAll(".dialogue-line"));
  const speakBtns = container.querySelectorAll(".speak-btn");

  // --- Manual playback ---
  speakBtns.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const text = e.currentTarget.dataset.text;
      if (!text) return;
      highlightButton(btn, true);
      const utter = speak(text, getUserLang());
      if (utter) {
        utter.onend = async () => {
          highlightButton(btn, false);
          await awardIntentionPoints({ cognitive: 1 });
        };
      }
    });
  });

  function highlightButton(btn, active) {
    if (active) btn.classList.add("ring-2", "ring-yellow-400", "scale-110");
    else btn.classList.remove("ring-2", "ring-yellow-400", "scale-110");
  }

  // --- Auto Play Functionality ---
  autoPlayBtn.addEventListener("click", async () => {
    stopSpeech();
    let index = 0;

    async function playNext() {
      if (index >= lines.length) {
        await awardIntentionPoints({ creative: 2 }); // Bonus for full playback
        return;
      }

      const current = lineElements[index];
      current.classList.remove("opacity-0", "translate-y-4");
      current.scrollIntoView({ behavior: "smooth", block: "center" });

      const text = resolveLocalized(lines[index].text, lang);
      const btn = current.querySelector(".speak-btn");
      highlightButton(btn, true);

      const utter = speak(text, getUserLang());
      if (utter) {
        utter.onend = async () => {
          highlightButton(btn, false);
          await awardIntentionPoints({ cognitive: 1 });
          index++;
          playNext();
        };
        utter.onerror = () => {
          highlightButton(btn, false);
          index++;
          playNext();
        };
      } else {
        index++;
        playNext();
      }
    }

    playNext();
  });

  stopBtn.addEventListener("click", () => {
    stopSpeech();
    lineElements.forEach((el) => el.classList.remove("opacity-0", "translate-y-4"));
  });
}
