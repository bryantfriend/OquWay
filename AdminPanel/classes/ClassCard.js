export default class ClassCard {
  constructor(cls, onClick) {
    this.cls = cls;
    this.onClick = onClick;
  }

  render() {
    const hasPhoto = this.cls.photoDataUrl && this.cls.photoDataUrl.trim() !== "";
    const logoHTML = hasPhoto
      ? `<img src="${this.cls.photoDataUrl}" alt="Class Photo" 
               class="w-16 h-16 object-cover rounded border" />`
      : `<div class="w-16 h-16 flex items-center justify-center bg-gray-200 
                   text-xl font-bold text-gray-600">
           ${this.cls.name?.charAt(0) || "C"}
         </div>`;

    return `
      <div class="bg-white p-4 rounded shadow-sm border hover:shadow-md hover:bg-blue-50 cursor-pointer"
           data-class-id="${this.cls.id}">
        <div class="flex items-center gap-4">
          ${logoHTML}
          <div>
            <h3 class="text-lg font-semibold">${this.cls.name || "Unnamed Class"}</h3>
            ${this.cls.loginDisplayName ? `<p class="text-xs text-gray-400 italic">${this.cls.loginDisplayName}</p>` : ""}
            <p class="text-sm text-gray-500">
              ${this.cls.classCode || "No code"} • 
              ${this.cls.isOnline ? "Online" : "Offline"} • 
              ${this.cls.isGroup ? "Group" : "Individual"}
            </p>
            ${this.cls.isArchived
              ? `<span class="inline-block mt-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Archived</span>`
              : ""}
          </div>
        </div>
      </div>
    `;
  }

  attachEvents(container) {
    const el = container.querySelector(`[data-class-id="${this.cls.id}"]`);
    if (el) el.addEventListener("click", () => this.onClick(this.cls));
  }
}
