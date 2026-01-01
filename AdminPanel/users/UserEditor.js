// ✅ 1. IMPORT THE FUNCTIONS WE NEED
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  arrayUnion, // To add to an array
  arrayRemove, // To remove from an array
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { db } from "../firebase-init.js";
import { withButtonSpinner, spinnerButton } from "../ui/withButtonSpinner.js";
import PhotoUploader from "../ui/PhotoUploader.js";

export default class UserEditor {
  constructor(panelTitle, panelContent, user = null, locations = [], classes = []) {
    this.panelTitle = panelTitle;
    this.panelContent = panelContent;
    this.user = user;
    this.locations = locations;
    this.classes = classes;
    this.photoUploader = null;
  }

  async render() {
    this.panelTitle.textContent = this.user ? `Edit: ${this.user.name}` : "Add New User";

    this.panelContent.innerHTML = `
      <div class="bg-white p-6 rounded shadow max-w-xl space-y-3">

        <label class="block font-semibold">Name <span class="text-red-500">*</span></label>
        <input id="userName" class="w-full border px-3 py-2 rounded mb-1"
               value="${this.user?.name || ""}">
        <p id="errorName" class="text-red-500 text-sm hidden">Name is required</p>

        <label class="block font-semibold">Role <span class="text-red-500">*</span></label>
        <select id="userRole" class="w-full border px-3 py-2 rounded mb-1">
          <option value="">Select Role</option>
          <option value="student" ${this.user?.role === "student" ? "selected" : ""}>Student</option>
          <option value="teacher" ${this.user?.role === "teacher" ? "selected" : ""}>Teacher</option>
          <option value="admin" ${this.user?.role === "admin" ? "selected" : ""}>Admin</option>
        </select>
        <p id="errorRole" class="text-red-500 text-sm hidden">Role is required</p>

        <label class="block font-semibold">Location</label>
        <select id="userLocation" class="w-full border px-3 py-2 rounded mb-1">
          <option value="">— Select Location —</option>
          ${this.locations.map(l => `<option value="${l.id}" ${l.id === this.user?.locationId ? "selected" : ""}>${l.name}</option>`).join("")}
        </select>

        <label class="block font-semibold">Class</label>
        <select id="userClass" class="w-full border px-3 py-2 rounded mb-1">
          <option value="">— Select Class —</option>
          ${this.classes.map(c => `<option value="${c.id}" ${c.id === this.user?.classId ? "selected" : ""}>${c.name}</option>`).join("")}
        </select>

        <div id="photoUploaderContainer" class="mb-3"></div>

        ${this.user?.role === "student" ? `
  <div class="mt-4 p-3 border rounded bg-blue-50">
    <label class="block font-semibold mb-1">
      Emoji Password (4 emojis)
    </label>

    <div class="flex gap-2 mb-2">
      <input 
        id="userPassword" 
        class="border px-3 py-2 rounded w-full font-mono tracking-wide text-lg"
        value="${this.user?.fruitPassword?.join('') || ''}"
        placeholder="Click emojis below..." 
        readonly
      >
      <button 
        id="resetPasswordBtn"
        class="bg-red-400 hover:bg-red-500 text-white px-3 py-2 rounded"
        title="Clear password"
      >
        ✖
      </button>
    </div>

    <div id="emojiPicker" class="grid grid-cols-6 gap-2 mt-2">
      ${["🍎","🍉","🍌","🍓","🍍","🥭","🥝","🍊","🍒"]
        .map(e => `
          <button class="emoji-btn text-2xl p-1 bg-white border rounded hover:bg-gray-100">
            ${e}
          </button>
        `).join('')}
    </div>

    <p class="text-xs mt-1 text-gray-600">
      Students enter these 4 emojis to log in.
    </p>
  </div>
` : ''}



        <div class="flex gap-4 mt-6">
          ${spinnerButton("saveBtn", "💾 Save", "green")}
          <button id="cancelBtn" 
                  class="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded transition">
            Cancel
          </button>
        </div>
      </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
      #saveBtn span { min-width: 50px; display: inline-block; }
      #saveBtn svg { width: 1.25rem; height: 1.25rem; }
    `;
    document.head.appendChild(style);

    this.photoUploader = new PhotoUploader("photoUploaderContainer", this.user?.photoUrl || "", "users");
    this.photoUploader.render();
    
    const roleSelect = document.getElementById("userRole");
    roleSelect.addEventListener("change", () => {
      if (roleSelect.value === "student") {
        this.render(); // re-render the editor to show password UI
      } else {
        this.render(); // re-render to hide password UI
      }
    });


    document.getElementById("saveBtn")?.addEventListener("click", () => {
      withButtonSpinner("saveBtn", () => this.save(), "💾 Save");
    });

    document.getElementById("cancelBtn").addEventListener("click", async () => {
      const { default: UsersDashboard } = await import("./UsersDashboard.js");
      new UsersDashboard(this.panelTitle, this.panelContent).render();
    });
    
    // --- Password Emoji Picker Logic ---
    const pwdInput = document.getElementById("userPassword");
    const emojiButtons = this.panelContent.querySelectorAll(".emoji-btn");

    emojiButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const emoji = btn.textContent.trim();
        if (pwdInput.value.length < 8) { // each emoji is 2 chars in UTF-16
          pwdInput.value += emoji;
        }
      });
    });

    document.getElementById("resetPasswordBtn")?.addEventListener("click", () => {
      pwdInput.value = "";
    });

  }

  // ✅ 2. THIS SAVE METHOD IS NEW AND PERFORMS THE 3-STEP UPDATE
  async save() {
    const nameInput = document.getElementById("userName");
    const roleInput = document.getElementById("userRole");
    let isValid = true;

    // --- Validation (Unchanged) ---
    if (!nameInput.value.trim()) {
      document.getElementById("errorName").classList.remove("hidden");
      nameInput.classList.add("border-red-500");
      isValid = false;
    } else {
      document.getElementById("errorName").classList.add("hidden");
      nameInput.classList.remove("border-red-500");
    }

    if (!roleInput.value) {
      document.getElementById("errorRole").classList.remove("hidden");
      roleInput.classList.add("border-red-500");
      isValid = false;
    } else {
      document.getElementById("errorRole").classList.add("hidden");
      roleInput.classList.remove("border-red-500");
    }

    if (!isValid) return;

    // --- Get Data ---
    const newClassId = document.getElementById("userClass").value || null;
    const oldClassId = this.user?.classId || null;
    const userId = this.user?.id || null; // Will be null for a new user

    const data = {
      name: nameInput.value.trim(),
      role: roleInput.value,
      locationId: document.getElementById("userLocation").value || null,
      classId: newClassId,
    };
    
    // --- Emoji Password ---
    if (roleInput.value === "student") {
      const pwd = document.getElementById("userPassword").value;

      // Convert string "🍎🍉🍌🍓" → ["🍎","🍉","🍌","🍓"]
      const emojis = [...pwd.matchAll(/[\u{1F300}-\u{1FAFF}]/gu)].map(m => m[0]);

      if (emojis.length === 4) {
        data.fruitPassword = emojis;
      } else {
        data.fruitPassword = this.user?.fruitPassword || []; // keep previous
      }
    }


    const photoUrl = await this.photoUploader.saveImage(this.user?.id || "new");
    data.photoUrl = photoUrl;

    try {
      if (userId) {
        // --- THIS IS AN EXISTING USER ---
        await updateDoc(doc(db, "users", userId), data);

        // Check if the class was changed
        if (newClassId !== oldClassId) {
          
          // 1. Remove from OLD class
          if (oldClassId) {
            const oldClassRef = doc(db, "classes", oldClassId);
            await updateDoc(oldClassRef, {
              students: arrayRemove(userId)
            });
          }
          
          // 2. Add to NEW class
          if (newClassId) {
            const newClassRef = doc(db, "classes", newClassId);
            await updateDoc(newClassRef, {
              students: arrayUnion(userId)
            });
          }
        }
      } else {
        // --- THIS IS A NEW USER ---
        const newUserRef = await addDoc(collection(db, "users"), data);
        
        // 2. Add to NEW class (no old class to worry about)
        if (newClassId) {
          const newClassRef = doc(db, "classes", newClassId);
          await updateDoc(newClassRef, {
            students: arrayUnion(newUserRef.id) // Use the new user's ID
          });
        }
      }

      // --- Success ---
      const { default: UsersDashboard } = await import("./UsersDashboard.js");
      new UsersDashboard(this.panelTitle, this.panelContent).render();

    } catch (err) {
      console.error("❌ Failed to save user and update class:", err);
      alert("Failed to save user.");
    }
  }
}