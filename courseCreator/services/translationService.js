/**
 * translationService.js
 * Handles text translation using MyMemory API (free tier)
 */
export const translationService = {
    /**
     * Translate text from one language to another
     * @param {string} text - Text to translate
     * @param {string} from - Source language code (e.g., 'en')
     * @param {string} to - Target language code (e.g., 'ru')
     * @returns {Promise<string>} Translated text
     */
    async translateText(text, from, to) {
        if (!text) return "";

        // Normalize codes (fix common issues like 'cn' -> 'zh-CN')
        const normalize = (code) => {
            code = code.toLowerCase();
            if (code === 'cn') return 'zh-CN';
            if (code === 'zh') return 'zh-CN';
            return code;
        };

        from = normalize(from);
        to = normalize(to);

        if (from === to) return text;

        try {
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data && data.responseData) {
                return data.responseData.translatedText;
            }
            return text; // Fallback to original
        } catch (err) {
            console.error("Translation failed:", err);
            return text;
        }
    }
};
