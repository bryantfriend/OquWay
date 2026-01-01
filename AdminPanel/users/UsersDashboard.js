import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { db } from "../firebase-init.js";
import UserList from "./UserList.js";
import { showGlobalLoader, hideGlobalLoader } from "../utilities.js";

export default class UsersDashboard {
  constructor(panelTitle, panelContent) {
    this.panelTitle = panelTitle;
    this.panelContent = panelContent;
    this.locations = [];
    this.classes = [];
    this.users = [];
  }

  async render() {
    try {
      const [locSnap, classSnap, userSnap] = await Promise.all([
        getDocs(collection(db, "locations")),
        getDocs(collection(db, "classes")),
        getDocs(collection(db, "users")),
      ]);

      // Normalize locations
      this.locations = locSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Normalize classes
      this.classes = classSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          locationId: d.locationId || d.location_id || null,
        };
      });

      // Normalize users
      this.users = userSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          // handle snake_case or camelCase
          locationId: d.locationId || d.location_id || null,
          classId: d.classId || d.class_id || null,
          role: d.role || "—", // fallback role
          name: d.name || "Unnamed", // fallback name
        };
      });

      // Filter out platformAdmin only if role is explicitly set
      this.users = this.users.filter((u) => u.role !== "platformAdmin");

      // 🔥 Debug log
      console.log("🔥 Users loaded:", this.users);

      // Render user list
      const list = new UserList(this.panelTitle, this.panelContent, this.locations, this.classes);
      list.render(this.users);

    } catch (err) {
      console.error("❌ Failed to load UsersDashboard:", err);
      this.panelContent.innerHTML = `<p class="text-red-600">Failed to load users. Check console.</p>`;
    } finally {
      hideGlobalLoader();
    }
  }
}
