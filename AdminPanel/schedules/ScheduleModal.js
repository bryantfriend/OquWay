// /AdminPanel/js/AdminPanel/schedules/ScheduleModal.js
import { db } from "../firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

export async function openScheduleModal(classData, teachers) {
  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
      <h2 class="text-lg font-semibold mb-3 text-blue-700">${classData.name}</h2>
      <p class="text-sm text-gray-700 mb-2">
        <strong>Teacher:</strong> ${teachers.find(t => t.id === classData.teacherId)?.name || "—"}
      </p>
      <p class="text-sm text-gray-700 mb-2">
        <strong>Schedule:</strong><br>
        ${classData.schedule.map(s => `${capitalize(s.day)} ${s.start}–${s.end}`).join("<br>")}
      </p>
      <div class="mb-2"><strong>Students:</strong></div>
      <ul id="studentList" class="list-disc pl-5 text-sm text-gray-700 mb-4">
        <li>Loading...</li>
      </ul>
      <button id="closeModal" class="px-4 py-2 bg-blue-600 text-white rounded">Close</button>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById("closeModal").onclick = () => modal.remove();

  // load students
  const list = document.getElementById("studentList");
  if (!Array.isArray(classData.students) || classData.students.length === 0) {
    list.innerHTML = "<li>No students assigned</li>";
    return;
  }

  const names = [];
  for (const sid of classData.students) {
    const snap = await getDoc(doc(db, "users", sid));
    if (snap.exists()) names.push(snap.data().name);
  }
  list.innerHTML = names.map(n => `<li>${n}</li>`).join("");
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
