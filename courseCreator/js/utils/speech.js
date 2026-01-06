
// js/utils/speech.js

// --- Reusable Speech Synthesis Module ---

let voices = [];
const langToBCP47 = {
    en: 'en-US',
    ru: 'ru-RU',
    kg: 'ky-KG'
};

function loadVoices() {
    voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
        setTimeout(() => voices = window.speechSynthesis.getVoices(), 100);
    }
}

loadVoices();
if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
}

function getBestVoice(langCode) {
    if (voices.length === 0) {
        // Retry load
        voices = window.speechSynthesis.getVoices();
    }
    const googleVoice = voices.find(voice => voice.lang === langCode && voice.name.includes('Google'));
    if (googleVoice) return googleVoice;

    return voices.find(voice => voice.lang === langCode);
}

export function speak(text, lang) {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = langToBCP47[lang] || 'en-US';

    utterance.lang = langCode;
    utterance.voice = getBestVoice(langCode);
    utterance.rate = 0.9;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
}
