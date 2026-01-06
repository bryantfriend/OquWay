import BaseEngine from './BaseEngine.js';

export default class MatchingGameEngine extends BaseEngine {
    static get id() { return 'matchingGame'; }
    static get version() { return '2.0.0'; }

    static get editorSchema() {
        return {
            fields: [
                { key: "title", label: "Instruction Title", type: "text", default: "Match the pairs" },
                {
                    key: "pairs",
                    label: "Pairs (JSON Array: [{word: 'A', match: 'B'}])",
                    type: "json",
                    default: [
                        { word: "Cat", match: "Gato" },
                        { word: "Dog", match: "Perro" },
                        { word: "Sun", match: "Sol" }
                    ]
                }
            ]
        };
    }

    static get defaultConfig() {
        return {
            title: "Match the pairs",
            pairs: [
                { word: "Cat", match: "Gato" },
                { word: "Dog", match: "Perro" }
            ]
        };
    }

    static render({ container, config, context, onComplete }) {
        // 1. Setup HTML Structure
        container.innerHTML = `
        <div class="max-w-4xl mx-auto p-4 bg-white rounded shadow select-none">
            <div class="text-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">${config.title || 'Match the items'}</h2>
                <p class="text-gray-500 text-sm">Tap a left item, then tap a right item to connect.</p>
            </div>
            
            <div class="game-board relative min-h-[400px] border-2 border-dashed border-gray-200 rounded-lg p-6 flex justify-between">
                <div id="left-col" class="flex flex-col gap-4 w-1/3 z-10"></div>
                <!-- SVG Overlay for Lines -->
                <div id="canvas-overlay" class="absolute inset-0 pointer-events-none z-0">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"></svg>
                </div>
                <div id="right-col" class="flex flex-col gap-4 w-1/3 z-10"></div>
            </div>
            
            <div id="feedback-area" class="mt-4 text-center font-bold h-8 text-xl"></div>
        </div>
    `;

        // 2. Prepare Data
        // Check if pairs is array (flat) or object (legacy localized)
        let pairsRaw = config.pairs || [];
        // If it's the legacy localized object {en: [...]}, flatten it for now
        if (!Array.isArray(pairsRaw) && pairsRaw.en) {
            pairsRaw = pairsRaw.en;
        }
        // Fallback
        if (!Array.isArray(pairsRaw)) pairsRaw = [];

        if (pairsRaw.length === 0) {
            container.querySelector('.game-board').innerHTML = '<div class="text-center p-10 text-gray-400 w-full">No pairs defined. Edit configuration.</div>';
            return;
        }

        // Scramble
        const leftItems = pairsRaw.map((p, i) => ({ text: p.word || p.left, id: i }));
        const rightItems = pairsRaw.map((p, i) => ({ text: p.match || p.right || p.translation, matchId: i, id: 100 + i }));
        rightItems.sort(() => Math.random() - 0.5);

        // 3. Mount Logic
        const leftCol = container.querySelector('#left-col');
        const rightCol = container.querySelector('#right-col');
        const svg = container.querySelector('svg');
        const feedback = container.querySelector('#feedback-area');

        // Helper: Create Button
        const createBtn = (item, col, type) => {
            const btn = document.createElement('div');
            btn.className = `p-4 bg-white border-2 border-blue-200 shadow-sm rounded-lg cursor-pointer text-center font-bold text-gray-700 transition-all hover:bg-blue-50 ${type}-item relative z-10`;
            btn.textContent = item.text;
            btn.dataset.id = item.id;
            if (type === 'right') btn.dataset.matchId = item.matchId;
            col.appendChild(btn);
            return btn;
        };

        leftItems.forEach(item => createBtn(item, leftCol, 'left'));
        rightItems.forEach(item => createBtn(item, rightCol, 'right'));

        // State
        let selectedLeft = null;
        let solvedCount = 0;

        // Line Drawer
        const drawConnection = (el1, el2, color) => {
            const svgRect = svg.getBoundingClientRect();
            const r1 = el1.getBoundingClientRect();
            const r2 = el2.getBoundingClientRect();

            const x1 = r1.right - svgRect.left;
            const y1 = r1.top + r1.height / 2 - svgRect.top;
            const x2 = r2.left - svgRect.left;
            const y2 = r2.top + r2.height / 2 - svgRect.top;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', color === 'green' ? '#10B981' : '#EF4444');
            line.setAttribute('stroke-width', '4');
            svg.appendChild(line);
        };

        // Click Handlers
        const handleLeftClick = (e) => {
            if (e.currentTarget.classList.contains('solved')) return;
            if (selectedLeft) selectedLeft.classList.remove('ring-4', 'ring-yellow-400', 'bg-yellow-50');
            selectedLeft = e.currentTarget;
            selectedLeft.classList.add('ring-4', 'ring-yellow-400', 'bg-yellow-50');
        };

        const handleRightClick = (e) => {
            if (!selectedLeft) return;
            if (e.currentTarget.classList.contains('solved')) return;

            const target = e.currentTarget;
            const leftId = parseInt(selectedLeft.dataset.id);
            const rightMatchId = parseInt(target.dataset.matchId);

            if (leftId === rightMatchId) {
                // Correct
                drawConnection(selectedLeft, target, 'green');

                selectedLeft.classList.remove('ring-4', 'ring-yellow-400', 'bg-yellow-50', 'bg-white', 'hover:bg-blue-50');
                selectedLeft.classList.add('bg-green-100', 'border-green-500', 'text-green-800', 'solved');

                target.classList.remove('bg-white', 'hover:bg-blue-50');
                target.classList.add('bg-green-100', 'border-green-500', 'text-green-800', 'solved');

                selectedLeft = null;
                solvedCount++;

                if (solvedCount === pairsRaw.length) {
                    feedback.textContent = "🎉 Awesome! All matched!";
                    feedback.classList.add('text-green-600', 'animate-bounce');
                    if (onComplete) onComplete({ success: true });
                } else {
                    feedback.textContent = "Correct!";
                    feedback.className = "mt-4 text-center font-bold h-8 text-xl text-green-600";
                }
            } else {
                // Wrong
                feedback.textContent = "Try again!";
                feedback.className = "mt-4 text-center font-bold h-8 text-xl text-red-500";

                selectedLeft.classList.remove('ring-4', 'ring-yellow-400', 'bg-yellow-50');
                selectedLeft.classList.add('bg-red-100', 'border-red-400');
                setTimeout(() => {
                    selectedLeft?.classList.remove('bg-red-100', 'border-red-400');
                    selectedLeft = null;
                }, 500);
            }
        };

        leftCol.querySelectorAll('.left-item').forEach(b => b.onclick = handleLeftClick);
        rightCol.querySelectorAll('.right-item').forEach(b => b.onclick = handleRightClick);
    }
}
