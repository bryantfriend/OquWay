import { speak } from "../utils/speech.js";

function resolveLocalized(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  const lang = (localStorage.getItem("language") || "en").toLowerCase();
  const normalizedLang = lang === "ky" ? "kg" : lang;
  return val[normalizedLang] ?? val.en ?? Object.values(val)[0] ?? "";
}

export default function renderMatchingGame(container, part) {
  // --- Data setup ---
  let rawPairs = part.pairs;
  if (rawPairs && !Array.isArray(rawPairs)) {
    const lang = (localStorage.getItem("language") || "en").toLowerCase();
    const normalizedLang = lang === "ky" ? "kg" : lang;
    rawPairs = rawPairs[normalizedLang] ?? rawPairs.en ?? Object.values(rawPairs)[0] ?? [];
  }

  const pairs = (rawPairs || [])
    .map(p => ({ id: crypto.randomUUID(), left: resolveLocalized(p.word), right: resolveLocalized(p.match) }))
    .filter(p => p.left && p.right);

  if (!pairs.length) {
    container.innerHTML = `<p class="text-red-600">⚠️ No valid pairs found.</p>`;
    return;
  }

  // Shuffle helper
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Layout
  container.innerHTML = `
    <div class="max-w-3xl mx-auto p-6 bg-white/90 rounded-xl shadow-xl backdrop-blur-sm relative">
      <h2 class="text-3xl font-bold text-center text-gray-800 mb-1">🧩 Match the Pairs</h2>
      <p class="text-center text-gray-600 mb-6">Drag each word to its matching meaning.</p>

      <!-- Progress Bar -->
      <div class="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
        <div id="progressFill" class="bg-green-500 h-3 w-0 transition-all duration-500"></div>
      </div>

      <!-- Stars -->
      <div id="stars" class="flex justify-center mb-6 text-2xl text-yellow-400">
        ⭐ ⭐ ⭐
      </div>

      <div id="messageBox" class="h-6 text-center text-lg font-semibold mb-4 transition-all"></div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
        <div>
          <h3 class="text-xl font-semibold text-gray-700 mb-4 text-center">Words</h3>
          <div id="leftCol" class="space-y-4"></div>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-700 mb-4 text-center">Meanings</h3>
          <div id="rightCol" class="space-y-4"></div>
        </div>
      </div>

      <div id="completionMsg" class="hidden text-center mt-8 p-6 bg-green-100 border-2 border-green-500 rounded-lg animate-fade-in">
        <h4 class="text-2xl font-bold text-green-800 mb-2">🎉 Excellent!</h4>
        <p class="text-green-700 mb-4">You matched them all!</p>
        <button id="replayBtn" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">🔁 Play Again</button>
      </div>

      <style>
        .dragging { opacity: 0.6; transform: scale(1.05) rotate(3deg); box-shadow: 0 8px 16px rgba(0,0,0,0.2); cursor: grabbing !important; }
        .drag-over { border-color: #3b82f6 !important; background-color: #dbeafe !important; transform: scale(1.03); }
        .matched { opacity: 0.6; cursor: not-allowed; background-color: #f0fdf4; border: 2px solid #22c55e; animation: snap 0.4s ease-in-out; }
        .correct { border-color: #22c55e !important; background-color: #dcfce7 !important; animation: snap 0.4s ease-in-out; }
        @keyframes snap {
          0% { transform: scale(0.9); }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      </style>
    </div>
  `;

  const leftCol = container.querySelector("#leftCol");
  const rightCol = container.querySelector("#rightCol");
  const messageBox = container.querySelector("#messageBox");
  const completionMsg = container.querySelector("#completionMsg");
  const progressFill = container.querySelector("#progressFill");
  const stars = container.querySelector("#stars");

  let matched = 0;
  let draggedItem = null;
  let currentDropZone = null;
  let mistakes = 0;
  const startTime = Date.now();

  // --- Sound feedback ---
  const successSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.wav");
  const failSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.wav");

  function showMessage(msg, type) {
    messageBox.textContent = msg;
    messageBox.classList.remove("text-green-600", "text-red-600", "text-blue-600");
    if (type === "green") messageBox.classList.add("text-green-600");
    else if (type === "red") messageBox.classList.add("text-red-600");
    else if (type === "blue") messageBox.classList.add("text-blue-600");
    setTimeout(() => { if (messageBox.textContent === msg) messageBox.textContent = ""; }, 2000);
  }

  function updateProgress() {
    const percent = (matched / pairs.length) * 100;
    progressFill.style.width = `${percent}%`;
  }

  function updateStars() {
    const timeTaken = (Date.now() - startTime) / 1000;
    const starEl = stars;
    let filled = 3;

    if (mistakes >= pairs.length * 0.5) filled--;
    if (timeTaken > pairs.length * 7) filled--;

    starEl.innerHTML = Array.from({ length: 3 }, (_, i) =>
      `<span style="opacity:${i < filled ? 1 : 0.3}">⭐</span>`
    ).join("");
  }

  // --- Match logic ---
  function processMatch(item, zone) {
    const itemId = item.dataset.id;
    const zoneId = zone.dataset.id;

    if (itemId === zoneId) {
      item.draggable = false;
      item.classList.add("matched");
      zone.classList.add("correct");
      item.innerHTML = `✅ ${item.innerHTML}`;
      matched++;
      updateProgress();
      successSound.play().catch(() => {});
      showMessage("Correct!", "green");
      updateStars();

      if (matched === pairs.length) {
        showMessage("Perfect!", "blue");
        completionMsg.classList.remove("hidden");
        completionMsg.querySelector("#replayBtn").addEventListener("click", () => renderMatchingGame(container, part));
      }
    } else {
      mistakes++;
      zone.classList.add("drag-over");
      failSound.play().catch(() => {});
      setTimeout(() => zone.classList.remove("drag-over"), 500);
      showMessage("Not a match! Try again.", "red");
      updateStars();
    }
  }

  // --- Desktop handlers ---
  function handleDragStart(e) {
    draggedItem = this;
    e.dataTransfer.setData("text/plain", this.dataset.id);
    setTimeout(() => this.classList.add("dragging"), 0);
    speak(this.textContent, "en");
  }
  function handleDragEnd() { this.classList.remove("dragging"); draggedItem = null; }
  function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }
  function handleDragEnter(e) { e.preventDefault(); this.classList.add("drag-over"); }
  function handleDragLeave() { this.classList.remove("drag-over"); }
  function handleDrop(e) {
    e.preventDefault();
    this.classList.remove("drag-over");
    if (draggedItem) processMatch(draggedItem, this);
  }

  // --- Touch handlers ---
  function handleTouchStart(e) {
    if (this.draggable) {
      e.preventDefault();
      draggedItem = this;
      this.classList.add("dragging");
      speak(this.textContent, "en");
    }
  }
  function handleTouchMove(e) {
    if (!draggedItem) return;
    e.preventDefault();
    const touch = e.touches[0];
    const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = elementUnder ? elementUnder.closest(".drop-zone") : null;
    if (currentDropZone && currentDropZone !== dropZone) currentDropZone.classList.remove("drag-over");
    if (dropZone) dropZone.classList.add("drag-over");
    currentDropZone = dropZone;
  }
  function handleTouchEnd() {
    if (!draggedItem) return;
    draggedItem.classList.remove("dragging");
    if (currentDropZone) {
      currentDropZone.classList.remove("drag-over");
      processMatch(draggedItem, currentDropZone);
    }
    draggedItem = null;
    currentDropZone = null;
  }

  // --- Initialize ---
  function initGame() {
    matched = 0;
    mistakes = 0;
    leftCol.innerHTML = "";
    rightCol.innerHTML = "";
    shuffleArray(pairs);
    updateProgress();

    pairs.forEach(p => {
      const el = document.createElement("div");
      el.className = "draggable-item bg-white p-4 rounded-xl shadow-md cursor-grab text-center text-gray-800 font-medium border hover:scale-105 transition-transform";
      el.draggable = true;
      el.dataset.id = p.id;
      el.textContent = p.left;
      el.addEventListener("dragstart", handleDragStart);
      el.addEventListener("dragend", handleDragEnd);
      el.addEventListener("touchstart", handleTouchStart, { passive: false });
      leftCol.appendChild(el);
    });

    const shuffledTargets = [...pairs].sort(() => Math.random() - 0.5);
    shuffledTargets.forEach(p => {
      const zone = document.createElement("div");
      zone.dataset.id = p.id;
      zone.className = "drop-zone flex items-center justify-center p-4 h-16 rounded-xl border-4 border-dashed bg-gray-50 transition-all duration-150";
      zone.textContent = p.right;
      zone.addEventListener("dragover", handleDragOver);
      zone.addEventListener("dragenter", handleDragEnter);
      zone.addEventListener("dragleave", handleDragLeave);
      zone.addEventListener("drop", handleDrop);
      rightCol.appendChild(zone);
    });
  }

  document.addEventListener("touchmove", handleTouchMove, { passive: false });
  document.addEventListener("touchend", handleTouchEnd);

  initGame();
}
