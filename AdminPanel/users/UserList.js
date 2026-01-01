import UserCard from "./UserCard.js";

export default class UserList {
  constructor(panelTitle, panelContent, locations, classes) {
    this.panelTitle = panelTitle;
    this.panelContent = panelContent;
    this.locations = locations;
    this.classes = classes;
    this.users = [];
  }

  render(users) {
    this.users = users;
    this.panelTitle.textContent = "Users";

    this.panelContent.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-4 justify-between items-center">
        <input id="userSearchInput" type="text"
               placeholder="Search by name or email"
               class="border px-3 py-2 rounded w-full md:w-1/3" />
        <select id="userRoleFilter" class="border px-3 py-2 rounded">
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admins</option>
        </select>
        <button id="addUserBtn" class="bg-blue-600 text-white px-3 py-1 rounded">
          + Add User
        </button>
      </div>

      <!-- Desktop Table -->
      <div class="hidden md:block overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead>
            <tr>
              <th class="border-b py-2">Photo</th>
              <th class="border-b py-2">Name</th>
              <th class="border-b py-2">Role</th>
              <th class="border-b py-2">Location</th>
              <th class="border-b py-2">Class</th>
              <th class="border-b py-2">Actions</th>
            </tr>
          </thead>
          <tbody id="userTableBody"></tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div id="userCardsMobile" class="block md:hidden space-y-4"></div>
    `;

    this.renderList(this.users);

    // Filters
    document.getElementById("userSearchInput").addEventListener("input", () => this.applyFilters());
    document.getElementById("userRoleFilter").addEventListener("change", () => this.applyFilters());

    // Add User
    document.getElementById("addUserBtn").addEventListener("click", async () => {
      const { default: UserEditor } = await import("./UserEditor.js");
      new UserEditor(this.panelTitle, this.panelContent, null, this.locations, this.classes).render();
    });
  }

  applyFilters() {
    const search = document.getElementById("userSearchInput").value.toLowerCase();
    const role = document.getElementById("userRoleFilter").value;

    const filtered = this.users.filter((u) => {
      const matchesRole = role ? u.role === role : true;
      const matchesSearch =
        (u.name?.toLowerCase().includes(search)) ||
        (u.email?.toLowerCase().includes(search));
      return matchesRole && matchesSearch;
    });

    this.renderList(filtered);
  }

  renderList(users) {
    // Desktop table
    const tableBody = this.panelContent.querySelector("#userTableBody");
    if (tableBody) {
      tableBody.innerHTML = users
        .map((u) => {
          const photo = u.photoUrl
            ? `<img src="${u.photoUrl}" class="w-8 h-8 rounded-full" />`
            : "";
          const locationName =
            this.locations.find((l) => l.id === u.locationId)?.name || "—";
          const className =
            this.classes.find((c) => c.id === u.classId)?.name || "—";
          return `
            <tr data-user-id="${u.id}" class="hover:bg-blue-50">
              <td class="border-b py-1">${photo}</td>
              <td class="border-b py-1">${u.name}</td>
              <td class="border-b py-1 capitalize">${u.role || "—"}</td>
              <td class="border-b py-1">${locationName}</td>
              <td class="border-b py-1">${className}</td>
              <td class="border-b py-1 space-x-2">
                <button data-action="edit" data-id="${u.id}" class="text-yellow-600 text-sm">Edit</button>
                <button data-action="assign" data-id="${u.id}" class="text-blue-600 text-sm">Assign</button>
                <button data-action="delete" data-id="${u.id}" class="text-red-600 text-sm">Delete</button>
              </td>
            </tr>
          `;
        })
        .join("");

      tableBody.querySelectorAll("button[data-action]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const action = btn.dataset.action;
          this.handleAction(action, id);
        });
      });
    }

    // Mobile cards
    const cardsEl = this.panelContent.querySelector("#userCardsMobile");
    if (cardsEl) {
      cardsEl.innerHTML = users
        .map(
          (u) =>
            new UserCard(
              u,
              this.locations,
              this.classes,
              (user) => this.openDetail(user.id)
            ).render()
        )
        .join("");

      users.forEach((u) => {
        new UserCard(
          u,
          this.locations,
          this.classes,
          (user) => this.openDetail(user.id)
        ).attachEvents(cardsEl);
      });
    }
  }

  async openDetail(userId) {
    const { default: UserDetail } = await import("./UserDetail.js");
    const user = this.users.find((u) => u.id === userId);
    new UserDetail(this.panelTitle, this.panelContent, user, this.locations, this.classes).render();
  }

  async handleAction(action, userId) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return;

  if (action === "edit") {
    const { default: UserEditor } = await import("./UserEditor.js");
    new UserEditor(this.panelTitle, this.panelContent, user, this.locations, this.classes).render();
  }


    if (action === "assign") {
      const { default: UserDetail } = await import("./UserDetail.js");
      new UserDetail(this.panelTitle, this.panelContent, user, this.locations, this.classes, { assignMode: true }).render();
    }

    if (action === "delete") {
      if (confirm(`Delete ${user.name}?`)) {
        const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js");
        const { db } = await import("../firebase-init.js");
        await deleteDoc(doc(db, "users", userId));
        alert("❌ User deleted.");
        this.render(this.users.filter((u) => u.id !== userId));
      }
    }
  }
}
