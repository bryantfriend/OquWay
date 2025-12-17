// js/coursesList.js

import { getText } from "./i18n.js";
import { navigateTo } from "./router.js";
import { availableCourses } from "./config.js";

function resolveI18n(value) {
  if (!value) return "";
  // if dev passed a key string, use getText
  if (typeof value === "string") return getText(value);
  // if dev passed an object {en,ru,kg}, pick current language
  const lang = localStorage.getItem("language") || "en";
  return value[lang] || value.en || "";
}

export function renderCoursesList() {
  const container = document.getElementById("courseItemsContainer");
  if (!container) return;

  card.innerHTML = `
  <span class="subject-icon">${course.icon}</span>
  <span class="course-title">${resolveI18n(course.titleKey)}</span>
  <p class="course-description">${resolveI18n(course.descriptionKey)}</p>
  <button class="start-course-btn">${getText("startCourseBtn")}</button>
`;


  availableCourses.forEach(course => {
    const card = document.createElement("div");
    card.className = "course-card";
    card.innerHTML = `
      <span class="subject-icon">${course.icon}</span>
      <span class="course-title">${getText(course.titleKey)}</span>
      <p class="course-description">${getText(course.descriptionKey)}</p>
      <button class="start-course-btn">${getText("startCourseBtn")}</button>
    `;

    card.querySelector(".start-course-btn").addEventListener("click", () => {
      // Optionally set current course in session state
      localStorage.setItem("activeCourseId", course.id);

      // Navigate to course player screen
      navigateTo(course.startScreenId);
    });

    container.appendChild(card);
  });
}
