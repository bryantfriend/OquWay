// js/studentDashboard.js

import { studentData } from "./config.js";
import { showMessage, updateDashboardPoints } from "./utilities.js";
import { getText } from "./i18n.js";
import { navigateTo } from "./router.js";
import { db } from "./firebase-init.js";

import { doc, updateDoc } 
  from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import { getStorage, ref, uploadBytes, getDownloadURL } 
  from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

const storage = getStorage();

/* ============================
   RENDER DASHBOARD (DATA ONLY)
   ============================ */
export function renderDashboard() {
  const avatarImg = document.getElementById("dashboard-avatar");
  const studentName = document.getElementById("student-name");

  if (avatarImg) {
    avatarImg.src = studentData.avatar || "assets/default-avatar.png";
  }

  if (studentName) {
    studentName.textContent = studentData.name || "";
  }

  updateDashboardPoints();
}

function showAvatarSaving(show) {
  const overlay = document.getElementById("avatarSavingOverlay");
  if (!overlay) return;
  overlay.classList.toggle("hidden", !show);
}


/* ============================
   INIT DASHBOARD (EVENTS)
   ============================ */
export function initStudentDashboard() {
  const avatarImg = document.getElementById("dashboard-avatar");
  const avatarInput = document.getElementById("avatarInput");

  if (avatarImg && avatarInput) {

    // ❌ REMOVE this — label already handles click
    // avatarImg.addEventListener("click", () => avatarInput.click());

    avatarInput.addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;

  // 🔥 IMMEDIATE LOCAL PREVIEW
  const localPreview = URL.createObjectURL(file);
  avatarImg.src = localPreview;

  showAvatarSaving(true);

  try {
    const avatarRef = ref(
      storage,
      `avatars/${studentData.studentId}/avatar.jpg`
    );

    await uploadBytes(avatarRef, file);

    const downloadUrl = await getDownloadURL(avatarRef);

    await updateDoc(
      doc(db, "users", studentData.studentId),
      { photoUrl: downloadUrl }
    );

    // Save state
    studentData.avatar = downloadUrl;
    localStorage.setItem("studentData", JSON.stringify(studentData));

    // 🔁 Swap preview → real image (with cache bust)
    avatarImg.src = `${downloadUrl}?t=${Date.now()}`;

  } catch (err) {
    console.error("❌ Avatar upload failed:", err);
    alert("Failed to upload avatar.");
  } finally {
    showAvatarSaving(false);
    avatarInput.value = ""; // allow same file again
  }
});

  }

  document.getElementById("earnQuickPointsBtn")
    ?.addEventListener("click", earnQuickPoints);

  document.getElementById("logPhysicalActivityBtn")
    ?.addEventListener("click", logPhysicalActivity);

  document.getElementById("goToCoursesBtn")
    ?.addEventListener("click", () => navigateTo("courses"));

  document.getElementById("visitStoreBtn")
    ?.addEventListener("click", () => navigateTo("store"));
}


/* ============================
   POINT LOGIC
   ============================ */
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
