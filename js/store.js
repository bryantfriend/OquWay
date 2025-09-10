import { storeItems } from "./data.js";
import { canAfford, deductPoints, showMessage } from "./utilities.js";
import { getText } from "./i18n.js";
import { studentData } from "./config.js";

export function renderStore() {
  const container = document.getElementById("storeItemsContainer");
  container.innerHTML = "";
  storeItems.forEach(item => {
    const div = document.createElement("div");
    div.className = "store-item";
    div.innerHTML = `
      <span class="item-icon">${item.icon}</span>
      <span class="item-name">${getText(item.name)}</span>
      <div class="item-cost">
        ${Object.entries(item.cost).map(([type,amt])=>
          `<div class="cost-point point-${type}"><span class="icon">${{"physical":"💪","cognitive":"🧠","creative":"🎨","social":"🤝"}[type]}</span>${amt}</div>`
        ).join("")}
      </div>
      <button class="buy-btn" data-id="${item.id}">${getText("buyBtn")}</button>
    `;
    const btn = div.querySelector("button");
    btn.disabled = !canAfford(item.cost);
    btn.onclick = () => handlePurchase(item);
    container.appendChild(div);
  });
}

export function handlePurchase(item) {
  if (!canAfford(item.cost)) return showMessage("notEnoughPoints",2000,getText(item.name));
  deductPoints(item.cost);
  showMessage("purchaseSuccess",2000,getText(item.name));
  renderStore();
}

// wire up:
document.addEventListener("DOMContentLoaded", () => {
  const visitBtn = document.getElementById("visitStoreBtn");
  const backBtn = document.getElementById("backToDashboardBtn");
  
  if (visitBtn) {
    visitBtn.addEventListener("click", () => {
      renderStore();
      document.getElementById("storeScreen").classList.add("active");
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      document.getElementById("dashboardScreen").classList.add("active");
    });
  }
});


