// js/coursePlayerScreen.js

import { db, auth } from "../firebase-init.js";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { navigateTo } from "../router.js";

// --- Helpers ---
function getLang() {
  const raw = (localStorage.getItem("language") || "en").toLowerCase();
  return raw === "ky" ? "kg" : raw;
}

function resolveLocalized(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  const lang = getLang();
  return val[lang] ?? val.en ?? Object.values(val)[0] ?? "";
}

// --- Completion helpers ---
async function isModuleCompleted(moduleId) {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const ref = doc(db, "users", user.uid, "modules_completed", moduleId);
    const snap = await getDoc(ref);

    return snap.exists() && !!snap.data()?.completedAt;
  } catch (err) {
    console.error("⚠️ Error checking module completion:", err);
    return false;
  }
}

// --- Render screen ---
export async function renderCoursePlayerScreen(container) {
  container.innerHTML = `
    <div class="p-4">
      <h1 id="courseTitle" class="text-xl font-bold mb-4">Course Modules</h1>
      <div id="modulesContainer" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <p>Loading modules...</p>
      </div>
      <button id="backFromCourseBtn" class="bg-gray-600 text-white py-2 w-full rounded">
        Back
      </button>
    </div>
  `;

  document
    .getElementById("backFromCourseBtn")
    .addEventListener("click", () => navigateTo("courses"));

  const courseDocId = localStorage.getItem("activeCourseDocId");
  if (!courseDocId) {
    document.getElementById("modulesContainer").innerHTML =
      `<p class="text-red-600">No course selected.</p>`;
    return;
  }

  await loadCourseModules(courseDocId);
}

// --- Load modules ---
async function loadCourseModules(courseDocId) {
  const container = document.getElementById("modulesContainer");
  container.innerHTML = "";

  try {
    const courseRef = doc(db, "courses", courseDocId);
    const courseSnap = await getDoc(courseRef);

    if (!courseSnap.exists()) {
      throw new Error("Course not found");
    }

    const courseData = courseSnap.data();
    document.getElementById("courseTitle").textContent =
      resolveLocalized(courseData.title) || "Modules";

    const modulesRef = collection(db, "courses", courseDocId, "modules");
    const q = query(modulesRef, orderBy("order", "asc"));
    const modulesSnap = await getDocs(q);

    if (modulesSnap.empty) {
      container.innerHTML =
        `<p class="text-gray-600">No modules found for this course.</p>`;
      return;
    }

    for (const moduleDoc of modulesSnap.docs) {
      const moduleData = moduleDoc.data();
      const moduleId = moduleDoc.id;
      const completed = await isModuleCompleted(moduleId);

      const card = document.createElement("div");
      card.className =
        "border rounded p-4 shadow bg-white hover:bg-gray-50 transition text-center";

      card.innerHTML = `
        <div class="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
          ${resolveLocalized(moduleData.title) || moduleId}
          ${completed ? '<span class="text-green-600">✅</span>' : ""}
        </div>

        <p class="text-sm text-gray-600 mb-3">
          Lesson ${moduleData.order ?? "?"}
        </p>

        <div class="flex justify-center gap-2">
          ${completed
          ? `<button class="start-btn bg-white border border-green-500 text-green-600 px-4 py-1 rounded text-sm hover:bg-green-50">
                   Retake
                 </button>`
          : `<button class="start-btn bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700">
                   Start
                 </button>`
        }
        </div>
      `;

      // Always add listener
      card.querySelector(".start-btn").addEventListener("click", () => {
        localStorage.setItem("activeCourseDocId", courseDocId);
        localStorage.setItem("activeModuleId", moduleId);
        navigateTo("moduleScreen");
      });

      container.appendChild(card);
    }
  } catch (err) {
    console.error("🚨 Error loading course modules:", err);
    container.innerHTML =
      `<p class="text-red-600">Failed to load course data.</p>`;
  }
}
