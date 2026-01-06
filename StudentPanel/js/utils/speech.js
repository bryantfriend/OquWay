// js/utils/speech.js

/**
 * Returns current UI language
 */
function getLang() {
  const raw = (localStorage.getItem("language") || "en").toLowerCase();
  return raw === "ky" ? "kg" : raw;
}

/**
 * Stops all ongoing speech and avatar animations.
 */
export function stopSpeech() {
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  document.querySelectorAll(".avatar-talking").forEach(el => {
    el.classList.remove("avatar-talking");
  });
}

/**
 * Simple speech output
 */
export function speak(text, lang = getLang()) {
  stopSpeech();
  if (!("speechSynthesis" in window)) {
    console.warn("Speech synthesis not supported.");
    return null;
  }

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = detectLanguageCode(lang);
  utter.rate = 1;
  utter.pitch = 1;
  utter.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length) {
    const match = voices.find(v => v.lang.toLowerCase().startsWith(utter.lang)) || voices[0];
    utter.voice = match;
  }

  window.speechSynthesis.speak(utter);
  return utter;
}

/**
 * Advanced speech with profile + optional avatar animation
 * @param {string} text 
 * @param {string} profile e.g. "female_en_soft"
 * @param {HTMLElement} avatarEl optional avatar <img> element
 */
export function speakWithProfile(text, profile = "female_en_soft", avatarEl = null) {
  stopSpeech();
  if (!("speechSynthesis" in window)) {
    console.warn("Speech synthesis not supported.");
    return null;
  }

  const lang = profile.includes("_") ? profile.split("_")[1] || "en" : getLang();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = detectLanguageCode(lang);

  // --- Voice tone setup ---
  utter.rate = profile.includes("fast") ? 1.3 : profile.includes("slow") ? 0.8 : 1;
  utter.pitch = profile.includes("male") ? 0.9 : 1.2;
  utter.volume = 1;

  // --- Select best voice ---
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) {
    // 1. Filter by language
    const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(utter.lang.toLowerCase().split('-')[0]));

    // 2. Define priority keywords for "High Quality"
    const highQualKeywords = ["google", "natural", "premium", "enhanced", "online"];

    // 3. Helper to score voices
    const scoreVoice = (v) => {
      let score = 0;
      const name = v.name.toLowerCase();

      // Quality
      if (highQualKeywords.some(k => name.includes(k))) score += 10;

      // Gender match (if profile specifies)
      const isMale = name.includes("male") && !name.includes("female");
      const isFemale = name.includes("female");

      if (profile.includes("female") && isFemale) score += 5;
      if (profile.includes("male") && isMale) score += 5;

      // Exact locale match bonus
      if (v.lang === utter.lang) score += 2;

      return score;
    };

    // 4. Sort and pick best
    langVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));

    utter.voice = langVoices[0] || voices[0];

    // Debug log to verify selection
    // console.log(`Selected voice for ${profile}:`, utter.voice.name);
  }

  // --- Avatar mouth animation ---
  if (avatarEl) {
    const intensity = profile.includes("soft") ? 1 : profile.includes("fast") ? 1.5 : 1.2;
    animateAvatarMouth(avatarEl, intensity, utter);
  }

  window.speechSynthesis.speak(utter);
  return utter;
}

/**
 * Generates mouth-movement animation during speech
 */
function animateAvatarMouth(avatarEl, intensity = 1, utter) {
  if (!avatarEl) return;
  avatarEl.classList.add("avatar-talking");

  // Random subtle transform changes to simulate talking
  let interval = setInterval(() => {
    const scale = 1 + (Math.random() * 0.05 * intensity);
    const rotate = (Math.random() - 0.5) * 2; // slight head wiggle
    avatarEl.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
  }, 120);

  utter.onend = () => {
    clearInterval(interval);
    avatarEl.style.transform = "scale(1) rotate(0deg)";
    avatarEl.classList.remove("avatar-talking");
  };
}

/**
 * Converts simplified language codes to proper locales
 */
function detectLanguageCode(lang) {
  switch (lang) {
    case "ru":
      return "ru-RU";
    case "kg":
    case "ky":
      return "ru-RU"; // Kyrgyz fallback
    case "tr":
      return "tr-TR";
    case "zh":
      return "zh-CN";
    case "es":
      return "es-ES";
    default:
      return "en-US";
  }
}

/* --- Optional CSS helper (include in your main style.css) ---
.avatar-talking {
  transition: transform 0.1s ease;
}
------------------------------------------------------------ */
