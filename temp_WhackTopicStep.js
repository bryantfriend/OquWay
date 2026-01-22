const BaseStep = window.CourseEngine.BaseStep;

export default class WhackTopicStep extends BaseStep {

  /* ======================================================
     1. METADATA
  ====================================================== */

  static get id() { return 'whackTopic'; }
  static get version() { return '2.0.0'; }
  static get displayName() { return 'Whack the Topic'; }
  static get description() { return 'Learn a topic, then whack the correct items.'; }
  static get category() { return 'game'; }
  static get tags() { return ['game', 'vocabulary', 'reaction', 'classification']; }

  /* ======================================================
     2. VALIDATION
  ====================================================== */

  static validateConfig(config = {}) {
    const errors = [];
    if (config.topics && !Array.isArray(config.topics)) {
      errors.push({ field: 'topics', message: 'Topics must be a list' });
    }
    return { valid: errors.length === 0, errors };
  }

  /* ======================================================
     3. DEFAULT CONFIG
  ====================================================== */

  static get defaultConfig() {
    return {
      timeLimit: 30,
      apiKey: '', // For Google TTS
      topics: [
        {
          title: { en: 'Mammals' },
          description: {
            en: 'Mammals are warm-blooded animals that have hair or fur and feed their babies with milk.'
          },
          correct: ['Whale', 'Bat', 'Human', 'Elephant', 'Lion', 'Kangaroo'],
          wrong: ['Snake', 'Frog', 'Eagle', 'Lizard', 'Shark', 'Ant']
        }
      ]
    };
  }

  /* ======================================================
     4. EDITOR SCHEMA
  ====================================================== */

  static editorSchema = {
    groups: [
      {
        id: 'settings',
        label: 'Game Settings',
        fields: [
          {
            key: 'timeLimit',
            label: 'Time Limit (seconds)',
            type: 'number',
            min: 10,
            max: 120,
            step: 5,
            default: 30
          },
          {
            key: 'apiKey',
            label: 'Google API Key (Optional for High Quality Voice)',
            type: 'text',
            default: ''
          }
        ]
      },
      {
        id: 'topics',
        label: 'Topics',
        fields: [
          {
            key: 'topics',
            label: 'Topic List',
            type: 'list',
            default: [],
            itemSchema: {
              type: 'object',
              fields: [
                { key: 'title', label: 'Title', type: 'localizedText', required: true, default: { en: '' } },
                { key: 'description', label: 'Description', type: 'localizedText', default: { en: '' } },
                { key: 'correct', label: 'Correct Items', type: 'list', default: [], itemSchema: { type: 'text' } },
                { key: 'wrong', label: 'Wrong Items', type: 'list', default: [], itemSchema: { type: 'text' } }
              ]
            }
          }
        ]
      }
    ]
  };

  /* ======================================================
     5. RENDER
  ====================================================== */

  static render({ container, config = {}, context, onComplete }) {
    // 1. Completion Guard
    const complete = this.createCompletionGuard
      ? this.createCompletionGuard(onComplete)
      : (onComplete || (() => { }));

    const isEditing = context?.mode === 'editor' || context?.mode === 'preview';
    const lang = context?.language || 'en';

    /* ---------- EDITOR PREVIEW ---------- */
    if (isEditing) {
      container.innerHTML = `
        <div class="p-6 bg-white border-2 border-dashed rounded-xl text-center text-gray-400">
          <div class="text-4xl mb-2">🔨</div>
          <div class="font-bold">Whack the Topic</div>
          <div class="text-xs mt-1">Full game runs in student mode</div>
        </div>
      `;
      return;
    }

    /* ======================================================
       PLAYER MODE (Ported from Prototype)
    ====================================================== */

    const topics = config.topics || [];
    const timeLimit = Number(config.timeLimit) || 30;
    const apiKey = config.apiKey || '';

    // Pick random topic
    const topic = topics.length > 0
      ? topics[Math.floor(Math.random() * topics.length)]
      : { title: {}, description: {}, correct: [], wrong: [] };

    // Game State
    let score = 0;
    let timeLeft = timeLimit;
    let gameActive = false;
    let gameTimer = null;
    let spawnTimer = null;
    let currentAudio = null;

    /* ---------- HTML Structure ---------- */
    // Using inline styles/classes from prototype + Tailwind (assuming Tailwind is available in env)
    container.innerHTML = `
      <style>
        ${this.prototypeStyles()}
      </style>

      <div class="whack-game-container flex flex-col items-center p-2 w-full h-full relative">

        <!-- Header / Stats -->
        <div class="w-full max-w-2xl flex justify-between items-center mb-4 bg-white p-4 rounded-2xl shadow-sm border-b-4 border-green-200 z-30">
          <div class="text-center">
            <p class="text-xs uppercase font-bold text-gray-400">Score</p>
            <p id="score" class="text-3xl game-font text-green-600">0</p>
          </div>
          <div class="text-center bg-green-50 px-4 py-2 rounded-xl border-2 border-green-200">
            <p class="text-xs uppercase font-bold text-gray-500">Topic:</p>
            <p id="topic-display" class="text-lg md:text-xl game-font text-green-800 leading-tight">
              ${topic.title?.[lang] || topic.title?.en || '---'}
            </p>
          </div>
          <div class="text-center">
            <p class="text-xs uppercase font-bold text-gray-400">Time</p>
            <p id="timer" class="text-3xl game-font text-orange-500">${timeLeft}</p>
          </div>
        </div>

        <!-- Game Board -->
        <div id="board" class="grid-layout mt-2 relative"></div>

        <!-- Start Screen -->
        <div id="start-screen" class="absolute inset-0 bg-green-600 flex items-center justify-center z-[40] rounded-xl p-6 text-center">
          <div class="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full">
            <h1 class="text-4xl game-font text-green-600 mb-4">Topic Whack!</h1>
            <p class="text-gray-600 mb-6 font-medium">Test your knowledge! Learn the topic, then whack the right moles.</p>
            <button id="play-btn" class="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl text-xl game-font transition-all transform hover:scale-105 shadow-lg">
              PLAY GAME
            </button>
          </div>
        </div>

        <!-- Intro Modal (Paragraph + TTS) -->
        <div id="intro-modal" class="absolute inset-0 bg-black/70 hidden items-center justify-center z-[50] rounded-xl p-6">
          <div class="bg-white p-6 md:p-8 rounded-3xl shadow-2xl max-w-lg w-full text-center relative">
            <div id="tts-status" class="mb-4 text-sm font-bold text-blue-500 uppercase tracking-widest hidden">
              <span class="loader"></span> Reading aloud...
            </div>
            
            <h2 id="modal-topic-title" class="text-2xl md:text-3xl game-font text-green-600 mb-4">
              ${topic.title?.[lang] || topic.title?.en}
            </h2>
            
            <div class="bg-green-50 p-4 md:p-6 rounded-2xl border-2 border-green-100 mb-6 max-h-[40vh] overflow-y-auto">
              <p id="modal-topic-desc" class="text-gray-700 leading-relaxed text-lg">
                ${topic.description?.[lang] || topic.description?.en || ''}
              </p>
            </div>
            
            <button id="start-whacking-btn" class="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xl game-font transition-all shadow-lg">
              START WHACKING!
            </button>
          </div>
        </div>

        <!-- Game Over Overlay -->
        <div id="game-over" class="absolute inset-0 bg-black/60 hidden items-center justify-center z-[60] rounded-xl p-6 text-center">
          <div class="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full">
            <h2 class="text-3xl game-font text-gray-800 mb-2">Time's Up!</h2>
            <p class="text-gray-500 mb-4 font-bold">Final Score:</p>
            <p id="final-score" class="text-6xl game-font text-green-600 mb-8">0</p>
            <button id="restart-btn" class="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-xl game-font transition-all shadow-lg">
              PLAY AGAIN
            </button>
          </div>
        </div>

      </div>

      <!-- SVGs -->
      ${this.prototypeSVG()}
    `;

    /* ---------- DOM Elements ---------- */
    const board = container.querySelector('#board');
    const scoreEl = container.querySelector('#score');
    const timerEl = container.querySelector('#timer');
    const startScreen = container.querySelector('#start-screen');
    const introModal = container.querySelector('#intro-modal');
    const gameOverScreen = container.querySelector('#game-over');
    const finalScoreEl = container.querySelector('#final-score');
    const ttsStatus = container.querySelector('#tts-status');
    const playBtn = container.querySelector('#play-btn');
    const startWhackingBtn = container.querySelector('#start-whacking-btn');
    const restartBtn = container.querySelector('#restart-btn');

    /* ---------- Audio Helpers ---------- */

    // Wave header generator for PCM data from Gemini
    function pcmToWav(base64Data, sampleRate) {
      const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer;
      const length = buffer.byteLength;
      const wavHeader = new ArrayBuffer(44);
      const view = new DataView(wavHeader);
      view.setUint32(0, 0x52494646, false); // RIFF
      view.setUint32(4, 36 + length, true);
      view.setUint32(8, 0x57415645, false); // WAVE
      view.setUint32(12, 0x666d7420, false); // fmt 
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      view.setUint32(36, 0x64617461, false); // data
      view.setUint32(40, length, true);
      return new Blob([wavHeader, buffer], { type: 'audio/wav' });
    }

    // Main speak function with fallback
    async function speakParagraph(text) {
      if (!text) return;

      // 1. Try Google High Quality TTS if API Key exists
      if (apiKey) {
        try {
          ttsStatus.style.display = 'inline-block';
          const payload = {
            contents: [{ parts: [{ text: `Say in a friendly, clear teacher voice: ${text}` }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Kore" }
                }
              }
            },
            model: "gemini-2.5-flash-preview-tts"
          };

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const result = await response.json();
          if (result.error) throw new Error(result.error.message);

          const audioData = result.candidates[0].content.parts[0].inlineData.data;
          const sampleRate = parseInt(result.candidates[0].content.parts[0].inlineData.mimeType.match(/rate=(\d+)/)?.[1] || "24000");

          const wavBlob = pcmToWav(audioData, sampleRate);
          const audioUrl = URL.createObjectURL(wavBlob);

          if (currentAudio) currentAudio.pause();
          currentAudio = new Audio(audioUrl);
          currentAudio.onended = () => {
            ttsStatus.style.display = 'none';
          };
          currentAudio.play();
          return; // Success, exit
        } catch (err) {
          console.warn("Gemini TTS failed, falling back:", err);
          ttsStatus.innerText = "Using standard voice...";
          setTimeout(() => ttsStatus.style.display = 'none', 1000);
        }
      }

      // 2. Fallback to CourseEngine or Browser
      if (window.CourseEngine?.speech?.speak) {
        window.CourseEngine.speech.speak(text, lang);
      } else if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        window.speechSynthesis.speak(u);
      }
    }

    /* ---------- Game Logic ---------- */

    function createBoard() {
      board.innerHTML = '';
      for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'hole-cell';

        const itemContainer = document.createElement('div');
        itemContainer.className = 'item-container';
        itemContainer.id = `hole-${i}`;
        itemContainer.onclick = (e) => whack(i, e);

        const hole = document.createElement('div');
        hole.className = 'hole';

        cell.appendChild(itemContainer);
        cell.appendChild(hole);
        board.appendChild(cell);
      }
    }

    function spawnLoop() {
      if (!gameActive) return;

      const holes = Array.from(board.querySelectorAll('.item-container:not(.active)'));
      if (holes.length > 0) {
        // Number of simultaneous moles increases as time goes on
        const simultaneous = timeLeft > 20 ? 1 : (timeLeft > 10 ? 2 : 3);

        // Shuffle holes to pick random distinct ones
        const shuffled = holes.sort(() => 0.5 - Math.random());
        const toSpawn = shuffled.slice(0, simultaneous);

        toSpawn.forEach(spawnItem);
      }

      // DYNAMIC DIFFICULTY:
      // Starts at 1200ms delay, ramps down to 350ms for hyper speed
      const progress = (timeLimit - timeLeft) / timeLimit;
      const speed = 1200 - (progress * 850);

      spawnTimer = setTimeout(spawnLoop, Math.max(350, speed));
    }

    function spawnItem(container) {
      // Logic from prototype
      const topicCorrect = topic.correct || [];
      const topicWrong = topic.wrong || [];

      // If no words defined, fallback
      if (!topicCorrect.length && !topicWrong.length) return;

      const isCorrect = Math.random() > 0.4;
      // Safety check: if we need correct but have none, flip to wrong (and vice versa)
      const forceType = (!topicCorrect.length) ? false : (!topicWrong.length) ? true : isCorrect;

      const wordList = forceType ? topicCorrect : topicWrong;
      const word = wordList[Math.floor(Math.random() * wordList.length)];

      container.innerHTML = `
          <div class="word-tag">${word}</div>
          <svg class="${forceType ? 'mole-svg' : 'carrot-svg'}">
              <use href="#${forceType ? 'mole-svg' : 'carrot-svg'}"></use>
          </svg>
      `;

      container.dataset.type = forceType ? 'mole' : 'carrot';
      container.classList.add('active');

      // Item stays up for shorter duration as game progresses
      const progress = (timeLimit - timeLeft) / timeLimit;
      const stayTime = 2000 - (progress * 1300); // 2s down to 0.7s

      setTimeout(() => {
        if (container.classList.contains('active')) {
          container.classList.remove('active');
        }
      }, Math.max(700, stayTime));
    }

    function whack(index, event) {
      const container = board.querySelector(`#hole-${index}`);
      if (!container || !container.classList.contains('active')) return;

      const type = container.dataset.type;

      // Get click coordinates relative to viewport to position float score
      const rect = container.getBoundingClientRect();
      // Use event client or center of hole
      const x = event ? event.clientX : (rect.left + rect.width / 2);
      const y = event ? event.clientY : (rect.top);

      if (type === 'mole') {
        score += 10;
        showFloatingScore('+10', x, y, 'text-green-600');
        // Play 'pop' or success sound if available?
      } else {
        score = Math.max(0, score - 5);
        showFloatingScore('-5', x, y, 'text-red-600');
        container.classList.add('shake');
        setTimeout(() => container.classList.remove('shake'), 500);
      }

      container.classList.remove('active');
      scoreEl.innerText = score;
    }

    function showFloatingScore(text, x, y, colorClass) {
      const el = document.createElement('div');
      el.className = `float-score game-font text-3xl ${colorClass}`;
      el.innerText = text;

      // We need to append to body or a fixed container to be above everything and positioned correctly
      // However, we are inside a shadowDOM or constrained container usually. 
      // Ideally append to container, but use absolute pos relative to container.
      // For simplicity matching prototype: append to container, assume relative positioning

      // Adjust x,y to be relative to container if container is relative
      const containerRect = container.getBoundingClientRect();
      const relX = x - containerRect.left;
      const relY = y - containerRect.top;

      el.style.left = `${relX}px`;
      el.style.top = `${relY}px`;

      container.appendChild(el);
      setTimeout(() => el.remove(), 800);
    }

    function endGame() {
      gameActive = false;
      clearInterval(gameTimer);
      clearTimeout(spawnTimer);
      finalScoreEl.innerText = score;
      gameOverScreen.style.display = 'flex';

      complete({ success: true, score });
    }

    function startGame() {
      if (currentAudio) currentAudio.pause();

      introModal.style.display = 'none';
      score = 0;
      timeLeft = timeLimit;
      gameActive = true;
      scoreEl.innerText = score;
      timerEl.innerText = timeLeft;

      createBoard();

      if (gameTimer) clearInterval(gameTimer);
      if (spawnTimer) clearTimeout(spawnTimer);

      gameTimer = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;
        if (timeLeft <= 0) endGame();
      }, 1000);

      spawnLoop();
    }

    /* ---------- Event Handlers ---------- */
    playBtn.onclick = () => {
      // 1. Show Intro Modal
      startScreen.style.display = 'none';
      introModal.style.display = 'flex';

      // 2. Play TTS
      const text = topic.description?.[lang] || topic.description?.en;
      if (text) speakParagraph(text);
    };

    startWhackingBtn.onclick = startGame;

    restartBtn.onclick = () => {
      // Reset full state
      gameOverScreen.style.display = 'none';
      startScreen.style.display = 'flex';
      // Reload is too harsh for SPA, just reset UI
      // But for random topic selection, we might want to re-roll?
      // Prototype logic: "location.reload()" -> effective re-roll.
      // We will just re-call render? No, that's external.
      // We'll just reset back to start screen to allow "Play Game" again (which keeps same topic currently)
      // If we want a NEW topic, we'd need to re-pick.

      // Re-pick topic:
      const t = topics[Math.floor(Math.random() * topics.length)];
      // Update topic logic would require refactoring variables to not be const or scope-bound.
      // For now, let's just replay the same topic or reload if we could.
      // Simplest: Just UI reset to Play button.
    };

  }

  /* ======================================================
     ASSETS & STYLES (Ported)
  ====================================================== */

  static prototypeStyles() {
    return `
    /* Font Imports handled by platform usually, but here are the classes */
    .game-font { font-family: 'Fredoka One', cursive, system-ui; }
    
    /* Animation Keyframes */
    @keyframes shake {
        10%, 90% { transform: translate3d(-1px, -20px, 0); }
        20%, 80% { transform: translate3d(2px, -20px, 0); }
        30%, 50%, 70% { transform: translate3d(-4px, -20px, 0); }
        40%, 60% { transform: translate3d(4px, -20px, 0); }
    }
    @keyframes floatUp {
        0% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-80px); }
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    /* Classes */
    .mole-svg { width: 80px; height: 80px; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.1)); }
    .carrot-svg { width: 70px; height: 90px; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.1)); }
    
    .hole-cell {
        position: relative;
        width: 140px;
        height: 180px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
    }

    .hole {
        position: relative;
        width: 120px;
        height: 40px;
        background: radial-gradient(ellipse at center, #3f200d 0%, #1a0a02 100%);
        border-radius: 50%;
        margin: 0 auto;
        box-shadow: inset 0 5px 10px rgba(0,0,0,0.5);
        z-index: 5;
    }
    
    /* Grass tuft effect under hole */
    .hole::after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: -10%;
        width: 120%;
        height: 15px;
        background: #2d6a4f; /* Darker green for depth */
        border-radius: 50%;
        z-index: -1;
    }

    .item-container {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 10px;
        height: 160px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        transform: translateY(110%);
        cursor: pointer;
        pointer-events: none;
        z-index: 10;
    }

    .item-container.active {
        transform: translateY(-20px);
        pointer-events: auto;
    }

    .word-tag {
        background: #ffffff;
        color: #1a202c;
        padding: 4px 12px;
        border-radius: 16px;
        font-weight: 800;
        font-size: 1rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        margin-bottom: 8px;
        border: 3px solid #4ade80;
        white-space: nowrap;
        z-index: 20;
        pointer-events: none;
    }

    .shake {
        animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }

    .float-score {
        position: absolute;
        font-weight: bold;
        pointer-events: none;
        animation: floatUp 0.8s ease-out forwards;
        z-index: 100;
        text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .grid-layout {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.0rem;
        width: 100%;
        max-width: 500px; /* Constrain max width for aesthetics */
    }

    .loader {
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3498db;
        border-radius: 50%;
        width: 16px; 
        height: 16px;
        animation: spin 1s linear infinite;
        display: inline-block;
        vertical-align: middle;
        margin-right: 8px;
    }

    /* Mobile Scaling */
    @media (max-width: 480px) {
        .grid-layout { 
            gap: 0.25rem; 
            max-width: 100%;
        }
        .hole-cell { 
            width: auto; /* Let grid control width */
            height: 130px; 
        }
        .hole { 
            width: 80%; /* Relative to cell */
            max-width: 90px;
            height: 25px; 
        }
        .item-container { 
            height: 110px; 
            bottom: 5px;
        }
        .mole-svg { width: 50px; height: 50px; }
        .carrot-svg { width: 40px; height: 60px; }
        .word-tag { 
            font-size: 0.7rem; 
            padding: 2px 6px; 
            border-width: 2px; 
            margin-bottom: 4px;
        }
    }
    `;
  }

  static prototypeSVG() {
    return `
    <svg style="display:none">
        <symbol id="mole-svg" viewBox="0 0 100 100">
            <circle cx="50" cy="60" r="35" fill="#7d5233" />
            <circle cx="50" cy="40" r="28" fill="#7d5233" />
            <ellipse cx="50" cy="45" rx="15" ry="10" fill="#fbcfe8" />
            <circle cx="40" cy="35" r="3" fill="#000" />
            <circle cx="60" cy="35" r="3" fill="#000" />
            <path d="M45 42 Q50 45 55 42" fill="none" stroke="#000" stroke-width="2" />
            <circle cx="50" cy="42" r="4" fill="#331800" />
            <rect x="42" y="48" width="6" height="4" fill="white" />
            <rect x="52" y="48" width="6" height="4" fill="white" />
        </symbol>
        <symbol id="carrot-svg" viewBox="0 0 80 100">
            <path d="M40 30 L30 5 L40 15 L50 5 L40 30" fill="#22c55e" />
            <path d="M15 30 Q40 20 65 30 L45 95 Q40 100 35 95 Z" fill="#f97316" />
            <path d="M25 45 H35 M45 60 H55 M30 75 H40" stroke="#c2410c" stroke-width="2" />
            <path d="M30 45 L38 50 M50 45 L42 50" stroke="black" stroke-width="2" />
            <circle cx="34" cy="52" r="2" fill="black" />
            <circle cx="46" cy="52" r="2" fill="black" />
        </symbol>
    </svg>
    `;
  }
}
