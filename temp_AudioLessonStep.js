const BaseStep = window.CourseEngine.BaseStep;

export default class AudioLessonStep extends BaseStep {

    static get id() { return 'audioLesson'; }
    static get version() { return '3.0.0'; }
    static get displayName() { return 'Audio Lesson'; }
    static get description() {
        return 'Listen to vocabulary items with audio pronunciation.';
    }
    static get category() { return 'language'; }
    static get tags() { return ['audio', 'listening', 'vocabulary']; }

    /* ======================================================
       2. VALIDATION (Fixed Contract)
    ====================================================== */

    static validateConfig(config = {}) {
        const errors = [];
        if (!config.title || typeof config.title !== 'object') {
            errors.push({ field: 'title', message: 'Lesson title (localized) is required' });
        }
        if (!Array.isArray(config.items)) {
            errors.push({ field: 'items', message: 'Vocabulary items list is required' });
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }

    /* ======================================================
       3. DEFAULT CONFIG
    ====================================================== */

    static get defaultConfig() {
        return {
            title: { en: 'Key Vocabulary' },
            items: [
                { word: { en: 'Hello' }, translation: { en: 'Hola' }, points: 0, intention: 'cognitive' },
                { word: { en: 'Goodbye' }, translation: { en: 'Adiós' }, points: 0, intention: 'cognitive' }
            ]
        };
    }

    /* ======================================================
       4. RENDER (Unified for Editor & Player)
    ====================================================== */

    static render({ container, config, context, onComplete }) {
        // 1. Setup guard for completion
        // Check if BaseStep has createCompletionGuard, otherwise fallback
        const complete = this.createCompletionGuard
            ? this.createCompletionGuard(onComplete)
            : (onComplete || (() => { }));

        // 2. Identify Mode & Language
        const isEditing = context?.mode === 'preview' || context?.mode === 'editor';
        const lang = context?.language || 'en';

        // Config defaults
        const title = config.title?.[lang] || config.title?.en || 'Audio Lesson';
        const items = Array.isArray(config.items) ? config.items : [];

        // --- Editor Preview (Static) ---
        // In editor, we show a simplified placeholder to avoid playing audio/interactions
        if (isEditing) {
            container.innerHTML = `
        <div class="p-6 rounded-xl bg-white shadow-sm border-2 border-dashed text-center text-gray-400">
          <div class="text-3xl mb-2">🎧</div>
          <div class="text-lg font-bold text-gray-600">${title}</div>
          <div class="text-xs mt-1">Interactivity is active only in player mode.</div>
        </div>
      `;
            return;
        }

        // --- Student Player Runtime ---
        const played = new Set();
        const speak = (text) => {
            if (window.CourseEngine?.speech?.speak) {
                window.CourseEngine.speech.speak(text, 'en');
            } else if ('speechSynthesis' in window) {
                const u = new SpeechSynthesisUtterance(text);
                window.speechSynthesis.speak(u);
            }
        };

        container.innerHTML = `
      <div class="max-w-md mx-auto bg-white rounded-xl shadow-lg border overflow-hidden">
        <div class="bg-blue-600 text-white p-4 text-center font-bold shadow-md">
          ${title}
        </div>
        <div class="divide-y max-h-[400px] overflow-y-auto">
          ${items.map((item, i) => `
            <div class="flex items-center justify-between p-4 hover:bg-blue-50 transition cursor-pointer audio-item" data-index="${i}">
              <div class="flex-1">
                <div class="font-bold text-gray-800">${item.word?.[lang] || item.word?.en || ''}</div>
                <div class="text-sm text-gray-500 italic">
                  ${item.translation?.[lang] || item.translation?.en || ''}
                </div>
              </div>
              <div class="text-blue-500 text-xl">🔊</div>
            </div>
          `).join('')}
        </div>
        <div class="h-1 bg-gray-100 w-full">
           <div id="prog-fill" class="h-full bg-blue-500 transition-all duration-300" style="width: 0%"></div>
        </div>
        <div class="text-[10px] text-center p-2 text-gray-400 uppercase tracking-widest font-bold bg-gray-50 border-t">
          Listen to all items to complete
        </div>
      </div>
    `;

        container.querySelectorAll('.audio-item').forEach(el => {
            el.onclick = () => {
                const i = Number(el.dataset.index);
                const word = items[i]?.word?.[lang] || items[i]?.word?.en;
                if (!word) return;

                speak(word);
                played.add(i);

                // Visual feedback
                el.classList.add('bg-blue-50');
                const fill = container.querySelector('#prog-fill');
                if (fill) fill.style.width = `${(played.size / items.length) * 100}%`;

                if (played.size === items.length && items.length > 0) {
                    setTimeout(() => complete({ success: true }), 1000);
                }
            };
        });
    }
}
