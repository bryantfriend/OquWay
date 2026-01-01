// js/AdminPanel/locations/LocationDetail.js
export default class LocationDetail {
  constructor(panelTitle, panelContent, loc) {
    this.panelTitle = panelTitle;
    this.panelContent = panelContent;
    this.loc = loc;
  }

  render() {
    this.panelTitle.textContent = this.loc.name;

    const photo =
      this.loc.photoUrl ||
      this.loc.photoDataUrl ||
      "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg";

    const status = this.loc.isArchived
      ? `<span class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>`
      : `<span class="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Active</span>`;

    const socialLinksHtml =
      this.loc.socialLinks && Object.keys(this.loc.socialLinks).length > 0
        ? Object.entries(this.loc.socialLinks)
            .map(
              ([platform, url]) => `
              <li>
                <a href="${url}" target="_blank" class="text-blue-600 hover:underline">
                  ${platform}
                </a>
              </li>
            `
            )
            .join("")
        : `<li class="text-gray-500">No social links</li>`;

    this.panelContent.innerHTML = `
      <button id="backBtn" class="text-blue-500 mb-4 hover:underline">← Back</button>
      <div class="bg-white p-6 rounded shadow max-w-xl space-y-4">
        <div class="flex items-center gap-4">
          <img src="${photo}" alt="Location Photo"
               class="w-24 h-24 rounded border object-cover" />
          <div>
            <h2 class="text-xl font-semibold">${this.loc.name}</h2>
            ${status}
          </div>
        </div>

        <p><strong>Type:</strong> ${this.loc.type || "—"}</p>
        <p><strong>City:</strong> ${this.loc.city || "—"}</p>
        <p><strong>Region:</strong> ${this.loc.region || "—"}</p>
        <p><strong>Address:</strong> ${this.loc.address || "—"}</p>
        <p><strong>Contact:</strong> ${this.loc.contact || "—"}</p>
        <p><strong>Hours:</strong> ${this.loc.hours || "—"}</p>

        <div>
          <strong>Social Links:</strong>
          <ul class="list-disc list-inside mt-1">
            ${socialLinksHtml}
          </ul>
        </div>
        
        <div class="flex gap-2 mt-4">
          <button id="editBtn" class="bg-yellow-500 text-white px-4 py-2 rounded">✏️ Edit</button>
          <button id="deleteBtn" class="bg-red-600 text-white px-4 py-2 rounded">🗑️ Delete</button>
        </div>
      </div>
    `;

    // Handlers
    document.getElementById("backBtn")?.addEventListener("click", async () => {
      const { default: LocationsDashboard } = await import("./LocationsDashboard.js");
      new LocationsDashboard(this.panelTitle, this.panelContent).render();
    });

    document.getElementById("editBtn")?.addEventListener("click", async () => {
      const { default: LocationEditor } = await import("./LocationEditor.js");
      new LocationEditor(this.panelTitle, this.panelContent, this.loc).render();
    });

    document.getElementById("deleteBtn")?.addEventListener("click", async () => {
      if (confirm("Are you sure you want to delete this location?")) {
        const { default: LocationService } = await import("./LocationService.js");
        await LocationService.remove(this.loc.id);

        const { default: LocationsDashboard } = await import("./LocationsDashboard.js");
        new LocationsDashboard(this.panelTitle, this.panelContent).render();
      }
    });
  }
}
