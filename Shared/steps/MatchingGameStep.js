import BaseStep from './BaseStep.js';
import { resolveLocalized } from './utils.js';

export default class MatchingGameStep extends BaseStep {
    static get id() { return 'matchingGame'; }
    static get version() { return '1.0.0'; }
    static get displayName() { return 'Matching Game'; }
    static get description() { return 'Practice vocabulary matching.'; }
    static get category() { return 'game'; }

    static get editorSchema() {
        return {
            fields: [
                { key: "title", label: "Step Title", type: "localized-text", default: { en: "Matching Game" } },
                { key: "instruction", label: "Instruction", type: "localized-rich-text", default: { en: "Match the pairs" } },
                { key: "description", label: "Description (Internal)", type: "text", default: "Matching game for vocabulary" },
                {
                    key: "pairs",
                    label: "Pairs",
                    type: "array",
                    itemSchema: [
                        { key: "left", label: "Term (Source)", type: "text", default: "" },
                        { key: "right", label: "Match (Target)", type: "localized-text", default: {} }
                    ],
                    default: [{ left: "Cat", right: { en: "Gato" } }, { left: "Dog", right: { en: "Perro" } }]
                }
            ]
        };
    }

    static get defaultConfig() {
        return {
            title: "Matching Game",
            instruction: "Match the terms correctly.",
            description: "Matching vocabulary pairs.",
            pairs: [
                { left: "Apple", right: "Manzana" },
                { left: "Banana", right: "Plátano" }
            ]
        };
    }

    static render({ container, config, onComplete, context }) {
        const pairs = config.pairs || [];
        // Support old strings or new localized objects
        const instruction = resolveLocalized(config.instruction, context?.lang);

        // Shuffle
        const lefts = pairs.map((p, i) => ({ text: p.left, id: i }));
        const rights = pairs.map((p, i) => ({
            text: resolveLocalized(p.right, context?.lang),
            id: i
        }));

        // Simple shuffle
        lefts.sort(() => Math.random() - 0.5);
        rights.sort(() => Math.random() - 0.5);

        // Add CSS for shake animation
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            .shake { animation: shake 0.4s ease-in-out; }
        `;
        container.appendChild(style);

        container.innerHTML += `
            <div class="flex flex-col h-full justify-between">
                <!-- Top: Instructions -->
                <div class="text-center font-bold text-xl text-gray-800 mb-6 px-4">
                    ${instruction}
                </div>

                <!-- Middle: Game Grid -->
                <div class="flex-1 overflow-y-auto px-4 flex items-center justify-center">
                    <div class="grid grid-cols-2 gap-4 w-full max-w-2xl">
                        <div class="space-y-3" id="left-col"></div>
                        <div class="space-y-3" id="right-col"></div>
                    </div>
                </div>

                <!-- Bottom: Feedback -->
                <div id="match-msg" class="text-center h-12 flex items-center justify-center font-bold text-lg mt-4 w-full"></div>
            </div>
        `;

        const leftCol = container.querySelector('#left-col');
        const rightCol = container.querySelector('#right-col');
        const msg = container.querySelector('#match-msg');



        let selectedItem = null; // { id, side, element }
        let matchedCount = 0;

        const handleSelection = (id, side, btn) => {
            // Unselect if clicking same item
            if (selectedItem && selectedItem.side === side && selectedItem.id === id) {
                clearSelection();
                return;
            }

            // Change selection if clicking distinct item on same side
            if (selectedItem && selectedItem.side === side) {
                clearSelectionVisuals();
                selectItem(id, side, btn);
                return;
            }

            // First selection
            if (!selectedItem) {
                selectItem(id, side, btn);
                return;
            }

            // Check Match (Opposite sides)
            if (selectedItem.id === id) {
                // Correct
                handleCorrect(btn, selectedItem.element);
            } else {
                // Incorrect
                handleIncorrect(btn, selectedItem.element);
            }
        };

        const selectItem = (id, side, btn) => {
            selectedItem = { id, side, element: btn };
            btn.classList.remove('bg-white', 'border-gray-200');
            btn.classList.add('ring-4', 'ring-blue-400', 'bg-blue-100', 'border-blue-500');
        };

        const clearSelection = () => {
            clearSelectionVisuals();
            selectedItem = null;
        };

        const clearSelectionVisuals = () => {
            if (!selectedItem) return;
            const btn = selectedItem.element;
            btn.classList.remove('ring-4', 'ring-blue-400', 'bg-blue-100', 'border-blue-500');
            btn.classList.add('bg-white', 'border-gray-200');
        };

        const handleCorrect = (btn1, btn2) => {
            const successStyle = ['bg-green-100', 'border-green-500', 'text-green-800', 'opacity-50', 'pointer-events-none'];

            // Remove selection styles
            btn1.classList.remove('ring-4', 'ring-blue-400', 'bg-blue-100', 'border-blue-500', 'bg-white', 'border-gray-200');
            btn2.classList.remove('ring-4', 'ring-blue-400', 'bg-blue-100', 'border-blue-500', 'bg-white', 'border-gray-200');

            // Add success
            btn1.classList.add(...successStyle);
            btn2.classList.add(...successStyle);

            matchedCount++;
            msg.className = "text-center h-12 flex items-center justify-center font-bold text-lg mt-4 w-full text-green-600 animate-bounce";
            msg.textContent = "Correct Match! 🎉";

            selectedItem = null;

            setTimeout(() => {
                msg.textContent = "";
                msg.className = "text-center h-12 flex items-center justify-center font-bold text-lg mt-4 w-full";

                if (matchedCount === pairs.length) {
                    msg.className = "text-center h-12 flex items-center justify-center font-bold text-lg mt-4 w-full text-green-600";
                    msg.textContent = "Excellent! All pairs matched.";
                    if (onComplete) setTimeout(() => onComplete({ success: true }), 1000);
                }
            }, 1000);
        };

        const handleIncorrect = (btn1, btn2) => {
            // Shake both
            btn1.classList.add('bg-red-100', 'border-red-400', 'shake');
            btn2.classList.add('bg-red-100', 'border-red-400', 'shake');

            msg.className = "text-center h-12 flex items-center justify-center font-bold text-lg mt-4 w-full text-red-500";
            msg.textContent = "Not a match. Try again.";

            // Clear selection immediately (so they have to select again)
            selectedItem = null;

            setTimeout(() => {
                // Reset styles
                btn1.classList.remove('bg-red-100', 'border-red-400', 'shake');
                btn2.classList.remove('bg-red-100', 'border-red-400', 'shake');

                // Restore default look if not matched (which they aren't)
                // NOTE: We cleared selectedItem, so we must reset visual state of BOTH buttons to default
                // But wait, btn2 was the 'selected' one, it had blue ring. We need to clear that too.
                btn1.classList.remove('ring-4', 'ring-blue-400', 'bg-blue-100', 'border-blue-500');
                btn2.classList.remove('ring-4', 'ring-blue-400', 'bg-blue-100', 'border-blue-500');

                btn1.classList.add('bg-white', 'border-gray-200');
                btn2.classList.add('bg-white', 'border-gray-200');

                msg.textContent = "";
            }, 800);
        };

        const createBtn = (item, side, col) => {
            const btn = document.createElement('button');
            btn.className = "w-full p-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:border-blue-300 hover:bg-blue-50 transition font-medium text-gray-700 active:scale-95 flex items-center justify-center min-h-[80px]";

            // Check if Image
            if (item.text && (item.text.startsWith('http') || item.text.startsWith('data:'))) {
                btn.innerHTML = `<img src="${item.text}" class="max-h-24 max-w-full object-contain pointer-events-none">`;
            } else {
                btn.textContent = item.text;
            }

            btn.dataset.id = item.id;
            btn.onclick = () => {
                if (btn.classList.contains('opacity-50')) return;
                handleSelection(item.id, side, btn);
            };
            col.appendChild(btn);
        };

        lefts.forEach(item => createBtn(item, 'left', leftCol));
        rights.forEach(item => createBtn(item, 'right', rightCol));
    }
}
