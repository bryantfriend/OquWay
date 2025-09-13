// js/steps/renderRoleplaySequence.js

function getLang() {
    const raw = (localStorage.getItem("language") || "en").toLowerCase();
    return raw === "ky" ? "kg" : raw;
}

function resolveLocalized(val, lang = getLang()) {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val[lang] ?? val.en ?? Object.values(val)[0] ?? "";
}

let currentSceneIndex = 0;
let partData = null;
let sceneContainer = null;
let isChoiceActive = true; // Prevents multiple clicks while processing an answer

function renderScene() {
    if (!partData || !sceneContainer) return;
    const lang = getLang();
    const scene = partData.scenes[currentSceneIndex];

    if (!scene) {
        // End of sequence - you could add a completion message here
        sceneContainer.innerHTML += `<div class="text-center p-4 bg-green-100 text-green-800 rounded-lg">Roleplay complete! Well done.</div>`;
        return;
    }

    let sceneHtml = '';
    if (scene.character === "You") {
        isChoiceActive = true; // Enable choices for the new scene
        const prompt = resolveLocalized(scene.prompt, lang);
        const optionsHtml = scene.options.map(opt => {
            const text = resolveLocalized(opt.text, lang);
            const escapedOptionData = JSON.stringify(opt).replace(/'/g, "&apos;");
            return `<button class="player-option-btn w-full text-left p-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition mb-2" data-option='${escapedOptionData}'>
                        ${text}
                    </button>`;
        }).join('');

        sceneHtml = `
            <div class="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 animate-fade-in">
                <p class="font-semibold text-blue-800">${prompt}</p>
                <div class="mt-3">${optionsHtml}</div>
                <div class="feedback-container mt-2 h-8 text-sm font-semibold"></div>
            </div>`;
    } else {
        // This is an NPC dialogue scene
        const dialogueSource = scene.dialogue || (scene.options && scene.options[0] ? scene.options[0].text : "");
        const dialogue = resolveLocalized(dialogueSource, lang);
        const avatar = scene.avatar ? `<img src="${scene.avatar}" class="w-12 h-12 rounded-full mr-3">` : '';
        sceneHtml = `
            <div class="mb-4 p-4 flex items-center bg-gray-100 rounded-lg animate-fade-in">
                ${avatar}
                <div>
                    <p class="font-bold">${scene.character}</p>
                    <p>${dialogue}</p>
                </div>
            </div>`;
    }
    sceneContainer.innerHTML += sceneHtml;
    sceneContainer.scrollTop = sceneContainer.scrollHeight;

    if (scene.character !== "You") {
        currentSceneIndex++;
        setTimeout(renderScene, 1200); // Slightly longer delay for reading
    }
}


function handleOptionClick(e) {
    const button = e.target.closest('.player-option-btn');
    if (!button || !isChoiceActive) return;

    isChoiceActive = false; // Disable further clicks until this choice is resolved
    const optionData = JSON.parse(button.dataset.option);
    const lang = getLang();
    const choiceContainer = button.parentElement;
    const feedbackContainer = choiceContainer.nextElementSibling;

    // Visually disable all buttons in this choice set
    choiceContainer.querySelectorAll('.player-option-btn').forEach(btn => {
        btn.disabled = true;
        btn.classList.add('opacity-60');
    });

    if (optionData.isCorrect) {
        button.classList.remove('border-gray-300', 'opacity-60');
        button.classList.add('bg-green-100', 'border-green-500');
        currentSceneIndex++;
        setTimeout(renderScene, 800);
    } else {
        // --- THIS IS THE CORRECTED LOGIC ---
        button.classList.remove('border-gray-300', 'opacity-60');
        button.classList.add('bg-red-100', 'border-red-500');
        const feedback = resolveLocalized(optionData.feedback, lang);
        if (feedback && feedbackContainer) {
            feedbackContainer.innerHTML = `<p class="text-red-600">${feedback}</p>`;
        }

        // After a delay, reset the buttons so the user can try again.
        setTimeout(() => {
            if (feedbackContainer) feedbackContainer.innerHTML = ''; // Clear feedback
            
            choiceContainer.querySelectorAll('.player-option-btn').forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('opacity-60', 'bg-red-100', 'border-red-500');
                btn.classList.add('border-gray-300');
            });
            isChoiceActive = true; // Re-enable choices
        }, 2000); // Wait 2 seconds before resetting
    }
}

export default function renderRoleplaySequence(container, part) {
    partData = part;
    currentSceneIndex = 0;

    const scenario = resolveLocalized(part.scenario);

    container.innerHTML = `
        <div class="p-2 max-w-2xl mx-auto">
            <h3 class="text-lg font-bold mb-3 text-center bg-gray-100 p-2 rounded">${scenario}</h3>
            <div id="scenes-container" class="space-y-4"></div>
        </div>
    `;

    sceneContainer = container.querySelector('#scenes-container');
    sceneContainer.addEventListener('click', handleOptionClick);

    renderScene(); // Start the sequence
}
