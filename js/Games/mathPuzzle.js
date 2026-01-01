// Games/mathPuzzle.js
import { registerGame } from "../gamesRegistry.js";

function render(container) {
  container.innerHTML = `
    <div class="p-4">
      <h1>🧠 Math Puzzle</h1>
      <p>Solve this: What is 7 + 5?</p>
      <button id="submitAnswerBtn">Submit Answer</button>
    </div>
  `;
}

function init() {
  // ✅ Only bind after screen is rendered
  const btn = document.getElementById("submitAnswerBtn");
  if (btn) {
    btn.onclick = () => alert("Correct!");
  } else {
    console.warn("Button not found for mathPuzzle");
  }
}

registerGame({
  id: "mathPuzzle",
  titleKey: "mathPuzzleTitle",
  descriptionKey: "mathPuzzleDescription",
  icon: "🧮",
  screenId: "mathPuzzleScreen",
  render: () => {
    const container = document.getElementById("mathPuzzleScreen");
    render(container);
    init(); // ✅ now it's safe
  },
  init: null // or omit if unused
});
