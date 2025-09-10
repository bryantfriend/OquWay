import { studentData } from '../config.js';
import { navigateTo } from '../router.js';

export function renderStoreScreen(container) {
  container.innerHTML = `
    <div class="p-4">
      <h1 class="text-xl font-bold mb-4" data-i18n="storeTitle">Store</h1>

      <div class="student-info flex items-center gap-4 mb-4">
        <img id="store-avatar" src="${studentData.avatar}" alt="Avatar" class="w-20 h-20 rounded-full border" />
        <div>
          <div id="store-student-name" class="font-semibold text-lg">${studentData.name}</div>
          <div class="intention-points-small grid grid-cols-2 gap-2 mt-2">
            <div class="point-type">💪 <span id="storePhysicalPoints">${studentData.points.physical}</span></div>
            <div class="point-type">🧠 <span id="storeCognitivePoints">${studentData.points.cognitive}</span></div>
            <div class="point-type">🎨 <span id="storeCreativePoints">${studentData.points.creative}</span></div>
            <div class="point-type">🤝 <span id="storeSocialPoints">${studentData.points.social}</span></div>
          </div>
        </div>
      </div>

      <div id="storeItemsContainer" class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        <!-- Dynamic store items will go here -->
      </div>

      <button id="backToDashboardBtn"
              class="bg-gray-500 text-white px-4 py-2 rounded w-full"
              data-i18n="backToDashboardBtn">Back</button>
    </div>
  `;

  document.getElementById("backToDashboardBtn")
    .addEventListener("click", () => navigateTo("dashboard"));

  renderStoreItems();
}

function renderStoreItems() {
  const container = document.getElementById("storeItemsContainer");
  container.innerHTML = "";

  // Placeholder store items (you can replace this with Firestore-based content)
  const storeItems = [
    { id: 1, name: "Magic Wand", icon: "🪄", cost: 5 },
    { id: 2, name: "Treasure Map", icon: "🗺️", cost: 7 },
    { id: 3, name: "Flying Shoes", icon: "👟", cost: 10 },
  ];

  storeItems.forEach(item => {
    const card = document.createElement("div");
    card.className = "border p-3 rounded shadow hover:scale-105 transition";
    card.innerHTML = `
      <div class="text-3xl text-center mb-1">${item.icon}</div>
      <div class="text-center text-sm font-medium">${item.name}</div>
      <div class="text-center text-xs mt-1 text-gray-600">${item.cost} pts</div>
    `;
    card.addEventListener("click", () => {
      alert(`You tried to buy "${item.name}" — Store functionality coming soon!`);
    });
    container.appendChild(card);
  });
}
