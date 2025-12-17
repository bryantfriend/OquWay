// js/coursesScreen.js

import { db } from "../firebase-init.js";
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
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
  container.innerHTML = "";

  if (!studentData.classId) {
    container.innerHTML = `<p class="text-red-600">No class ID found.</p>`;
    return;
  }

  console.log("✅ studentData.classId =", studentData.classId);

  try {
    // 1️⃣ Load the class document
    const classRef = doc(db, "classes", studentData.classId);
    const classSnap = await getDoc(classRef);

    if (!classSnap.exists()) {
      container.innerHTML = `<p class="text-red-600">Class not found.</p>`;
      console.error("❌ Class not found:", studentData.classId);
      return;
    }

    const classData = classSnap.data();
    const courseIds = classData.courseIds || [];

    console.log("📚 Course IDs for class:", courseIds);

    if (!courseIds.length) {
      container.innerHTML = `<p class="text-gray-600">No courses assigned to your class.</p>`;
      return;
    }

    // 2️⃣ Load each course
    let loadedCount = 0;

    for (const courseId of courseIds) {
      const courseRef = doc(db, "courses", courseId);
      const courseSnap = await getDoc(courseRef);

      if (!courseSnap.exists()) {
        console.warn("⚠️ Course not found:", courseId);
        continue;
      }

      const data = courseSnap.data();
      loadedCount++;

      console.log("📘 Loaded course:", courseId, data);

      const card = document.createElement("div");
      card.className =
        "border rounded p-4 shadow bg-white hover:bg-gray-50 transition text-center";

      card.innerHTML = `
        <img src="${data.iconUrl || ""}"
             class="mx-auto w-14 h-14 rounded-full mb-3"
             alt="Course Icon">
        <div class="text-lg font-semibold mb-1">
          ${data.title || "Untitled Course"}
        </div>
        <p class="text-sm text-gray-700 mb-3">
          ${data.description || "No description available."}
        </p>
        <button class="bg-blue-600 text-white py-1 px-4 rounded text-sm">
          Start
        </button>
      `;

      card.querySelector("button").addEventListener("click", () => {
        localStorage.setItem("activeCourseDocId", courseId);
        navigateTo(data.startScreenId || "coursePlayerScreen");
      });

      container.appendChild(card);
    }

    console.log(`📦 Rendered ${loadedCount} course(s)`);

    if (!loadedCount) {
      container.innerHTML = `<p class="text-gray-600">No valid courses found.</p>`;
    }

  } catch (err) {
    console.error("🔥 Failed to load courses:", err);
    container.innerHTML = `<p class="text-red-600">Error loading courses.</p>`;
  }
}

