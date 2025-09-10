// js/coursePlayerScreen.js

import { db } from "../firebase-init.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { navigateTo } from '../router.js';

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

    modulesSnap.forEach(moduleDoc => {
        const moduleData = moduleDoc.data();
        const moduleId = moduleDoc.id;

        const card = document.createElement("div");
        card.className = "border rounded p-4 shadow bg-white hover:bg-gray-50 transition text-center";

        const displayTitle = resolveLocalized(moduleData.title) || moduleId;
        
        card.innerHTML = `
          <div class="text-lg font-semibold mb-2">${displayTitle}</div>
          <p class="text-sm text-gray-600 mb-3">Start Date: ${moduleData.startDate || 'Not set'}</p>
          <button class="bg-green-600 text-white px-4 py-1 rounded text-sm">Start</button>
        `;

        card.querySelector("button").addEventListener("click", () => {
          // Save BOTH the course and module ID for the next screen
          localStorage.setItem("activeCourseDocId", courseDocId); 
          localStorage.setItem("activeModuleId", moduleId);
          navigateTo("moduleScreen");
        });
        
        container.appendChild(card);
    });

  } catch (err) {
    console.error("🚨 Error loading course modules from Firestore:", err);
    container.innerHTML = `<p class="text-red-600">Failed to load course data.</p>`;
  }
}