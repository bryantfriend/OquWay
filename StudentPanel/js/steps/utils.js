// js/utils/speech.js

// --- Reusable Speech Synthesis Module ---

let voices = [];
const langToBCP47 = {
  en: 'en-US',
  ru: 'ru-RU',
  kg: 'ky-KG' // Note: Kyrgyz TTS support is rare in browsers.
};

/**
 * Loads and caches the available speech synthesis voices.
 * This function is called automatically when the module loads.
 */
function loadVoices() {
  voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
      // In some browsers (like Chrome), voices are loaded asynchronously.
      // We might need to try again if the list is initially empty.
      setTimeout(() => voices = window.speechSynthesis.getVoices(), 100);
  }
}

// Set up listeners to populate the voices array as soon as they are available.
loadVoices();
if (window.speechSynthesis.onvoiceschanged !== undefined) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

/**
 * Finds the best available voice for a given language, prioritizing Google's voices.
 * @param {string} langCode - BCP 47 language code (e.g., 'en-US').
 * @returns {SpeechSynthesisVoice | undefined}
 */
function getBestVoice(langCode) {
  if (voices.length === 0) {
    console.warn('Speech synthesis voices not loaded yet.');
    // Fallback attempt to load voices if they weren't ready.
    voices = window.speechSynthesis.getVoices();
  }
  const googleVoice = voices.find(voice => voice.lang === langCode && voice.name.includes('Google'));
  if (googleVoice) return googleVoice;
  
  return voices.find(voice => voice.lang === langCode);
}

/**
 * Speaks the given text using the best available browser voice.
 * This is the only function you need to export and use in other files.
 * @param {string} text - The text to speak.
 * @param {string} lang - The two-letter language code ('en', 'ru', 'kg').
 */
export function speak(text, lang) {
  // Stop any currently speaking audio to prevent words from overlapping.
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const langCode = langToBCP47[lang] || 'en-US';
  
  utterance.lang = langCode;
  utterance.voice = getBestVoice(langCode);
  utterance.rate = 0.9; // A slightly slower rate is often clearer for learners.
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
}