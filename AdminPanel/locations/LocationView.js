// js/AdminPanel/locations/LocationView.js
export default class LocationView {
  constructor(loc, mode = "full") {
    this.loc = loc;
    this.mode = mode; // "full" | "compact"
  }

  render() {
    if (this.mode === "compact") {
      return this.renderCompact();
    }
    return this.renderFull();
  }

  renderCompact() {
    return `
      <div class="font-bold text-lg">${this.loc.name}</div>
      <div class="text-sm text-gray-600">
        ${this.loc.type || '—'} • ${this.loc.city || '—'}
      </div>
      <div class="text-xs mt-1">
        ${this.loc.isArchived
          ? `<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Archived</span>`
          : `<span class="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>`}
      </div>
    `;
  }

  renderFull() {
    return `
      ${this.loc.photoDataUrl ? `<img src="${this.loc.photoDataUrl}" alt="Logo" class="w-24 h-24 rounded border mb-4" />` : ''}

      <p><strong>Name:</strong> ${this.loc.name || '<em class="text-gray-400">Not provided</em>'}</p>
      <p><strong>Type:</strong> ${this.loc.type || '<em class="text-gray-400">Not provided</em>'}</p>
      <p><strong>City:</strong> ${this.loc.city || '<em class="text-gray-400">Not provided</em>'}</p>
      <p><strong>Region:</strong> ${this.loc.region || '<em class="text-gray-400">Not provided</em>'}</p>
      <p><strong>Address:</strong> ${this.loc.address || '<em class="text-gray-400">Not provided</em>'}</p>
      <p><strong>Contact:</strong> ${this.loc.contact || '<em class="text-gray-400">Not provided</em>'}</p>
      <p><strong>Hours:</strong> ${this.loc.hours || '<em class="text-gray-400">Not provided</em>'}</p>
      <p><strong>Archived:</strong> ${this.loc.isArchived ? "Yes" : "No"}</p>

      ${this.renderSocialLinks()}
    `;
  }

  renderSocialLinks() {
    if (!this.loc.socialLinks || Object.keys(this.loc.socialLinks).length === 0) {
      return '';
    }
    return `
      <div class="mt-4">
        <strong>Social Links:</strong>
        <ul class="list-disc list-inside text-blue-600">
          ${Object.entries(this.loc.socialLinks).map(([platform, url]) => `
            <li><a href="${url}" target="_blank" rel="noopener">${platform}</a></li>
          `).join('')}
        </ul>
      </div>
    `;
  }
}
