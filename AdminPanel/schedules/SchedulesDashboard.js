// /AdminPanel/js/AdminPanel/schedules/SchedulesDashboard.js
import { db } from "../firebase-init.js";
import {
  collection, query, where, getDocs, getDoc, doc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { createScheduleGrid, fillGrid } from "./ScheduleGrid.js";
import { openScheduleModal } from "./ScheduleModal.js";

export default class SchedulesDashboard {
  constructor(titleEl, contentEl) {
    this.titleEl = titleEl;
    this.contentEl = contentEl;
    this.locationId = "intra_it"; // default for this academy
  }

  async render() {
    this.titleEl.textContent = "🗓️ Teacher Schedule – INTRA IT";
    this.contentEl.innerHTML = `
      <div class="bg-white p-4 rounded shadow mb-4 flex justify-between items-center">
        <h2 class="text-lg font-semibold text-gray-700">Weekly Schedule (9 AM – 10 PM)</h2>
        <input id="teacherSearch" placeholder="Search teacher..." class="border rounded px-3 py-2 text-sm w-64">
      </div>
      <div id="scheduleGrid" class="overflow-auto"></div>
    `;

    const teachers = await this.loadTeachers();
    const classes  = await this.loadClasses();

    createScheduleGrid("scheduleGrid");
    fillGrid(classes, teachers, (classData) => openScheduleModal(classData, teachers));
    this.attachSearch(teachers, classes);
  }

  async loadTeachers() {
    const snap = await getDocs(
      query(collection(db, "users"), where("role", "==", "teacher"), where("locationId", "==", this.locationId))
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async loadClasses() {
    const snap = await getDocs(
      query(collection(db, "classes"), where("locationId", "==", this.locationId))
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  attachSearch(teachers, classes) {
    document.getElementById("teacherSearch").addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      const filteredTeachers = teachers.filter(t => t.name.toLowerCase().includes(term));
      createScheduleGrid("scheduleGrid");
      fillGrid(classes.filter(c => filteredTeachers.some(t => t.id === c.teacherId)), filteredTeachers, (classData) =>
        openScheduleModal(classData, teachers)
      );
    });
  }
}
