// js/coursePlayerScreen.js

import { db } from "../firebase-init.js";
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { navigateTo } from '../router.js';
import { auth } from "../firebase-init.js";
import { studentData } from "../config.js";

// --- HELPER FUNCTIONS (No change here) ---
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

/**
 * Marks a module as completed for the current student
 */
async function markModuleCompleted(moduleId) {
  try {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to mark a module complete.");
      return;
    }
    const uid = user.uid;

    // V-- New path: users/{their_id}/modules_completed/{the_module_id}
    const moduleProgressRef = doc(db, "users", uid, "modules_completed", moduleId);

    await setDoc(moduleProgressRef, {
      // We don't need to store userId and moduleId again, as they're in the path!
      completedAt: serverTimestamp(),
    });

    console.log(`✅ Module ${moduleId} marked completed for ${uid}`);
    alert("✅ Progress saved!");
  } catch (err) {
    console.error("❌ Failed to mark module complete:", err);
    alert("Error saving progress: " + err.message);
  }
}

/**
 * Checks if a module is already completed for the current student
 */
async function isModuleCompleted(moduleId) {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    // ✅ CORRECTED PATH:
    // The path must match your rules: /users/{uid}/modules_completed/{moduleId}
    const moduleProgressRef = doc(db, "users", user.uid, "modules_completed", moduleId);
    const snap = await getDoc(moduleProgressRef);
    
    return snap.exists();
  } catch (err) {
    console.error("⚠️ Error checking module completion:", err);
    return false;
  }
}


// --- RENDER FUNCTION (No change here) ---
export async function renderCoursePlayerScreen(container) {
  container.innerHTML = `
    <div class="p-4">
      <h1 id="courseTitle" class="text-xl font-bold mb-4">Course Modules</h1>
      <div id="modulesContainer" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <p>Loading modules...</p>
      </div>
      <button id="backFromCourseBtn" class="bg-gray-600 text-white py-2 w-full rounded">Back</button>
    </div>
  `;

  document.getElementById("backFromCourseBtn")
    .addEventListener("click", () => navigateTo("courses"));

  const courseDocId = localStorage.getItem("activeCourseDocId");
  if (!courseDocId) {
    document.getElementById("modulesContainer").innerHTML = `<p class="text-red-600">No course selected.</p>`;
    return;
  }

  await loadCourseModules(courseDocId);
}


// --- DATA LOADING FUNCTION (REWRITTEN) ---
async function loadCourseModules(courseDocId) {
  const container = document.getElementById("modulesContainer");
  container.innerHTML = '';

  try {
    // First, get the main course document to display its title
    const courseDocRef = doc(db, "courses", courseDocId);
    const courseSnap = await getDoc(courseDocRef);

    if (!courseSnap.exists()) {
      throw new Error("❌ Course not found in Firestore.");
    }

    const courseData = courseSnap.data();
    const courseTitleEl = document.getElementById("courseTitle");
    if (courseTitleEl && courseData.title) {
      courseTitleEl.textContent = resolveLocalized(courseData.title) || "Modules";
    }

    // --- NEW LOGIC: Query the 'modules' subcollection ---
    const modulesRef = collection(db, "courses", courseDocId, "modules");
    const modulesSnap = await getDocs(modulesRef);

    if (modulesSnap.empty) {
        container.innerHTML = `<p class="text-gray-600">No modules found for this course.</p>`;
        return;
    }

modulesSnap.forEach(async (moduleDoc) => {
  const moduleData = moduleDoc.data();
  const moduleId = moduleDoc.id;

  const completed = await isModuleCompleted(moduleId);

  const card = document.createElement("div");
  card.className = "border rounded p-4 shadow bg-white hover:bg-gray-50 transition text-center";

  const displayTitle = resolveLocalized(moduleData.title) || moduleId;

  card.innerHTML = `
    <div class="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
      ${displayTitle}
      ${completed ? '<span class="text-green-600">✅</span>' : ""}
    </div>
    <p class="text-sm text-gray-600 mb-3">Start Date: ${moduleData.startDate || 'Not set'}</p>
    <div class="flex justify-center gap-2">
      <button class="start-btn bg-green-600 text-white px-4 py-1 rounded text-sm">Start</button>
      ${
        completed
          ? '<button disabled class="bg-gray-300 text-gray-600 px-4 py-1 rounded text-sm">Completed</button>'
          : '<button class="complete-btn bg-blue-600 text-white px-4 py-1 rounded text-sm">Mark Complete</button>'
      }
    </div>
  `;

  // ✅ Start button logic
  card.querySelector(".start-btn").addEventListener("click", () => {
    localStorage.setItem("activeCourseDocId", courseDocId);
    localStorage.setItem("activeModuleId", moduleId);
    navigateTo("moduleScreen");
  });

  // ✅ Complete button logic
  const completeBtn = card.querySelector(".complete-btn");
  if (completeBtn) {
    completeBtn.addEventListener("click", async () => {
      completeBtn.disabled = true;
      completeBtn.textContent = "Saving...";
      try {
        await markModuleCompleted(moduleId);

        // 🔄 Immediately re-check completion status after saving
        const done = await isModuleCompleted(moduleId);
        if (done) {
          completeBtn.textContent = "Completed";
          completeBtn.classList.remove("bg-blue-600", "text-white");
          completeBtn.classList.add("bg-gray-300", "text-gray-600");

          // Remove old checkmark if it exists
          card.querySelector(".text-green-600")?.remove();

          // Add a new ✅ mark beside the title
          const titleEl = card.querySelector(".text-lg");
          if (titleEl) titleEl.insertAdjacentHTML("beforeend", '<span class="text-green-600">✅</span>');
        } else {
          completeBtn.textContent = "Retry";
          completeBtn.disabled = false;
        }
      } catch (err) {
        console.error("❌ Failed to mark module complete:", err);
        alert("Error saving progress: " + err.message);
        completeBtn.disabled = false;
        completeBtn.textContent = "Mark Complete";
      }
    });
  }


  container.appendChild(card);
});


  } catch (err) {
    console.error("🚨 Error loading course modules from Firestore:", err);
    container.innerHTML = `<p class="text-red-600">Failed to load course data.</p>`;
  }
}