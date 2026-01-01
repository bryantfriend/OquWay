// js/AdminPanel/locations/LocationCard.js
import LocationView from "./LocationView.js";

export default class LocationCard {
  constructor(loc, onClick) {
    this.loc = loc;
    this.onClick = onClick;
  }

  render() {
    const view = new LocationView(this.loc, "compact");
    const status = this.loc.isArchived
      ? `<span class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>`
      : `<span class="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Active</span>`;

    const photo =
      this.loc.photoUrl || this.loc.photoDataUrl ||
      "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg";

    return `
      <div class="bg-white rounded shadow p-4 hover:bg-blue-50 cursor-pointer transition"
           data-loc-id="${this.loc.id}">
        <div class="flex items-center gap-4">
          <img src="${photo}" alt="${this.loc.name}" 
               class="w-16 h-16 object-cover rounded border" />
          <div>
            <h3 class="text-lg font-semibold">${this.loc.name}</h3>
            <p class="text-sm text-gray-500">${this.loc.city || "—"} • ${this.loc.type || "—"}</p>
            ${status}
          </div>
        </div>
      </div>
    `;
  }

  attachEvents(container) {
    const cardEl = container.querySelector(`[data-loc-id="${this.loc.id}"]`);
    if (cardEl) {
      cardEl.addEventListener("click", () => this.onClick(this.loc));
    }
  }
}
