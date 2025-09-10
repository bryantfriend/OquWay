// js/coursesScreen.js

import { db } from "../firebase-init.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { studentData } from "../config.js";
import { navigateTo } from "../router.js";

/**
 * Renders the list of courses associated with the student's class.
 */
export async function renderCoursesScreen(container) {
  container.innerHTML = `
    <div class="p-4">
      <h1 class="text-xl font-bold mb-4" data-i18n="activitiesTitle">Courses</h1>
      <div id="coursesContainer" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <p>Loading...</p>
      </div>
      <button id="backFromCoursesBtn" class="bg-gray-600 text-white w-full py-2 rounded" data-i18n="backToDashboardBtn">Back</button>
    </div>
  `;

  document.getElementById("backFromCoursesBtn")
    .addEventListener("click", () => navigateTo("dashboard"));

  await loadCourses();
}

/**
 * Loads and displays courses for the current student's class.
 */
async function loadCourses() {
  const container = document.getElementById("coursesContainer");
  container.innerHTML = '';

  if (!studentData.classId) {
    container.innerHTML = `<p class="text-red-600">No class ID found. Cannot load courses.</p>`;
    console.error("❌ Missing classId in studentData:", studentData);
    return;
  }

  console.log("✅ studentData.classId =", studentData.classId);

  try {
    const q = query(
      collection(db, "courses"),
      where("classes", "array-contains", studentData.classId)
    );

    console.log("📡 Executing Firestore query...");
    const snapshot = await getDocs(q);
    console.log(`📦 Retrieved ${snapshot.size} course(s)`);

    if (snapshot.empty) {
      container.innerHTML = `<p class="text-gray-600">No courses found for your class.</p>`;
      console.warn("⚠️ No matching courses found for classId:", studentData.classId);
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log("📘 Course loaded:", data);
    console.log("📘 Course doc ID:", doc.id);
    console.log("📘 Course.classes array:", data.classes);

      const card = document.createElement("div");
      card.className = "border rounded p-4 shadow bg-white hover:bg-gray-50 transition text-center";

      card.innerHTML = `
        <img src="${data.iconUrl}" class="mx-auto w-14 h-14 rounded-full mb-3" alt="Course Icon">
        <div class="text-lg font-semibold mb-1">${data.title || "Untitled Course"}</div>
        <p class="text-sm text-gray-700 mb-3">${data.description || "No description available."}</p>
        <button class="bg-blue-600 text-white py-1 px-4 rounded text-sm">Start</button>
      `;

      card.querySelector("button").addEventListener("click", () => {
        localStorage.setItem("activeCourseDocId", doc.id);
        navigateTo(data.startScreenId || "coursePlayerScreen");
      });

      container.appendChild(card);
    });

  } catch (err) {
    container.innerHTML = `<p class="text-red-600">Error loading courses. See console for details.</p>`;
    console.error("🔥 Firestore getDocs() failed:", err);
    console.log("👨‍🎓 Full studentData snapshot:", studentData);
  }
}

