// js/AdminPanel/locations/LocationEditor.js
import LocationService from "./LocationService.js";
import PhotoUploader from "../ui/PhotoUploader.js";
import SocialLinksEditor from "./SocialLinksEditor.js";
import { withButtonSpinner } from "../ui/withButtonSpinner.js";
import LocationForm from "./LocationForm.js";

export default class LocationEditor {
  constructor(panelTitle, panelContent, loc = null) {
    this.panelTitle = panelTitle;
    this.panelContent = panelContent;
    this.loc = loc; // null → new location
    this.photoUploader = null;
    this.socialEditor = null;
  }

  async render() {
    this.panelTitle.textContent = this.loc
      ? `Edit: ${this.loc.name}`
      : "Add New Location";

    const form = new LocationForm(this.loc);

    this.panelContent.innerHTML = `
      <div class="bg-white p-6 rounded shadow max-w-xl space-y-4">

        <div id="locationForm">
          ${form.render()}
        </div>

        <div>
          <label class="block font-semibold mb-1">Photo / Logo</label>
          <div id="photoUploaderContainer"></div>
        </div>

        <div>
          <label class="block font-semibold">Social Links</label>
          <div id="socialLinksContainer" class="space-y-2"></div>
        </div>

        <div class="flex gap-4 mt-6">
          <button type="button" id="saveBtn"
                  class="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
            <span>💾 Save</span>
            <svg class="hidden animate-spin h-5 w-5 text-white"
                 xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                    d="M4 12a 8 8 0 0 1 8-8v4l3-3-3-3v4a8 8 0 1 0 0 16 8 8 0 0 1-8-8z"/>
            </svg>
          </button>
          <button type="button" id="cancelBtn"
                  class="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
        </div>
      </div>
    `;

    // Photo uploader
    const existingPhoto = this.loc?.photoUrl || this.loc?.photoDataUrl || "";
    this.photoUploader = new PhotoUploader("photoUploaderContainer", existingPhoto, "locations");
    this.photoUploader.render();

    // Social links editor
    this.socialEditor = new SocialLinksEditor("socialLinksContainer", this.loc?.socialLinks || {});
    await this.socialEditor.render();

    // Cancel
    document.getElementById("cancelBtn")?.addEventListener("click", async () => {
      const { default: LocationsDashboard } = await import("./LocationsDashboard.js");
      const dash = new LocationsDashboard(this.panelTitle, this.panelContent);
      await dash.render();
    });

    // ✅ IMPORTANT: attach the spinner-wrapper ON CLICK, not immediately
    const saveBtn = document.getElementById("saveBtn");
    saveBtn.addEventListener("click", () =>
      withButtonSpinner("saveBtn", () => this.save(), "💾 Save")
    );
  }

  async save() {
    const form = new LocationForm(this.loc);
    if (!form.validate()) return;

    const data = form.getData();
    data.socialLinks =
      this.socialEditor.getLinks?.() ||
      this.socialEditor.collectLinks?.() ||
      {};

    // Upload photo if changed
    const idHint = this.loc?.id || "new";
    const photoUrl = await this.photoUploader.saveImage(idHint);
    if (photoUrl) {
      data.photoUrl = photoUrl;
    }

    if (this.loc?.id) {
      await LocationService.update(this.loc.id, data);
    } else {
      await LocationService.create(data);
    }

    const { default: LocationsDashboard } = await import("./LocationsDashboard.js");
    const dash = new LocationsDashboard(this.panelTitle, this.panelContent);
    await dash.render();
  }
}
