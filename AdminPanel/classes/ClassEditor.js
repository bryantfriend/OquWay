// classes/ClassEditor.js
import ClassService from "./ClassService.js";
import PhotoUploader from "../ui/PhotoUploader.js";
import { withButtonSpinner, spinnerButton } from "../ui/withButtonSpinner.js";
import CourseService from "../courses/CourseService.js";


import {
  pad,
  loadTeachers,
  getTeacherData,
  showTeacherModal,
  setupSpinner,
  createTimePicker,
  generateDisplayName,
  loadLocations,
} from "../adminUtils.js";

import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { db } from "../firebase-init.js";

export default class ClassEditor {
  constructor(panelTitle, panelContent, cls = null, locations = []) {
    this.panelTitle = panelTitle;
    this.panelContent = panelContent;
    this.cls = cls;
    this.locations = locations;
    this.photoUploader = null;
    this.dayTimes = cls?.dayTimes || {};
    this.selectedDays = new Set(cls?.days || []);
    this.isAutoNameEnabled = true;
    this.assignedCourseIds = Array.isArray(cls?.courseIds)
      ? cls.courseIds
      : [];
    this.allCourses = [];

  }

  // ============================
  // TIME MODAL
  // ============================
  showTimeModal(day) {
    const existingTime = this.dayTimes[day] || "09:00-10:00";
    const [start, end] = existingTime.split("-");
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);

    const modal = document.createElement("div");
    modal.id = "time-modal";
    modal.className = "fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity duration-300";

    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative transform scale-95 transition-all duration-300">
        <button id="time-modal-close"
                class="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg text-gray-500 hover:text-red-500 hover:scale-110 transition-all">
          ✖
        </button>

        <h2 class="text-xl font-bold text-center mb-5 text-gray-800">
          Select Time for <span class="text-blue-600">${day}</span>
        </h2>

        <div class="flex justify-around items-start mb-6 gap-4">
          ${createTimePicker("start", "Start Time", startH, startM)}
          ${createTimePicker("end", "End Time", endH, endM)}
        </div>

        <div class="flex justify-between items-center space-x-2">
          <button id="time-modal-remove"
                  class="flex-1 px-4 py-2 rounded-lg text-white font-semibold bg-red-500 hover:bg-red-600 shadow-md hover:shadow-lg transform hover:scale-105 transition-all">
            🗑 Remove Day
          </button>
          <button id="time-modal-cancel"
                  class="flex-1 px-4 py-2 rounded-lg text-gray-700 font-semibold bg-gray-200 hover:bg-gray-300 shadow-sm transform hover:scale-105 transition-all">
            Cancel
          </button>
          <button id="time-modal-save"
                  class="flex-1 px-4 py-2 rounded-lg text-white font-semibold bg-green-500 hover:bg-green-600 shadow-md hover:shadow-lg transform hover:scale-105 transition-all">
            Save
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    setupSpinner(
      modal.querySelector("#start-hour-input"),
      modal.querySelector("#start-hour-display"),
      modal.querySelector("#start-hour-up"),
      modal.querySelector("#start-hour-down"),
      7, 22, 1, true, true
    );
    setupSpinner(
      modal.querySelector("#start-min-input"),
      modal.querySelector("#start-min-display"),
      modal.querySelector("#start-min-up"),
      modal.querySelector("#start-min-down"),
      0, 55, 5, true, true
    );
    setupSpinner(
      modal.querySelector("#end-hour-input"),
      modal.querySelector("#end-hour-display"),
      modal.querySelector("#end-hour-up"),
      modal.querySelector("#end-hour-down"),
      7, 22, 1, true, true
    );
    setupSpinner(
      modal.querySelector("#end-min-input"),
      modal.querySelector("#end-min-display"),
      modal.querySelector("#end-min-up"),
      modal.querySelector("#end-min-down"),
      0, 55, 5, true, true
    );

    const closeModal = () => {
      modal.classList.add("opacity-0");
      modal.querySelector("div").classList.add("scale-95");
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector("#time-modal-close").addEventListener("click", closeModal);
    modal.querySelector("#time-modal-cancel").addEventListener("click", closeModal);

    modal.querySelector("#time-modal-remove").addEventListener("click", () => {
      delete this.dayTimes[day];
      this.selectedDays.delete(day);
      this.refreshDayButtons();
      this.updateAutoName();
      closeModal();
    });

    modal.querySelector("#time-modal-save").addEventListener("click", () => {
      const newStartH = pad(modal.querySelector("#start-hour-input").value);
      const newStartM = pad(modal.querySelector("#start-min-input").value);
      const newEndH = pad(modal.querySelector("#end-hour-input").value);
      const newEndM = pad(modal.querySelector("#end-min-input").value);

      this.dayTimes[day] = `${newStartH}:${newStartM}-${newEndH}:${newEndM}`;
      this.selectedDays.add(day);

      this.refreshDayButtons();
      this.updateAutoName();
      closeModal();
    });
  }

  // ============================
  // AUTO-NAME
  // ============================
  updateAutoName() {
    if (!this.isAutoNameEnabled) return;

    const nameInput = document.getElementById("clsName");
    const onlineInput = document.getElementById("clsOnline");
    const groupInput = document.getElementById("clsGroup");

    if (!nameInput) return;

    nameInput.value = generateDisplayName(
      this.dayTimes,
      this.selectedDays,
      onlineInput.value === "online",
      groupInput.value === "group"
    );
  }
  
  renderCourseAssignmentSection() {
  const assigned = new Set(this.assignedCourseIds);

  const rows = this.allCourses.map(course => {
    const title = course.title || "Untitled";
    const languages = (course.languages || ["en"])
      .map(l => l.toUpperCase())
      .join(", ");

    return `
      <label class="flex items-center gap-2 py-1">
        <input
          type="checkbox"
          class="course-checkbox"
          value="${course.id}"
          ${assigned.has(course.id) ? "checked" : ""}
        />
        <span class="font-medium">${title}</span>
        <span class="text-xs text-gray-500">(${languages})</span>
      </label>
    `;
  }).join("");

  return `
    <div class="mt-6 border-t pt-4">
      <h3 class="font-semibold mb-2">📚 Assigned Courses</h3>
      <div class="max-h-64 overflow-y-auto border rounded p-3 bg-gray-50">
        ${rows || `<p class="text-gray-500">No courses available</p>`}
      </div>
    </div>
  `;
}


  // ============================
  // GENERATE CLASS CODE
  // ============================
  generateClassCode() {
    const onlineInput = document.getElementById("clsOnline");
    const groupInput = document.getElementById("clsGroup");
    const gradeInput = document.getElementById("clsGrade");
    const codeInput = document.getElementById("clsCode");

    const mode = onlineInput.value === "online" ? "on" : "off";
    const type = groupInput.value === "group" ? "grp" : "ind";
    const level = gradeInput.value.trim().toLowerCase().replace(/\s+/g, "") || "lvl";

    let earliestStart = 2400;
    let latestEnd = 0;

    this.selectedDays.forEach(day => {
      const t = this.dayTimes[day];
      if (!t) return;

      const [start, end] = t.split("-");
      const s = parseInt(start.replace(":", ""));
      const e = parseInt(end.replace(":", ""));

      if (s < earliestStart) earliestStart = s;
      if (e > latestEnd) latestEnd = e;
    });

    const timeStr =
      earliestStart === 2400 ? "00000000" :
      `${String(earliestStart).padStart(4, "0")}${String(latestEnd).padStart(4, "0")}`;

    codeInput.value = `${timeStr}-${mode}-${type}-${level}`;
  }

  // ============================
  // RENDER UI
  // ============================
  async render() {
    this.panelTitle.textContent = this.cls ? `Edit: ${this.cls.name}` : "Add New Class";
    this.allCourses = await CourseService.getAll("active");
    this.assignedCourseIds = this.cls?.courseIds || [];


    this.panelContent.innerHTML = `
      <div class="bg-white p-6 rounded shadow max-w-xl space-y-3">

        <label class="block font-semibold">Class Name <span class="text-red-500">*</span></label>
        <div class="flex items-center gap-2 mb-1">
          <select id="timePreset" class="border px-3 py-2 rounded w-1/2 text-sm text-gray-700">
            <option value="">🕐 Choose Time Slot</option>
            <option value="Morning">🌅 Morning (09:00 - 12:00)</option>
            <option value="Afternoon">🌤 Afternoon (12:00 - 17:00)</option>
            <option value="Evening">🌇 Evening (17:00 - 20:00)</option>
            <option value="Night">🌙 Night (20:00 - 22:00)</option>
          </select>

          <input id="clsName"
                 class="flex-1 border px-3 py-2 rounded"
                 value="${this.cls?.name || ""}"
                 placeholder="Auto-generated class name">

          <button id="resetNameBtn"
                  class="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition">
            ↻
          </button>
        </div>

        <p id="errorName" class="text-red-500 text-sm hidden">Name is required</p>

        <label class="block font-semibold">Subject <span class="text-red-500">*</span></label>
        <input id="clsSubject" class="w-full border px-3 py-2 rounded mb-1"
               value="${this.cls?.subject || ""}">
        <p id="errorSubject" class="text-red-500 text-sm hidden">Subject is required</p>

        <label class="block font-semibold">Language <span class="text-red-500">*</span></label>
        <input id="clsLanguage" class="w-full border px-3 py-2 rounded mb-1"
               value="${this.cls?.language || ""}">
        <p id="errorLanguage" class="text-red-500 text-sm hidden">Language is required</p>

        <label class="block font-semibold">Grade Level <span class="text-red-500">*</span></label>
        <input id="clsGrade" class="w-full border px-3 py-2 rounded mb-1"
               value="${this.cls?.gradeLevel || ""}">
        <p id="errorGrade" class="text-red-500 text-sm hidden">Grade level is required</p>

        <label class="block font-semibold">Class Code</label>
        <div class="flex gap-2 items-center mb-1">
          <input id="clsCode"
                 class="flex-1 border px-3 py-2 rounded"
                 value="${this.cls?.classCode || ""}">
          <button id="regenCodeBtn"
                  class="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-2 rounded text-sm">
            Generate
          </button>
        </div>

        <label class="block font-semibold">Mode</label>
        <select id="clsOnline" class="w-full border px-3 py-2 rounded mb-1">
          <option value="offline" ${this.cls?.isOnline ? "" : "selected"}>Offline</option>
          <option value="online" ${this.cls?.isOnline ? "selected" : ""}>Online</option>
        </select>

        <label class="block font-semibold">Group Type</label>
        <select id="clsGroup" class="w-full border px-3 py-2 rounded mb-1">
          <option value="group" ${this.cls?.isGroup ? "selected" : ""}>Group</option>
          <option value="individual" ${this.cls?.isGroup ? "" : "selected"}>Individual</option>
        </select>

        <!-- DAYS PICKER -->
        <label class="block font-semibold mt-2">Days of the Week</label>
        <div id="daysPicker" class="flex flex-wrap gap-2 mb-2">
          ${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => `
            <div class="day-wrapper flex flex-col items-center w-16">
              <button type="button" data-day="${d}"
                class="day-btn px-3 py-1 w-full text-center border rounded text-sm ${
                  this.selectedDays.has(d) ? "bg-blue-500 text-white" : "bg-gray-100"
                }">
                ${d}
              </button>
              <span class="day-time text-xs text-blue-700 font-medium h-4 mt-1">
                ${this.dayTimes[d] || ""}
              </span>
            </div>
          `).join("")}
        </div>

        <!-- LOCATION -->
        <label class="block font-semibold">Location</label>
        <select id="clsLocation" class="w-full border px-3 py-2 rounded mb-1">
          <option value="">-- Select Location --</option>
          ${this.locations
            .map(l => `<option value="${l.id}" ${l.id === this.cls?.locationId ? "selected" : ""}>${l.name}</option>`)
            .join("")}
        </select>
        <p id="errorLocation" class="text-red-500 text-sm hidden">Location is required</p>

        <!-- VISIBILITY -->
        <label class="block font-semibold">Visibility in OquWay</label>
        <div class="flex items-center gap-4 mb-2">
          <input type="checkbox" id="clsVisible"
                 ${this.cls?.isVisible ?? true ? "checked" : ""}>
          <span>Show in Student Dashboard</span>
        </div>

        <!-- TEACHERS -->
        <label class="block font-semibold">Assigned Teacher</label>
        <div class="flex gap-2 items-center mb-1">
          <select id="clsTeacher" class="flex-1 border px-3 py-2 rounded">
            <option value="">Loading...</option>
          </select>

          <button id="viewTeacherBtn"
                  class="bg-blue-500 text-white px-3 py-2 rounded disabled:opacity-50"
                  disabled>
            View
          </button>
        </div>

        <!-- Photo -->
        <div id="photoUploaderContainer" class="mb-3"></div>
        
        ${this.renderCourseAssignmentSection()}
        
        <div class="flex gap-4 mt-6">
          ${spinnerButton("saveBtn", "💾 Save", "green")}
          <button id="cancelBtn" class="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
        </div>

      </div>
    `;

    // ============================
    // DAYS PICKER CLICK HANDLERS
    // ============================
    const dayWrappers = document.querySelectorAll("#daysPicker .day-btn");

    dayWrappers.forEach(btn => {
      btn.addEventListener("click", () => {
        const day = btn.dataset.day;
        this.showTimeModal(day);
      });
    });

    this.refreshDayButtons = () => {
      document.querySelectorAll("#daysPicker .day-wrapper").forEach(wrapper => {
        const btn = wrapper.querySelector(".day-btn");
        const time = wrapper.querySelector(".day-time");
        const day = btn.dataset.day;
        const t = this.dayTimes[day];

        if (t) {
          btn.classList.add("bg-blue-500", "text-white");
          btn.classList.remove("bg-gray-100");
          time.textContent = t;
        } else {
          btn.classList.remove("bg-blue-500", "text-white");
          btn.classList.add("bg-gray-100");
          time.textContent = "";
        }
      });
    };

    // ============================
    // AUTO-NAME EVENTS
    // ============================
    document.getElementById("clsName").addEventListener("input", () => {
      this.isAutoNameEnabled = false;
    });

    document.getElementById("resetNameBtn").addEventListener("click", () => {
      this.isAutoNameEnabled = true;
      this.updateAutoName();
    });

    document.getElementById("clsOnline").addEventListener("change", () => this.updateAutoName());
    document.getElementById("clsGroup").addEventListener("change", () => this.updateAutoName());

    document.getElementById("regenCodeBtn").addEventListener("click", () => this.generateClassCode());

    // ============================
    // PHOTO UPLOADER
    // ============================
    this.photoUploader = new PhotoUploader(
      "photoUploaderContainer",
      this.cls?.photoUrl || "",
      "classes"
    );
    this.photoUploader.render();

    // ============================
    // 🎓 CLEAN TEACHER LOADING SYSTEM
    // ============================
    const teacherSelect = document.getElementById("clsTeacher");
    const viewBtn = document.getElementById("viewTeacherBtn");
    const locationSelect = document.getElementById("clsLocation");

    const showAllTeachersBtn = document.createElement("button");
    showAllTeachersBtn.textContent = "Show All Teachers";
    showAllTeachersBtn.className =
      "bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm font-medium";
    teacherSelect.insertAdjacentElement("afterend", showAllTeachersBtn);

    let allTeachers = await loadTeachers();
    let isFiltered = true;

    const populateTeachers = (list, selected = null) => {
      teacherSelect.innerHTML = `<option value="">-- Select Teacher --</option>`;

      list.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = `${t.name} (${t.classCount} classes)`;
        if (selected === t.id) opt.selected = true;
        teacherSelect.appendChild(opt);
      });

      viewBtn.disabled = !teacherSelect.value;
    };

    const applyFilter = () => {
      const loc = locationSelect.value;

      if (!loc || !isFiltered) {
        populateTeachers(allTeachers, this.cls?.teacherId);
        showAllTeachersBtn.textContent = isFiltered ? "Show All Teachers" : "Filter by Location";
        return;
      }

      const filtered = allTeachers.filter(t => t.locationId === loc);
      populateTeachers(filtered, this.cls?.teacherId);
      showAllTeachersBtn.textContent = "Show All Teachers";
    };

    applyFilter();

    teacherSelect.value = this.cls?.teacherId || "";
    viewBtn.disabled = !teacherSelect.value;

    locationSelect.addEventListener("change", () => {
      isFiltered = true;
      applyFilter();
    });

    showAllTeachersBtn.addEventListener("click", () => {
      isFiltered = !isFiltered;
      applyFilter();
    });

    teacherSelect.addEventListener("change", () => {
      viewBtn.disabled = !teacherSelect.value;
    });

    viewBtn.addEventListener("click", async () => {
      if (!teacherSelect.value) return;
      const teacher = await getTeacherData(teacherSelect.value);
      showTeacherModal(teacher);
    });

    // ============================
    // SAVE & CANCEL
    // ============================
    document.getElementById("saveBtn").addEventListener("click", () => {
      withButtonSpinner("saveBtn", () => this.save(), "💾 Save");
    });

    document.getElementById("cancelBtn").addEventListener("click", async () => {
      const { default: ClassesDashboard } = await import("./ClassesDashboard.js");
      const locs = await loadLocations();
      new ClassesDashboard(this.panelTitle, this.panelContent, locs).render();
    });

    this.updateAutoName();
  }

  // ============================
  // SAVE TO FIRESTORE
  // ============================
  async save() {
    const nameInput = document.getElementById("clsName");
    const subjectInput = document.getElementById("clsSubject");
    const langInput = document.getElementById("clsLanguage");
    const gradeInput = document.getElementById("clsGrade");
    const codeInput = document.getElementById("clsCode");
    const onlineInput = document.getElementById("clsOnline");
    const groupInput = document.getElementById("clsGroup");
    const teacherSelect = document.getElementById("clsTeacher");
    const locationSelect = document.getElementById("clsLocation");
    const visibleCheckbox = document.getElementById("clsVisible");

    let valid = true;

    const check = (input, errorId) => {
      if (!input.value.trim()) {
        document.getElementById(errorId).classList.remove("hidden");
        input.classList.add("border-red-500");
        valid = false;
      } else {
        document.getElementById(errorId).classList.add("hidden");
        input.classList.remove("border-red-500");
      }
    };

    check(nameInput, "errorName");
    check(subjectInput, "errorSubject");
    check(langInput, "errorLanguage");
    check(gradeInput, "errorGrade");

    if (!locationSelect.value) {
      document.getElementById("errorLocation").classList.remove("hidden");
      locationSelect.classList.add("border-red-500");
      valid = false;
    } else {
      document.getElementById("errorLocation").classList.add("hidden");
      locationSelect.classList.remove("border-red-500");
    }

    if (!valid) return;

    const selectedTeacherId = teacherSelect.value || null;
    const selectedTeacherName =
      teacherSelect.options[teacherSelect.selectedIndex]?.text.split(" (")[0] || "";

    const selectedCourseIds = Array.from(
      document.querySelectorAll(".course-checkbox:checked")
    ).map(cb => cb.value);
    
    const data = {
      name: nameInput.value.trim(),
      subject: subjectInput.value.trim(),
      language: langInput.value.trim(),
      gradeLevel: gradeInput.value.trim(),
      classCode: codeInput.value.trim(),
      isOnline: onlineInput.value === "online",
      isGroup: groupInput.value === "group",
      teacherId: selectedTeacherId,
      teacherName: selectedTeacherName,
      days: [...this.selectedDays],
      dayTimes: this.dayTimes,
      displayName: generateDisplayName(
        this.dayTimes,
        this.selectedDays,
        onlineInput.value === "online",
        groupInput.value === "group"
      ),
      locationId: locationSelect.value,
      isVisible: visibleCheckbox.checked,
      courseIds: selectedCourseIds
    };

    data.photoUrl = await this.photoUploader.saveImage(this.cls?.id || "new");

    if (this.cls?.id) {
      await ClassService.update(this.cls.id, data);
    } else {
      await ClassService.create(data);
    }

    const { default: ClassesDashboard } = await import("./ClassesDashboard.js");
    const locs = await loadLocations();
    new ClassesDashboard(this.panelTitle, this.panelContent, locs).render();
  }
}
