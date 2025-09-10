// js/studentDashboard.js

import { studentData } from "./config.js";
import { showMessage, updateDashboardPoints } from "./utilities.js";
import { getText } from "./i18n.js";
import { navigateTo } from "./router.js";
import { db } from "./firebase-init.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// This function's job is to FILL the existing HTML with data.
export function renderDashboard() {
  const avatarImg = document.getElementById("dashboard-avatar");
  if (avatarImg) {
    avatarImg.src = studentData.avatar || "assets/default-avatar.png";
  }

  const studentName = document.getElementById("student-name");
  if (studentName) {
    studentName.textContent = studentData.name;
  }
  
  updateDashboardPoints();
}

// This function's job is to add ALL event listeners for the dashboard.
export function initStudentDashboard() {
  // --- Avatar Upload Logic ---
  const avatarImg = document.getElementById("dashboard-avatar");
  const avatarInput = document.getElementById("avatarInput");

  if (avatarImg && avatarInput) {
    avatarImg.addEventListener("click", () => avatarInput.click());

    avatarInput.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        avatarImg.src = dataUrl;
        studentData.avatar = dataUrl;
        
        try {
          await updateDoc(doc(db, "users", studentData.studentId), { photoUrl: dataUrl });
        } catch (err) {
          console.error("Failed to save avatar:", err);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // --- Button Click Logic ---
  document.getElementById("earnQuickPointsBtn")?.addEventListener("click", earnQuickPoints);
  document.getElementById("logPhysicalActivityBtn")?.addEventListener("click", logPhysicalActivity);
  document.getElementById("goToCoursesBtn")?.addEventListener("click", () => navigateTo("courses"));
  document.getElementById("visitStoreBtn")?.addEventListener("click", () => navigateTo("store"));
}

// --- Functionality ---

export function earnQuickPoints() {
  const types = ["physical", "cognitive", "creative", "social"];
  const t = types[Math.floor(Math.random() * types.length)];
  const pts = Math.floor(Math.random() * 5) + 1;
  studentData.points[t] += pts;
  showMessage(
    "pointsEarned",
    2000,
    pts,
    getText(t + "Points").toLowerCase()
  );
  updateDashboardPoints();
}

export function logPhysicalActivity() {
  const pts = Math.floor(Math.random() * 3) + 1;
  studentData.points.physical += pts;
  showMessage("physicalActivityLogged", 2000, pts);
  updateDashboardPoints();
}