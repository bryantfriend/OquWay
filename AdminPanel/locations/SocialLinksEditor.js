// js/AdminPanel/locations/SocialLinksEditor.js
let SOCIAL_PLATFORMS = [];

export default class SocialLinksEditor {
  constructor(containerId, initialLinks = {}) {
    this.containerId = containerId;
    this.initialLinks = initialLinks;
  }

  async render() {
    await this.loadSocialPlatforms();

    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Build initial rows
    container.innerHTML = this.buildExistingRows();

    // Add button
    const addBtn = document.createElement("button");
    addBtn.textContent = "+ Add Link";
    addBtn.type = "button";
    addBtn.className =
      "bg-blue-500 text-white px-3 py-1 rounded text-sm mt-2";
    addBtn.addEventListener("click", () => this.addRow(container));

    container.appendChild(addBtn);

    // Hook up remove buttons
    container.querySelectorAll(".remove-social").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        e.target.closest(".flex")?.remove()
      );
    });
  }

  buildExistingRows() {
    return Object.entries(this.initialLinks)
      .map(
        ([platform, url]) => `
        <div class="flex items-center gap-2">
          <select class="border px-2 py-1 rounded social-platform-select">
            ${SOCIAL_PLATFORMS.map(
              (p) =>
                `<option value="${p.name}" ${
                  p.name === platform ? "selected" : ""
                }>${p.name}</option>`
            ).join("")}
          </select>
          <input type="url" value="${url}" 
                 class="border px-2 py-1 rounded w-full social-url-input" 
                 placeholder="https://...">
          <button type="button" class="text-red-600 remove-social">✖</button>
        </div>
      `
      )
      .join("");
  }

  addRow(container) {
    const row = document.createElement("div");
    row.className = "flex items-center gap-2";

    const select = document.createElement("select");
    select.className = "border px-2 py-1 rounded social-platform-select";
    SOCIAL_PLATFORMS.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.name;
      opt.textContent = p.name;
      select.appendChild(opt);
    });

    const input = document.createElement("input");
    input.type = "url";
    input.placeholder = "https://...";
    input.className = "border px-2 py-1 rounded w-full social-url-input";

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✖";
    removeBtn.type = "button";
    removeBtn.className = "text-red-600 remove-social";
    removeBtn.addEventListener("click", () => row.remove());

    row.appendChild(select);
    row.appendChild(input);
    row.appendChild(removeBtn);

    // Insert above the add button (last child is addBtn)
    const addBtn = container.querySelector("button:last-of-type");
    if (addBtn) {
      container.insertBefore(row, addBtn);
    } else {
      container.appendChild(row);
    }
  }

  getLinks() {
    const container = document.getElementById(this.containerId);
    const socialLinks = {};
    container
      .querySelectorAll(".social-platform-select")
      .forEach((selectEl) => {
        const platform = selectEl.value;
        const urlInput = selectEl
          .closest("div")
          ?.querySelector(".social-url-input");
        const url = urlInput?.value.trim();
        if (platform && url && /^https?:\/\//i.test(url)) {
          socialLinks[platform] = url;
        }
      });
    return socialLinks;
  }

  // ✅ Alias for backward compatibility
  collectLinks() {
    return this.getLinks();
  }

  async loadSocialPlatforms() {
    if (SOCIAL_PLATFORMS.length > 0) return;
    try {
      const res = await fetch("/AdminPanel/data/socialPlatforms.json");
      SOCIAL_PLATFORMS = await res.json();
    } catch (err) {
      console.error("❌ Failed to load social platform list", err);
      SOCIAL_PLATFORMS = [];
    }
  }
}
