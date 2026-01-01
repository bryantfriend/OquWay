import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { db } from "../firebase-init.js";

export default class UserDetail {
  constructor(panelTitle, panelContent, user, locations, classes, options = {}) {
    this.panelTitle = panelTitle;
    this.panelContent = panelContent;
    this.user = user;
    this.locations = locations;
    this.classes = classes;
    this.assignMode = options.assignMode || false;
  }

  render() {
    this.panelTitle.textContent = this.user.name || "User Details";

    const photo = this.user.photoUrl || "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg";
    const locationName = this.locations.find(l => l.id === this.user.locationId)?.name || "—";
    const className = this.classes.find(c => c.id === this.user.classId)?.name || "—";

    if (!this.assignMode) {
      // --- Normal view mode ---
      this.panelContent.innerHTML = `
        <button id="backBtn" class="text-blue-500 mb-4 hover:underline">← Back</button>
        <div class="bg-white p-6 rounded shadow max-w-xl space-y-3">
          <div class="flex items-center gap-4">
            <img src="${photo}" alt="User Photo" class="w-24 h-24 rounded-full border object-cover" />
            <div>
              <h2 class="text-xl font-semibold">${this.user.name}</h2>
              <p class="text-sm text-gray-500 capitalize">${this.user.role || "—"}</p>
            </div>
          </div>
          <p><strong>Location:</strong> ${locationName}</p>
          <p><strong>Class:</strong> ${className}</p>
          <div>
            <strong>Courses:</strong>
            <ul class="list-disc list-inside text-gray-500">
              <li>Coming soon…</li>
            </ul>
          </div>
          <div class="flex gap-2 mt-4">
            <button id="editBtn" class="bg-yellow-500 text-white px-4 py-2 rounded">✏️ Edit</button>
            <button id="assignBtn" class="bg-blue-500 text-white px-4 py-2 rounded">🔗 Assign</button>
          </div>
        </div>
      `;

      document.getElementById("backBtn").addEventListener("click", async () => {
        const { default: UsersDashboard } = await import("./UsersDashboard.js");
        new UsersDashboard(this.panelTitle, this.panelContent).render();
      });

      document.getElementById("editBtn").addEventListener("click", async () => {
        const { default: UserEditor } = await import("./UserEditor.js");
        new UserEditor(this.panelTitle, this.panelContent, this.user, this.locations, this.classes).render();
      });


      document.getElementById("assignBtn").addEventListener("click", () => {
        new UserDetail(this.panelTitle, this.panelContent, this.user, this.locations, this.classes, { assignMode: true }).render();
      });

    } else {
      // --- Assign mode ---
      this.panelContent.innerHTML = `
        <button id="backBtn" class="text-blue-500 mb-4 hover:underline">← Back</button>
        <div class="bg-white p-6 rounded shadow max-w-xl space-y-4">
          <h2 class="text-xl font-semibold">Assign for ${this.user.name}</h2>

          <label class="block font-semibold">Location</label>
          <select id="assignLocation" class="w-full border px-3 py-2 rounded">
            <option value="">— Select Location —</option>
            ${this.locations.map(l => `<option value="${l.id}" ${l.id === this.user.locationId ? "selected" : ""}>${l.name}</option>`).join("")}
          </select>

          <label class="block font-semibold">Class</label>
          <select id="assignClass" class="w-full border px-3 py-2 rounded">
            <option value="">— Select Class —</option>
            ${this.classes.map(c => `<option value="${c.id}" ${c.id === this.user.classId ? "selected" : ""}>${c.name}</option>`).join("")}
          </select>

          <label class="block font-semibold">Courses</label>
          <p class="text-gray-500 text-sm italic">Course assignment coming soon…</p>

          <div class="flex gap-2 mt-6">
            <button id="saveAssignBtn" class="bg-green-600 text-white px-4 py-2 rounded">💾 Save</button>
            <button id="cancelAssignBtn" class="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
          </div>
        </div>
      `;

      document.getElementById("backBtn").addEventListener("click", async () => {
        const { default: UsersDashboard } = await import("./UsersDashboard.js");
        new UsersDashboard(this.panelTitle, this.panelContent).render();
      });

      document.getElementById("cancelAssignBtn").addEventListener("click", () => {
        new UserDetail(this.panelTitle, this.panelContent, this.user, this.locations, this.classes).render();
      });

      document.getElementById("saveAssignBtn").addEventListener("click", async () => {
        const newLoc = document.getElementById("assignLocation").value || null;
        const newClass = document.getElementById("assignClass").value || null;

        try {
          await updateDoc(doc(db, "users", this.user.id), {
            locationId: newLoc,
            classId: newClass,
          });
          this.user.locationId = newLoc;
          this.user.classId = newClass;
          alert("✅ User assignment updated!");
          new UserDetail(this.panelTitle, this.panelContent, this.user, this.locations, this.classes).render();
        } catch (err) {
          console.error("❌ Failed to update user assignment:", err);
          alert("Failed to update assignment.");
        }
      });
    }
  }
}
