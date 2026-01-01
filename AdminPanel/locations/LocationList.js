// js/AdminPanel/locations/LocationList.js
import LocationCard from "./LocationCard.js";

export default class LocationList {
  constructor(panelTitle, panelContent, locations) {
    this.panelTitle = panelTitle;
    this.panelContent = panelContent;
    this.locations = locations;
    this.currentFilter = "active"; // default
  }

  render() {
    this.panelTitle.textContent = "Locations";

    this.panelContent.innerHTML = `
      <div class="mb-4 flex flex-wrap justify-between items-center">
        <div class="flex gap-2 items-center">
          <label class="font-medium">Filter:</label>
          <select id="filterSelect" class="border px-2 py-1 rounded">
            <option value="active" ${this.currentFilter === "active" ? "selected" : ""}>Active</option>
            <option value="inactive" ${this.currentFilter === "inactive" ? "selected" : ""}>Inactive</option>
            <option value="all" ${this.currentFilter === "all" ? "selected" : ""}>All</option>
          </select>
        </div>
        <button id="addLocationBtn" class="bg-blue-600 text-white px-3 py-1 rounded">+ Add Location</button>
      </div>
      <div id="locList" class="grid gap-4"></div>
    `;

    // Initial render
    this.renderList();

    // Event: filter
    document.getElementById("filterSelect").addEventListener("change", (e) => {
      this.currentFilter = e.target.value;
      this.renderList();
    });

    // Event: add new
    document.getElementById("addLocationBtn").addEventListener("click", async () => {
      const { default: LocationEditor } = await import("./LocationEditor.js");
      new LocationEditor(this.panelTitle, this.panelContent).render();
    });
  }

  renderList() {
    const listEl = this.panelContent.querySelector("#locList");
    if (!listEl) return;

    let filtered = this.locations;
    if (this.currentFilter === "active") {
      filtered = this.locations.filter((l) => !l.isArchived);
    } else if (this.currentFilter === "inactive") {
      filtered = this.locations.filter((l) => l.isArchived);
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `<p class="text-gray-500">No locations found.</p>`;
      return;
    }

    listEl.innerHTML = filtered.map((loc) => new LocationCard(loc, (l) => this.openLocationDetail(l)).render()).join("");

    // Attach events
    filtered.forEach((loc) => {
      new LocationCard(loc, (l) => this.openLocationDetail(l)).attachEvents(listEl);
    });
  }

  async openLocationDetail(loc) {
    const { default: LocationDetail } = await import("./LocationDetail.js");
    new LocationDetail(this.panelTitle, this.panelContent, loc).render();
  }
}
