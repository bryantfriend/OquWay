import UserService from "./UserService.js";

export default class UserView {
  constructor(panelTitle, panelContent, user, locations = [], classes = []) {
    this.panelTitle = panelTitle;
    this.panelContent = panelContent;
    this.user = user;
    this.locations = locations;
    this.classes = classes;
  }

  render() {
    this.panelTitle.textContent = this.user.name;

    const locationName =
      this.locations.find(l => l.id === this.user.locationId)?.name || "—";
    const className =
      this.classes.find(c => c.id === this.user.classId)?.name || "—";

    this.panelContent.innerHTML = `
      <button id="backBtn" class="text-blue-500 mb-4 hover:underline">← Back</button>
      <div class="bg-white p-6 rounded shadow max-w-xl space-y-3">
        <div class="flex items-center gap-4">
          <img src="${this.user.photoUrl}" 
               alt="User Photo" 
               class="w-20 h-20 rounded-full border object-cover" />
          <div>
            <h2 class="text-2xl font-bold">${this.user.name}</h2>
            <p class="text-gray-600">${this.user.email || "—"}</p>
          </div>
        </div>

        <p><strong>Role:</strong> ${this.user.role}</p>
        <p><strong>Location:</strong> ${locationName}</p>
        <p><strong>Class:</strong> ${className}</p>
        <p><strong>Fruit Password:</strong> ${
          this.user.fruitPassword
            ? this.user.fruitPassword.join(" ")
            : "<span class='text-gray-400 italic'>Not set</span>"
        }</p>

        <div class="flex gap-3 mt-6">
          <button id="editBtn" class="bg-yellow-500 text-white px-4 py-2 rounded">✏️ Edit</button>
          <button id="deleteBtn" class="bg-red-600 text-white px-4 py-2 rounded">🗑️ Delete</button>
        </div>
      </div>
    `;

    document.getElementById("backBtn").addEventListener("click", async () => {
      const { default: UsersDashboard } = await import("./UsersDashboard.js");
      new UsersDashboard(this.panelTitle, this.panelContent, this.locations, this.classes).render();
    });

    document.getElementById("editBtn").addEventListener("click", async () => {
      const { default: UserEditor } = await import("./UserEditor.js");
      new UserEditor(this.panelTitle, this.panelContent, this.user, this.locations, this.classes).render();
    });

    document.getElementById("deleteBtn").addEventListener("click", async () => {
      if (!confirm("Are you sure you want to delete this user?")) return;
      await UserService.remove(this.user.id);
      const { default: UsersDashboard } = await import("./UsersDashboard.js");
      new UsersDashboard(this.panelTitle, this.panelContent, this.locations, this.classes).render();
    });
  }
}
