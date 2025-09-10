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

function renderScene() {
    if (!partData || !sceneContainer) return;
    const lang = getLang();
    const scene = partData.scenes[currentSceneIndex];

    if (!scene) {
        // End of sequence, maybe show a summary or nothing
        return;
    }

    let sceneHtml = '';
    if (scene.character === "You") {
        // This is a player choice scene
        const prompt = resolveLocalized(scene.prompt, lang);
        const optionsHtml = scene.options.map(opt => {
            const text = resolveLocalized(opt.text, lang);
            // Use JSON stringify and escape single quotes for the HTML attribute
            const escapedOptionData = JSON.stringify(opt).replace(/'/g, "&apos;");
            return `<button class="player-option-btn w-full text-left p-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition mb-2" data-option='${escapedOptionData}'>
                        ${text}
                    </button>`;
        }).join('');

        sceneHtml = `
            <div class="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400">
                <p class="font-semibold text-blue-800">${prompt}</p>
                <div class="mt-3">${optionsHtml}</div>
                <div class="feedback-container mt-2 h-8 text-sm font-semibold"></div>
            </div>`;
    } else {
        // This is an NPC dialogue scene
        const dialogue = resolveLocalized(scene.dialogue, lang);
        const avatar = scene.avatar ? `<img src="${scene.avatar}" class="w-12 h-12 rounded-full mr-3">` : '';
        sceneHtml = `
            <div class="mb-4 p-4 flex items-center bg-gray-100 rounded-lg">
                ${avatar}
                <div>
                    <p class="font-bold">${scene.character}</p>
                    <p>${dialogue}</p>
                </div>
            </div>`;
    }
    sceneContainer.innerHTML += sceneHtml; // Append the new scene
    sceneContainer.scrollTop = sceneContainer.scrollHeight; // Auto-scroll to the bottom

    if (scene.character !== "You") {
        // If it's NPC dialogue, automatically move to the next scene
        currentSceneIndex++;
        setTimeout(renderScene, 500); // Small delay for effect
    }
}


function handleOptionClick(e) {
    const button = e.target.closest('.player-option-btn');
    if (!button) return;

    // Now this will parse correctly
    const optionData = JSON.parse(button.dataset.option); 
    const lang = getLang();
    const feedbackContainer = button.closest('.p-4').querySelector('.feedback-container');

    // Disable all buttons in this choice set
    button.parentElement.querySelectorAll('.player-option-btn').forEach(btn => {
        btn.disabled = true;
        btn.classList.add('opacity-60');
    });

    if (optionData.isCorrect) {
        button.classList.remove('border-gray-300');
        button.classList.add('bg-green-100', 'border-green-500');
        currentSceneIndex++;
        setTimeout(renderScene, 800); // Proceed after a short delay
    } else {
        button.classList.remove('border-gray-300');
        button.classList.add('bg-red-100', 'border-red-500');
        const feedback = resolveLocalized(optionData.feedback, lang);
        if (feedback && feedbackContainer) {
            feedbackContainer.innerHTML = `<p class="text-red-600">${feedback}</p>`;
        }
    }
}

export default function renderRoleplaySequence(container, part) {
    partData = part;
    currentSceneIndex = 0;

    const scenario = resolveLocalized(part.scenario);

    container.innerHTML = `
        <div class="p-2">
            <h3 class="text-lg font-bold mb-3 text-center bg-gray-100 p-2 rounded">${scenario}</h3>
            <div id="scenes-container" class="space-y-4"></div>
        </div>
    `;

    sceneContainer = container.querySelector('#scenes-container');
    sceneContainer.addEventListener('click', handleOptionClick);

    renderScene(); // Start the sequence
}