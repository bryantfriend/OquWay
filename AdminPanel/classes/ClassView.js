import ClassService from "./ClassService.js";
import { withButtonSpinner, spinnerButton } from "../ui/withButtonSpinner.js";
import { db } from "../firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

export default class ClassView {
  constructor(panelTitle, panelContent, cls, locations = []) {
    this.panelTitle = panelTitle;
    this.panelContent = panelContent;
    this.cls = cls;
    this.locations = locations;
    this.studentCache = new Map(); // Cache student data
  }

  async render() {
    this.panelTitle.textContent = this.cls.name;
    
    // ⬇️ NEW: Find the Location Name ⬇️
    const locationName = this.locations.find(l => l.id === this.cls.locationId)?.name || 'No Location Assigned';

    const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const scheduleHtml = this.cls.days && this.cls.days.length > 0
      ? this.cls.days
        .sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
        .map(day => {
          const time = this.cls.dayTimes[day] || "No time set";
          return `<li><strong>${day}:</strong> ${time}</li>`;
        })
        .join("")
      : "<li class='text-gray-500'>No schedule set</li>";
    
    const visibilityStatus = this.cls.isVisible ?? true ? 
    `<span class="text-sm font-semibold text-green-700">Visible in OquWay</span>` : 
    `<span class="text-sm font-semibold text-gray-500">Hidden from OquWay</span>`;

    this.panelContent.innerHTML = `
      ${spinnerButton("backBtn", "← Back", "blue")}
      <div class="bg-white p-6 rounded shadow space-y-2 max-w-xl">
        ${this.cls.photoUrl
          ? `<img src="${this.cls.photoUrl}" alt="Class Photo" class="w-24 h-24 object-cover rounded border mb-4" />`
          : ""}
        <p><strong>Name:</strong> ${this.cls.name}</p>
        <p><strong>Login Display:</strong> ${this.cls.loginDisplayName || "—"}</p>
        <p><strong>Subject:</strong> ${this.cls.subject || "—"}</p>
        <p><strong>Grade Level:</strong> ${this.cls.gradeLevel || "—"}</p>
        <p><strong>Language:</strong> ${this.cls.language || "—"}</p>
        <p><strong>Class Code:</strong> ${this.cls.classCode || "—"}</p>
        <p><strong>Mode:</strong> ${this.cls.isOnline ? "Online" : "Offline"}</p>
        <p><strong>Group Type:</strong> ${this.cls.isGroup ? "Group" : "Individual"}</p>
        <p><strong>Teacher:</strong> ${this.cls.teacherName || "—"}</p>
        <p><strong>Location:</strong> ${locationName}</p>
        <p><strong>Visibility:</strong> ${visibilityStatus}</p>
        
        <div>
          <strong>Schedule:</strong>
          <ul class="list-disc list-inside">${scheduleHtml}</ul>
        </div>

        <div>
          <strong>Students:</strong>
          <ul id="student-list-container" class="list-disc list-inside">
            <li class='text-gray-500'>Loading students...</li>
          </ul>
        </div>
        
        <div>
          <strong>Courses:</strong>
          <ul id="course-list-container" class="list-disc list-inside">
            <li class="text-gray-500">Loading courses...</li>
          </ul>
        </div>


        <div class="flex gap-2 mt-4">
          <button id="editBtn" class="bg-yellow-500 text-white px-4 py-2 rounded">✏️ Edit</button>
          ${spinnerButton("deleteBtn", "🗑️ Delete", "red")}
        </div>
      </div>
    `;

    // 4. --- NEW: Load students AFTER rendering the skeleton ---
    this._loadAndRenderStudents();
    this._loadAndRenderCourses();


    // Back with spinner
    document.getElementById("backBtn").addEventListener("click", () => {
      withButtonSpinner("backBtn", async () => {
        const { default: ClassesDashboard } = await import("./ClassesDashboard.js");
        new ClassesDashboard(this.panelTitle, this.panelContent).render();
      }, "← Back");
    });

    // Edit
    document.getElementById("editBtn").addEventListener("click", async () => {
    const { default: ClassEditor } = await import("./ClassEditor.js");
    // Pass the locations list (this.locations) to the editor
    new ClassEditor(this.panelTitle, this.panelContent, this.cls, this.locations).render(); 
});

    // Delete with spinner
    document.getElementById("deleteBtn").addEventListener("click", () => {
      if (!confirm("Are you sure you want to delete this class?")) return;

      withButtonSpinner("deleteBtn", async () => {
        await ClassService.remove(this.cls.id);
        const { default: ClassesDashboard } = await import("./ClassesDashboard.js");
        new ClassesDashboard(this.panelTitle, this.panelContent).render();
      }, "🗑️ Delete");
    });
  }

  /**
   * 5. --- NEW: Fetches student data and populates the list ---
   */
  async _loadAndRenderStudents() {
    const container = document.getElementById("student-list-container");
    if (!container) return;

    const studentIds = this.cls.students || [];
    if (studentIds.length === 0) {
      container.innerHTML = "<li class='text-gray-500'>No students assigned</li>";
      return;
    }

    try {
      const studentPromises = studentIds.map(id => this._getStudentData(id));
      const students = await Promise.all(studentPromises);
      
      const studentsHtml = students.map(student => {
        if (!student) return "<li class='text-red-500'>Error loading student</li>";
        
        // Add to cache for the modal
        this.studentCache.set(student.id, student); 
        
        return `
          <li data-student-id="${student.id}" 
              class="text-blue-600 hover:text-blue-800 cursor-pointer"
              title="Click to view details">
            ${student.name} (${student.phone || 'No phone'})
          </li>
        `;
      }).join("");

      container.innerHTML = studentsHtml;

      // Add click listeners
      container.querySelectorAll("[data-student-id]").forEach(li => {
        li.addEventListener("click", () => {
          const student = this.studentCache.get(li.dataset.studentId);
          if (student) {
            this._showStudentModal(student);
          }
        });
      });

    } catch (error) {
      console.error("Error loading students:", error);
      container.innerHTML = "<li class='text-red-500'>Could not load students.</li>";
    }
  }
  
  async _loadAndRenderCourses() {
  const container = document.getElementById("course-list-container");
  if (!container) return;

  const courseIds = this.cls.courses || [];
  if (courseIds.length === 0) {
    container.innerHTML = "<li class='text-gray-500'>No courses assigned</li>";
    return;
  }

  try {
    const promises = courseIds.map(id =>
      getDoc(doc(db, "courses", id))
    );

    const snaps = await Promise.all(promises);

    const html = snaps.map(snap => {
      if (!snap.exists()) {
        return `<li class="text-red-500">Missing course</li>`;
      }
      const c = snap.data();
      return `<li>${c.title || c.name || "Untitled Course"}</li>`;
    }).join("");

    container.innerHTML = html;

  } catch (err) {
    console.error(err);
    container.innerHTML =
      "<li class='text-red-500'>Error loading courses</li>";
  }
}


  /**
   * 6. --- NEW: Helper to fetch a single student ---
   */
  async _getStudentData(studentId) {
    if (!studentId) return null;
    try {
      const userRef = doc(db, 'users', studentId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        console.warn(`Student not found for ID: ${studentId}`);
        return { id: studentId, name: "Unknown Student", phone: "N/A" };
      }
    } catch (error) {
      console.error("Error fetching student:", error);
      return null;
    }
  }

  /**
   * 7. --- NEW: Renders a modal with student details ---
   */
  _showStudentModal(student) {
    const modal = document.createElement("div");
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4";

    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button id="closeModalBtn" class="absolute top-2 right-3 text-gray-400 hover:text-black text-xl">×</button>
        <h2 class="text-xl font-bold mb-4">${student.name || "Student Details"}</h2>
        
        <div class="space-y-2">
          <p><strong>Phone:</strong> ${student.phone || "—"}</p>
          <p><strong>Email:</strong> ${student.email || "—"}</p>
          <p><strong>Role:</strong> ${student.role || "—"}</p>
          <p><strong>Language:</strong> ${student.language || "—"}</p>
          <p><strong>Grade Level:</strong> ${student.gradeLevel || "—"}</p>
          <p><strong>Payment Model:</strong> ${student.paymentModel || "—"}</p>
          <p><strong>Tuition Owed:</strong> ${student.tuitionOwed || 0} KGS</p>
        </div>
        
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector("#closeModalBtn").addEventListener("click", () => modal.remove());
    // Click outside to close
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
}
