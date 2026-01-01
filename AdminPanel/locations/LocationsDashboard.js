// js/AdminPanel/locations/LocationsDashboard.js
import LocationService from "./LocationService.js";
import LocationList from "./LocationList.js";
import { showGlobalLoader, hideGlobalLoader } from "../utilities.js";

export default class LocationsDashboard {
  constructor(panelTitle, panelContent) {
    this.panelTitle = panelTitle;
    this.panelContent = panelContent;
    this.locations = [];
  }

  async render() {
    showGlobalLoader("Loading Locations...");

    try {
      this.locations = await LocationService.getAll();
    } catch (err) {
      console.error("❌ Failed to fetch locations", err);
      this.panelContent.innerHTML =
        `<p class="text-red-600">Failed to load locations.</p>`;
      hideGlobalLoader();
      return;
    }

    hideGlobalLoader();

    this.panelTitle.textContent = "Locations";

    this.panelContent.innerHTML = `
      <div class="mb-4 flex flex-wrap justify-between items-center">
        <div class="flex gap-2 items-center">
          <label class="font-medium">Filter:</label>
          <select id="filterSelect" class="border px-2 py-1 rounded">
            <option value="active" selected>Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </select>
        </div>
        <button id="addLocationBtn" class="bg-blue-600 text-white px-3 py-1 rounded">+ Add Location</button>
      </div>
      <div id="locList" class="grid gap-4"></div>
    `;

    // Build list
    this.list = new LocationList(this.panelTitle, this.panelContent, this.locations);
    this.list.render();

    // Hook up filter dropdown
    document.getElementById("filterSelect").addEventListener("change", (e) => {
      this.list.currentFilter = e.target.value;
      this.list.renderList();
    });

    // Hook up add new
    document.getElementById("addLocationBtn").addEventListener("click", async () => {
      const { default: LocationEditor } = await import("./LocationEditor.js");
      new LocationEditor(this.panelTitle, this.panelContent).render();
    });
  }
}
