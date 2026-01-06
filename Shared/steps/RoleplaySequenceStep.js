
import BaseStep from './BaseStep.js';
import { resolveLocalized } from './utils.js';

export default class RoleplaySequenceStep extends BaseStep {
    static get id() { return 'roleplaySequence'; }
    static get version() { return '1.0.0'; }
    static get displayName() { return 'Roleplay Sequence'; }
    static get description() { return 'Interactive roleplay with multiple scenes and branching choices.'; }
    static get category() { return 'simulation'; }
    static get tags() { return ['roleplay', 'speech', 'interactive']; }

    static get editorSchema() {
        return {
            fields: [
                { key: "scenario", label: "Scenario Title", type: "text", default: "At the Cafe" },
                {
                    key: "scenes",
                    label: "Scenes",
                    type: "array",
                    itemSchema: {
                        fields: [
                            { key: "character", label: "Character", type: "text", default: "Barista" },
                            { key: "dialogue", label: "Dialogue (or Prompt if You)", type: "textarea" },
                            { key: "avatar", label: "Avatar URL", type: "text" },
                            { key: "voice", label: "Voice Profile", type: "select", options: ["female_en_soft", "male_en_calm"], default: "female_en_soft" },
                            {
                                key: "options",
                                label: "Player Options (if Character is You)",
                                type: "array",
                                itemSchema: {
                                    fields: [
                                        { key: "text", label: "Option Text", type: "text" },
                                        { key: "isCorrect", label: "Is Best Choice?", type: "checkbox" },
                                        { key: "feedback", label: "Feedback", type: "text" }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        };
    }

    static get defaultConfig() {
        return {
            scenario: "Greeting a Friend",
            scenes: [
                { character: "Friend", dialogue: "Hi! How are you?", avatar: "", voice: "female_en_soft" },
                { character: "You", prompt: "How do you reply?", options: [{ text: "I'm good, thanks!", isCorrect: true }] }
            ]
        };
    }

    static render({ container, config, context }) {
        // Dependencies from Context
        const { db, auth, firebaseUtils, speechUtils } = context;
        const lang = context.lang || 'en';

        // Graceful degradation / mocking for Preview Mode (no firebase/speech)
        const safeDoc = firebaseUtils?.doc || (() => { });
        const safeUpdateDoc = firebaseUtils?.updateDoc || (async () => { });
        const safeIncrement = firebaseUtils?.increment || ((v) => v);
        const speakWithProfile = speechUtils?.speakWithProfile || (() => { });

        let currentSceneIndex = 0;
        const stepData = config;
        const scenario = resolveLocalized(stepData.scenario, lang);

        // State
        let sceneContainer = null;
        let bgContainer = null;
        let isChoiceActive = true;
        let progressBarInner = null;
        let rewardMsg = null;

        container.innerHTML = `
            <div class="relative p-4 max-w-2xl mx-auto overflow-hidden rounded-xl shadow-lg bg-white/70 backdrop-blur border border-gray-100">
            <div id="bg-container" class="absolute inset-0 -z-10 bg-cover bg-center transition-all duration-1000"></div>
            <h3 class="text-lg font-bold mb-3 text-center bg-gray-100/90 p-2 rounded backdrop-blur-sm">${scenario}</h3>

            <div id="progressBarOuter" class="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div id="progressBarInner" class="h-full bg-blue-500 transition-all duration-300" style="width:0%"></div>
            </div>

            <div id="scenes-container" class="space-y-4 overflow-y-auto max-h-[60vh] p-2"></div>

            <p id="rewardMsg" class="text-center text-green-700 font-semibold mt-4 hidden"></p>
            </div>
            <style>
                .animate-fade-in { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .avatar-talking { animation: talking 0.3s infinite alternate; border-color: #3b82f6; }
                @keyframes talking { from { transform: scale(1); } to { transform: scale(1.05); } }
                .shake { animation: shake 0.4s ease-in-out; }
            </style>
        `;

        sceneContainer = container.querySelector("#scenes-container");
        bgContainer = container.querySelector("#bg-container");
        progressBarInner = container.querySelector("#progressBarInner");
        rewardMsg = container.querySelector("#rewardMsg");

        sceneContainer.addEventListener("click", handleOptionClick);

        renderScene();

        // Logic
        function renderScene() {
            if (!stepData.scenes || currentSceneIndex >= stepData.scenes.length) {
                endSequence();
                return;
            }

            const scene = stepData.scenes[currentSceneIndex];

            // Progress
            const progress = Math.round((currentSceneIndex / stepData.scenes.length) * 100);
            if (progressBarInner) progressBarInner.style.width = `${progress}%`;

            if (scene.background) {
                // Ensure asset path is correct or absolute
                bgContainer.style.backgroundImage = `url('${scene.background}')`;
            }

            // NPC
            if (scene.character !== "You") {
                const dialogue = resolveLocalized(scene.dialogue, lang);
                const avatar = scene.avatar
                    ? `<img src="${scene.avatar}" class="w-10 h-10 rounded-full mr-2 border border-gray-300 object-cover" loading="lazy">`
                    : "";
                const mood = scene.mood ? `<span class="ml-2 text-sm text-gray-500">(${scene.mood})</span>` : "";

                const sceneHtml = `
                    <div class="mb-4 p-3 bg-gray-100 rounded-lg shadow-sm animate-fade-in flex items-start">
                        <div class="flex-shrink-0 mr-3 mt-1">${avatar}</div>
                        <div>
                             <div class="flex items-center mb-1">
                                <span class="font-bold text-gray-800">${scene.character}</span>
                                ${mood}
                            </div>
                            <p class="dialogue-text text-gray-800 text-lg leading-relaxed min-h-[1.5em]"></p>
                        </div>
                    </div>
                `;

                const wrapper = document.createElement('div');
                wrapper.innerHTML = sceneHtml;
                const sceneEl = wrapper.firstElementChild;
                sceneContainer.appendChild(sceneEl);
                sceneContainer.scrollTop = sceneContainer.scrollHeight;

                const textEl = sceneEl.querySelector(".dialogue-text");
                const avatarImg = sceneEl.querySelector("img");

                // Voice
                const voiceProfile = scene.voice || "female_en_soft";
                // Only speak if utils provided
                const utter = speakWithProfile(dialogue, voiceProfile, avatarImg);

                if (utter && avatarImg) {
                    avatarImg.classList.add("avatar-talking");
                    utter.onend = () => {
                        avatarImg.classList.remove("avatar-talking");
                        awardIntentionPoints({ cognitive: 1 });
                    };
                }

                // Typewriter
                typeText(textEl, dialogue, 25, () => {
                    // Auto advance after reading time? Or explicit 'Next'?
                    // Original code: setTimeout(renderScene, dialogue.length * 35 + 1000);
                    currentSceneIndex++;
                    setTimeout(renderScene, Math.max(2000, dialogue.length * 50));
                });

            } else {
                // Player Choice
                const prompt = resolveLocalized(scene.prompt || scene.dialogue, lang); // fallback
                const optionsHtml = (scene.options || [])
                    .map((opt) => {
                        const text = resolveLocalized(opt.text, lang);
                        const escaped = JSON.stringify(opt).replace(/'/g, "&apos;");
                        return `
                            <button class="player-option-btn w-full text-left p-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition mb-2 shadow-sm" data-option='${escaped}'>
                                ${text}
                            </button>`;
                    })
                    .join("");

                const sceneHtml = `
                    <div class="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 animate-fade-in rounded-r-lg">
                        <p class="font-semibold text-blue-800 mb-3 text-lg">${prompt}</p>
                        <div class="space-y-2">${optionsHtml}</div>
                        <div class="feedback-container mt-2 h-8 text-sm font-semibold"></div>
                    </div>`;

                sceneContainer.insertAdjacentHTML('beforeend', sceneHtml);
                sceneContainer.scrollTop = sceneContainer.scrollHeight;
                isChoiceActive = true;
            }
        }

        async function handleOptionClick(e) {
            const btn = e.target.closest(".player-option-btn");
            if (!btn || !isChoiceActive) return;
            isChoiceActive = false;

            const optionData = JSON.parse(btn.dataset.option);
            const parent = btn.parentElement; // div containing buttons
            const feedbackContainer = parent.parentElement.querySelector(".feedback-container");

            // Disable siblings
            parent.querySelectorAll(".player-option-btn").forEach((b) => {
                b.disabled = true;
                b.classList.add("opacity-60");
            });

            if (optionData.isCorrect) {
                btn.classList.remove("border-gray-300", "opacity-60");
                btn.classList.add("bg-green-100", "border-green-500", "ring-2", "ring-green-400");

                awardIntentionPoints({ cognitive: 1, social: 1 });
                playAudio("https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.wav"); // generic sound

                currentSceneIndex++;
                setTimeout(renderScene, 1000);
            } else {
                btn.classList.remove("border-gray-300", "opacity-60");
                btn.classList.add("bg-red-100", "border-red-500", "shake");

                const feedback = resolveLocalized(optionData.feedback, lang);
                if (feedback && feedbackContainer) {
                    feedbackContainer.innerHTML = `<p class="text-red-600">${feedback}</p>`;
                }
                playAudio("https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.wav");

                setTimeout(() => {
                    btn.classList.remove("bg-red-100", "border-red-500", "shake");
                    parent.querySelectorAll(".player-option-btn").forEach((b) => {
                        b.disabled = false;
                        b.classList.remove("opacity-60");
                    });
                    if (feedbackContainer) feedbackContainer.innerHTML = "";
                    isChoiceActive = true;
                }, 2000);
            }
        }

        function endSequence() {
            const html = `
                <div class="text-center p-6 bg-green-100 border border-green-400 rounded-xl animate-fade-in shadow-md mt-4">
                    <div class="text-4xl mb-2">🎉</div>
                    <h3 class="text-xl font-bold text-green-800 mb-2">Sequence Complete!</h3>
                    <p class="text-gray-700">Excellent communication! You've earned 🤝 +2 Social Points.</p>
                </div>
            `;
            sceneContainer.insertAdjacentHTML('beforeend', html);
            sceneContainer.scrollTop = sceneContainer.scrollHeight;
            awardIntentionPoints({ social: 2 });

            // Notify engine we are done?
            // context.onComplete?.(); // Optional: if we want to auto-advance module
        }

        async function awardIntentionPoints(points) {
            if (!auth?.currentUser || !db) return; // Skip if no firebase context
            try {
                const userId = auth.currentUser.uid;
                const userRef = safeDoc(db, "users", userId);
                const updateData = {};
                if (points.cognitive) updateData["points.cognitive"] = safeIncrement(points.cognitive);
                if (points.social) updateData["points.social"] = safeIncrement(points.social);
                await safeUpdateDoc(userRef, updateData);
                showReward(points);
            } catch (e) {
                console.warn("Failed to award points", e);
            }
        }

        function showReward(points) {
            if (!rewardMsg) return;
            const label = Object.keys(points)
                .map((k) => `${k === 'cognitive' ? '🧠' : '🤝'} +${points[k]}`)
                .join("  ");
            rewardMsg.textContent = label;
            rewardMsg.classList.remove("hidden");
            setTimeout(() => rewardMsg.classList.add("hidden"), 2500);
        }

        function typeText(element, text, speed = 25, callback) {
            let i = 0;
            element.textContent = "";
            const interval = setInterval(() => {
                element.textContent += text[i];
                i++;
                if (i >= text.length) {
                    clearInterval(interval);
                    if (callback) callback();
                }
            }, speed);
        }

        function playAudio(url) {
            try { new Audio(url).play().catch(() => { }); } catch (e) { }
        }
    }
}
