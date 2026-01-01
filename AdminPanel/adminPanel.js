import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import { db, auth } from "./firebase-init.js";
import { showGlobalLoader, hideGlobalLoader } from "./utilities.js";

import UsersDashboard from "./users/UsersDashboard.js";
import ClassesDashboard from "./classes/ClassesDashboard.js";
import LocationsDashboard from "./locations/LocationsDashboard.js";
import CoursesDashboard from "./courses/CoursesDashboard.js";

// Optional admin-specific utilities
import { loadLocations } from "./adminUtils.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Admin Panel loaded");
});

const tabs = document.querySelectorAll(".tab-btn");
const panelTitle = document.getElementById("panel-title");
const panelContent = document.getElementById("panel-content");

tabs.forEach(tab => {
  tab.addEventListener("click", async () => {
    const selectedTab = tab.dataset.tab;

    // close sidebar on mobile
    const sidebar = document.getElementById("sidebar");
    if (window.innerWidth < 768 && sidebar) {
      sidebar.classList.add("-translate-x-full");
    }

    panelTitle.textContent =
      selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1);

    switch (selectedTab) {

      case "locations": {
        showGlobalLoader("Loading Locations...");
        const { default: LocationsDashboard } =
          await import("./locations/LocationsDashboard.js");
        const dashboard = new LocationsDashboard(panelTitle, panelContent);
        await dashboard.render();
        hideGlobalLoader();
        break;
      }

      case "classes": {
        showGlobalLoader("Loading Classes...");
        const { default: ClassesDashboard } =
          await import("./classes/ClassesDashboard.js");
        const locs = await loadLocations();
        const dashboard = new ClassesDashboard(panelTitle, panelContent, locs);
        await dashboard.render();
        hideGlobalLoader();
        break;
      }

      case "schedules": {
        showGlobalLoader("Loading schedules...");
        const { default: SchedulesDashboard } =
          await import("./schedules/SchedulesDashboard.js");
        const dash = new SchedulesDashboard(panelTitle, panelContent);
        await dash.render();
        hideGlobalLoader();
        break;
      }

      case "courses": {
        showGlobalLoader("Loading courses...");
        const { default: CoursesDashboard } =
          await import("./courses/CoursesDashboard.js");
        const dashboard = new CoursesDashboard(panelTitle, panelContent);
        await dashboard.render();
        hideGlobalLoader();
        break;
      }

      case "users": {
        showGlobalLoader("Loading Users...");
        const { default: UsersDashboard } =
          await import("./users/UsersDashboard.js");
        const dashboard = new UsersDashboard(panelTitle, panelContent);
        await dashboard.render();
        hideGlobalLoader();
        break;
      }

      case "permissions": {
        panelContent.innerHTML =
          `<p class="text-gray-500">[Permissions panel is under construction]</p>`;
        break;
      }

      case "settings": {
        panelContent.innerHTML =
          `<p class="text-gray-500">[Settings panel is under construction]</p>`;
        break;
      }

      default: {
        panelContent.innerHTML =
          `<p class="text-red-500">Unknown tab</p>`;
      }
    }
  });
});


// 🔹 Initial welcome message
function initAdminPanel() {
  panelTitle.textContent = "Welcome";
  panelContent.innerHTML = `
    <div class="text-gray-500 text-lg mt-10">
      Please select a section from the left sidebar to begin.
    </div>
  `;
}

// 🔹 Logout button
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
  localStorage.clear();
  window.location.href = "login.html";
});

// 🟢 Run init
initAdminPanel();

window.showGlobalLoader = showGlobalLoader;
window.hideGlobalLoader = hideGlobalLoader;
