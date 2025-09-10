// js/steps/speech.js

let voices = [];

// A function to populate the voices cache when they are loaded
function populateVoiceList() {
  if (typeof speechSynthesis === 'undefined') {
    return;
  }
  // getVoices() can be slow, so we check if the list has already been populated.
  if (voices.length === 0) {
      voices = speechSynthesis.getVoices();
  }
}

// Initial population of voices and onvoiceschanged event
if (typeof speechSynthesis !== 'undefined') {
  populateVoiceList();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
  }
}

/**
 * Finds the best available voice for a given language, prioritizing higher-quality ones.
 * @param {string} lang The BCP 47 language code (e.g., 'en-US', 'ru-RU').
 * @returns {SpeechSynthesisVoice | null} The best found voice object.
 */
function findBestVoice(lang) {
  // Wait a moment for voices to load asynchronously in some browsers.
  if (voices.length === 0) {
      voices = speechSynthesis.getVoices();
  }

  const langPrefix = lang.split('-')[0]; // e.g., 'en' from 'en-US'

  // 1. Prioritize high-quality voices by name (e.g., Google voices)
  const premiumVoice = voices.find(voice => 
    voice.lang.startsWith(langPrefix) && voice.name.includes('Google')
  );
  if (premiumVoice) return premiumVoice;
  
  // 2. Fallback: Find the first available voice for the language
  const fallbackVoice = voices.find(voice => voice.lang.startsWith(langPrefix));
  if (fallbackVoice) return fallbackVoice;

  return null;
}

/**
 * Speaks a given text using the browser's Web Speech API.
 * @param {string} text The text to be spoken.
 * @param {string} lang The BCP 47 language code (e.g., 'en-US', 'ru-RU').
 * @returns {SpeechSynthesisUtterance | null} The utterance object, or null if speech is not supported.
 */
export function speak(text, lang = 'en-US') {
  if (typeof speechSynthesis === 'undefined') {
    console.warn("Speech synthesis is not supported in this browser.");
    return null;
  }

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // *** IMPROVEMENT 1: Use our smarter voice selection ***
  utterance.voice = findBestVoice(lang);
  
  utterance.lang = lang;
  utterance.volume = 1; // 0 to 1
  utterance.pitch = 1; // 0 to 2

  // *** IMPROVEMENT 2: A slightly slower rate sounds more natural for learning ***
  utterance.rate = 0.9; // 0.1 to 10

  speechSynthesis.speak(utterance);
  
  return utterance;
}