// courses/CoursesDashboard.js

import CourseService from "./CourseService.js";

export default class CoursesDashboard {
  constructor(panelTitle, panelContent) {
    this.panelTitle = panelTitle;
    this.panelContent = panelContent;

    this.courses = [];
    this.filteredCourses = [];
    this.search = "";
  }

  async render() {
    try {
      this.panelTitle.textContent = "Courses";
      this.panelContent.innerHTML = `
        <div class="flex justify-between items-center mb-3">
          <input
            id="courseSearch"
            type="text"
            placeholder="Search courses..."
            class="border rounded px-3 py-1 text-sm w-64"
          />

          <button
            id="addCourseBtn"
            class="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm"
          >
            ➕ Add Course
          </button>
        </div>

        <div id="coursesTable" class="bg-white rounded shadow border overflow-x-auto">
          <p class="p-4 text-gray-500">Loading courses...</p>
        </div>
      `;

      this.courses = await CourseService.getAll();
      this.filteredCourses = [...this.courses];

      this.bindEvents();
      this.renderTable();

    } catch (err) {
      console.error("Error loading courses:", err);
      this.panelContent.innerHTML =
        `<p class="text-red-600">Failed to load courses.</p>`;
    }
  }

  bindEvents() {
    const searchInput = this.panelContent.querySelector("#courseSearch");
    const addBtn = this.panelContent.querySelector("#addCourseBtn");

    searchInput?.addEventListener("input", () => {
      this.search = searchInput.value.toLowerCase();
      this.applyFilters();
      this.renderTable();
    });

    addBtn?.addEventListener("click", async () => {
      const { default: CourseEditor } =
        await import("./CourseEditor.js");
      new CourseEditor(this.panelTitle, this.panelContent, null).render();
    });
  }

  applyFilters() {
    if (!this.search) {
      this.filteredCourses = [...this.courses];
      return;
    }

    this.filteredCourses = this.courses.filter(course => {
      const title =
        typeof course.title === "string"
          ? course.title
          : course.title?.en || "";

      return title.toLowerCase().includes(this.search);
    });
  }

  renderTable() {
    const container = this.panelContent.querySelector("#coursesTable");
    if (!container) return;

    if (this.filteredCourses.length === 0) {
      container.innerHTML =
        `<p class="p-4 text-gray-500 text-center">No courses found.</p>`;
      return;
    }

    const rows = this.filteredCourses.map(course => {
      const title =
        typeof course.title === "string"
          ? course.title
          : course.title?.en || "Untitled";

      const languages = (course.languages || ["en"])
        .map(l => l.toUpperCase())
        .join(", ");

      const visibility = course.isVisible === false
        ? `<span class="text-gray-500">Draft</span>`
        : `<span class="text-green-600">Published</span>`;

      return `
        <tr class="hover:bg-gray-50 cursor-pointer" data-id="${course.id}">
          <td class="px-3 py-2 font-medium">${title}</td>
          <td class="px-3 py-2 text-sm">${languages}</td>
          <td class="px-3 py-2 text-sm">${visibility}</td>
        </tr>
      `;
    }).join("");

    container.innerHTML = `
      <table class="min-w-full text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-3 py-2 text-left">Course</th>
            <th class="px-3 py-2 text-left">Languages</th>
            <th class="px-3 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          ${rows}
        </tbody>
      </table>
    `;

    container
      .querySelectorAll("tr[data-id]")
      .forEach(row => {
        row.addEventListener("click", () =>
          this.openEditor(row.dataset.id)
        );
      });
  }

  async openEditor(courseId) {
    const { default: CourseEditor } =
      await import("./CourseEditor.js");
    new CourseEditor(this.panelTitle, this.panelContent, courseId).render();
  }
}
