// js/AdminPanel/users/UserCard.js

export default class UserCard {
  constructor(user, locations = [], classes = [], onClick) {
    this.user = user;
    this.locations = locations;
    this.classes = classes;
    this.onClick = onClick;
  }

  render() {
    const photo =
      this.user.photoUrl ||
      "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg";

    const locationName =
      this.locations.find((l) => l.id === this.user.locationId)?.name || "—";

    const className =
      this.classes.find((c) => c.id === this.user.classId)?.name || "—";

    return `
      <div class="bg-white shadow rounded p-4 cursor-pointer hover:bg-blue-50 transition"
           data-user-id="${this.user.id}">
        <div class="flex items-center mb-3">
          <img src="${photo}" alt="${this.user.name}"
               class="w-12 h-12 rounded-full border mr-4">
          <div>
            <div class="font-semibold text-lg">${this.user.name}</div>
            <div class="text-gray-500 text-sm capitalize">${this.user.role}</div>
          </div>
        </div>
        <div class="text-sm text-gray-700 mb-2">
          <strong>Location:</strong> ${locationName}<br>
          <strong>Class:</strong> ${className}
        </div>
      </div>
    `;
  }

  attachEvents(container) {
    const cardEl = container.querySelector(`[data-user-id="${this.user.id}"]`);
    if (cardEl) {
      cardEl.addEventListener("click", () => this.onClick(this.user));
    }
  }
}
