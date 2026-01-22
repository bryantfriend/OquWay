(function () {
    /**
     * Platform/Shared/speech.js
     * Shared Engine Service for Speech Synthesis
     */

    // 1. Ensure Namespace
    window.CourseEngine = window.CourseEngine || {};

    // 2. Prevent Re-registration
    if (window.CourseEngine.speech) return;

    let voices = [];
    const langMap = {
        'en': 'en-US',
        'ru': 'ru-RU',
        'kg': 'ky-KG',
        'ky': 'ky-KG',
        'zh': 'zh-CN',
        'tr': 'tr-TR'
    };

    /**
     * Sync voices from the browser
     */
    function loadVoices() {
        if (!window.speechSynthesis) return;
        voices = window.speechSynthesis.getVoices();
    }

    // Defensive voice loading
    if (window.speechSynthesis) {
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }

    /**
     * Resolves a short lang code to a BCP-47 tag
     */
    function resolveLang(lang) {
        if (!lang) return 'en-US';
        lang = lang.toLowerCase();

        // 1. Check explicit map
        if (langMap[lang]) return langMap[lang];

        // 2. Auto-convert (e.g. 'fr' -> 'fr-FR')
        if (lang.length === 2) return `${lang}-${lang.toUpperCase()}`;

        return lang;
    }

    /**
     * Finds the best voice for a given BCP-47 code
     */
    function getBestVoice(bcp47) {
        if (voices.length === 0) loadVoices();

        // 1. Filter by lang match
        const matched = voices.filter(v => v.lang.toLowerCase().startsWith(bcp47.split('-')[0].toLowerCase()));
        if (matched.length === 0) return null;

        // 2. Prefer exact BCP-47 match + Google/Premium
        const premiumMatch = matched.find(v =>
            v.lang === bcp47 &&
            (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium'))
        );
        if (premiumMatch) return premiumMatch;

        // 3. Prefer exact BCP-47 match
        const exactMatch = matched.find(v => v.lang === bcp47);
        if (exactMatch) return exactMatch;

        // 4. Fallback to any voice for that language
        return matched[0];
    }

    // The Service Object
    window.CourseEngine.speech = {
        /**
         * Speak text in a specified language
         * @param {string} text - The text to speak
         * @param {string} lang - Short code (en, ru, kg) or BCP-47 tag
         */
        speak: function (text, lang) {
            if (!window.speechSynthesis) {
                console.warn('[CourseEngine.speech] Synthesis not supported');
                return;
            }

            // Stop current
            window.speechSynthesis.cancel();

            if (!text) return;

            const bcp47 = resolveLang(lang);
            const utterance = new SpeechSynthesisUtterance(text);

            utterance.lang = bcp47;
            utterance.voice = getBestVoice(bcp47);
            utterance.rate = 0.95; // Slightly slower for clarity
            utterance.pitch = 1;

            window.speechSynthesis.speak(utterance);
        }
    };

    console.log('✅ CourseEngine.speech service registered');
})();
