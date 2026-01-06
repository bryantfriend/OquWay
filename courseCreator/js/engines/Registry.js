import MatchingGameEngine from './MatchingGameEngine.js';
import MultiplicationGame from './multiplicationGame.js';
import PrimerEngine from './PrimerEngine.js';
import MissionEngine from './MissionEngine.js';
import ReflectionEngine from './ReflectionEngine.js';
import MovieEngine from './MovieEngine.js';
import AudioLessonEngine from './AudioLessonEngine.js';
import DialogueEngine from './DialogueEngine.js';
import RoleplayEngine from './RoleplayEngine.js';
import LetterRacingGameEngine from './LetterRacingGameEngine.js';
import IntentCheckEngine from './IntentCheckEngine.js';

console.log('Registry module loaded');

const engines = new Map();

export const Registry = {
    /**
     * Initialize keys
     */
    init() {
        this.register(MultiplicationGame);
        this.register(MatchingGameEngine);
        this.register(PrimerEngine);
        this.register(MissionEngine);
        this.register(ReflectionEngine);
        this.register(MovieEngine);
        this.register(AudioLessonEngine);
        this.register(DialogueEngine);
        this.register(RoleplayEngine);
        this.register(IntentCheckEngine);
        this.register(LetterRacingGameEngine);
    },


    /**
     * Register a new engine class.
     * @param {Class} EngineClass 
     */
    register(EngineClass) {
        if (!EngineClass.id) {
            console.error("Cannot register engine without ID");
            return;
        }
        engines.set(EngineClass.id, EngineClass);
        console.log(`[Registry] Registered engine: ${EngineClass.id}`);
    },

    /**
     * Get an engine class by ID.
     * @param {string} id 
     * @returns {Class|undefined}
     */
    get(id) {
        return engines.get(id);
    },

    /**
     * Get all registered engines.
     * @returns {Array<Class>}
     */
    getAll() {
        return Array.from(engines.values());
    }
};
