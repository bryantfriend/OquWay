// js/steps/renderRoleplay.js

function resolveLocalized(val) {
    if (!val) return "";
    if (typeof val === "string") return val;
    
    const lang = (localStorage.getItem("language") || "en").toLowerCase();
    const normalizedLang = lang === "ky" ? "kg" : lang;

    return val[normalizedLang] ?? val.en ?? Object.values(val)[0] ?? "";
}

export default function renderRoleplay(container, part) {
    const promptText = resolveLocalized(part.prompt);
    const options = resolveLocalized(part.options) || [];
    const feedbackText = resolveLocalized(part.feedback); // Use 'feedback'
    const correctIndex = part.correctOption; // Get correct index

    // Add a data-index attribute to each button
    const optionsHtml = options.map((opt, index) => `
        <li>
            <button class="w-full text-left bg-white border border-gray-300 hover:bg-yellow-50 text-gray-800 px-4 py-3 rounded-lg shadow-sm transition-colors text-lg" data-index="${index}">
                ${opt}
            </button>
        </li>
    `).join('');

    container.innerHTML = `
        <div class="p-4 animate-fade-in">
            <div class="bg-yellow-50 p-6 rounded-xl border-2 border-yellow-200">
                <h3 class="text-2xl font-bold text-yellow-800 mb-4 text-center">🎭 Roleplay</h3>
                <p class="text-lg text-gray-800 text-center mb-6">${promptText}</p>
                <ul id="roleplay-options" class="space-y-3">${optionsHtml}</ul>
                <div id="feedback-container" class="mt-4 p-4 rounded-lg text-center font-semibold"></div>
            </div>
        </div>
    `;

    const optionsContainer = container.querySelector('#roleplay-options');
    const feedbackContainer = container.querySelector('#feedback-container');

    optionsContainer.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const selectedIndex = parseInt(button.dataset.index, 10);
        
        optionsContainer.querySelectorAll('button').forEach(btn => {
            btn.disabled = true;
            btn.classList.add('opacity-50');
        });

        if (selectedIndex === correctIndex) {
            button.classList.remove('bg-white', 'border-gray-300');
            button.classList.add('bg-green-500', 'text-white', 'border-green-500');
            feedbackContainer.className += ' bg-green-100 text-green-800';
            feedbackContainer.textContent = feedbackText;
        } else {
            button.classList.remove('bg-white', 'border-gray-300');
            button.classList.add('bg-red-500', 'text-white', 'border-red-500');
            feedbackContainer.className += ' bg-red-100 text-red-800';
            feedbackContainer.textContent = "That's not the best choice here. Try to be more formal.";

            // Also highlight the correct one
            const correctButton = optionsContainer.querySelector(`[data-index="${correctIndex}"]`);
            if (correctButton) {
                 correctButton.classList.remove('bg-white', 'border-gray-300');
                 correctButton.classList.add('bg-green-500', 'text-white', 'border-green-500');
            }
        }
    });
}