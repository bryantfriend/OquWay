// js/steps/renderAudioLesson.js
import { currentLang } from "../i18n.js";
import { speak } from './speech.js'; // <-- PATH UPDATED to look in the current folder

export default function renderAudioLesson(container, part) {
    // The rest of this file is exactly the same as before.
    // ...
    container.innerHTML = `
    <div class="audio-lesson-container">
      <h3 class="text-lg font-semibold mb-2">${part.title?.[currentLang] || part.title?.en || "Audio Lesson"}</h3>
      
      <div class="flex items-center gap-2 mb-4">
        <button id="playAllBtn" class="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
          Play All
        </button>
        <button id="stopBtn" class="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" /></svg>
          Stop
        </button>
      </div>

      <ul id="audio-list" class="space-y-2">
        ${part.items.map((item, index) => {
          const word = typeof item.word === "object" ? (item.word[currentLang] || item.word.en) : item.word;
          const translation = typeof item.translation === "object" ? (item.translation[currentLang] || item.translation.en) : item.translation;

          return `
            <li class="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-100 hover:bg-blue-100 cursor-pointer transition"
                data-text-to-speak="${word}"
                data-lang-to-speak="en">
              <span class="font-medium">${word} - <span class="text-gray-600">${translation}</span></span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400 play-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.55 12.16L8.45 8.21C7.88 7.89 7 8.32 7 9v6c0 .68.88 1.11 1.45.79l7.1-3.95c.57-.32.57-1.26 0-1.58z" /></svg>
            </li>
          `;
        }).join('')}
      </ul>
    </div>
  `;

  const audioList = document.getElementById('audio-list');
  const listItems = audioList.querySelectorAll('li');
  const playAllBtn = document.getElementById('playAllBtn');
  const stopBtn = document.getElementById('stopBtn');

  const resetPlayingStyles = () => {
    listItems.forEach(li => li.classList.remove('bg-blue-200', 'ring-2', 'ring-blue-400'));
  };

  listItems.forEach(item => {
    item.addEventListener('click', () => {
      resetPlayingStyles();
      item.classList.add('bg-blue-200', 'ring-2', 'ring-blue-400');
      
      const utterance = speak(item.dataset.textToSpeak, item.dataset.langToSpeak);
      
      if (utterance) {
          utterance.onend = () => resetPlayingStyles();
      }
    });
  });

  stopBtn.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    resetPlayingStyles();
  });

  playAllBtn.addEventListener('click', () => {
    let currentIndex = 0;
    function playNext() {
      if (currentIndex >= listItems.length) {
        resetPlayingStyles();
        return;
      }
      resetPlayingStyles();
      const currentItem = listItems[currentIndex];
      currentItem.classList.add('bg-blue-200', 'ring-2', 'ring-blue-400');
      currentItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const utterance = speak(currentItem.dataset.textToSpeak, currentItem.dataset.langToSpeak);
      if(utterance){
          utterance.onend = () => {
              currentIndex++;
              playNext();
          };
          utterance.onerror = () => {
              console.error("Speech synthesis error for:", currentItem.dataset.textToSpeak);
              currentIndex++;
              playNext();
          }
      } else {
        // If utterance is null (API not ready), just move on
        currentIndex++;
        playNext();
      }
    }
    playNext();
  });
}