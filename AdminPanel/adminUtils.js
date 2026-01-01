// adminUtils.js
import { db } from "./firebase-init.js";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

/**
 * Pads a number with a leading zero if it's less than 10.
 */
export function pad(num) {
  return String(num).padStart(2, "0");
}

// 🚀 Global helper to load all locations from Firestore
export async function loadLocations() {
  const snap = await getDocs(collection(db, "locations"));
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
}

/**
 * Loads all teachers and their current class counts.
 */
export async function loadTeachers() {
  // 1. Get all teachers
  const teacherQuery = query(collection(db, "users"), where("role", "==", "teacher"));
  const teacherSnap = await getDocs(teacherQuery);

  const teachers = teacherSnap.docs.map(d => {
    const data = d.data();

    // Extract locationId from nested structure if necessary
    let locationId = null;

    // Case 1: teacher.locationId exists normally
    if (data.locationId) {
      locationId = data.locationId;
    }

    // Case 2: teacher.location exists as an object
    else if (data.location && typeof data.location === "object") {
      locationId = data.location.id || null;
    }

    // Case 3: teacher.locations (array or object)
    else if (data.locations) {
      const loc = Array.isArray(data.locations)
        ? data.locations[0]
        : data.locations["0"] || null;

      if (loc) locationId = loc.id || loc.locationId || null;
    }

    return {
      id: d.id,
      name: data.name || "Unnamed Teacher",
      locationId: locationId,   // ← FIXED
    };
  });

  // 2. Load all classes to count teacher loads
  const classesSnap = await getDocs(collection(db, "classes"));
  const classCounts = {};

  classesSnap.docs.forEach(cls => {
    const data = cls.data();
    if (data.teacherId) {
      classCounts[data.teacherId] = (classCounts[data.teacherId] || 0) + 1;
    }
  });

  // 3. Merge class counts
  return teachers.map(t => ({
    ...t,
    classCount: classCounts[t.id] || 0,
  }));
}


/**
 * Fetches a single teacher's data from Firestore.
 */
export async function getTeacherData(teacherId) {
  const ref = doc(db, "users", teacherId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: teacherId, ...snap.data() };
}

/**
 * Loads and displays a teacher's classes in a modal list.
 * This is a helper for showTeacherModal.
 */
async function loadTeacherClasses(teacherId, listContainer) {
  const classesSnap = await getDocs(query(collection(db, "classes"), where("teacherId", "==", teacherId)));
  const classes = classesSnap.docs.map(d => d.data());

  if (!classes.length) {
    listContainer.innerHTML = `<li class="text-gray-500">No classes found</li>`;
    return;
  }

  listContainer.innerHTML = classes
    .map(cls => `<li>${cls.name || "Unnamed Class"} (${cls.classCode || "No code"})</li>`)
    .join("");
}

/**
 * Renders a modal with teacher details.
 */
export function showTeacherModal(data) {
  if (!data) return alert("Teacher not found.");

  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50";

  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6 w-96 relative">
      <button id="closeModalBtn" class="absolute top-2 right-3 text-gray-400 hover:text-black text-xl">×</button>
      <h2 class="text-lg font-bold mb-3">${data.name || "Unnamed Teacher"}</h2>
      <p><strong>Email:</strong> ${data.email || "—"}</p>
      <p><strong>Phone:</strong> ${data.phone || "—"}</p>
      <p><strong>Role:</strong> ${data.role || "—"}</p>
      <p><strong>Joined:</strong> ${data.createdAt || "—"}</p>

      <div class="mt-3">
        <strong>Classes:</strong>
        <ul id="teacherClasses" class="list-disc list-inside text-sm text-gray-700 mt-1">
          <li>Loading...</li>
        </ul>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Call the local helper function
  loadTeacherClasses(data.id, modal.querySelector("#teacherClasses"));
  modal.querySelector("#closeModalBtn").addEventListener("click", () => modal.remove());
}


/**
 * Sets up controls for a single spinner (hour or minute).
 */
export function setupSpinner(input, display, upBtn, downBtn, min, max, step, isPad, wrap) {
  let currentValue = parseInt(input.value);

  const update = (value) => {
    currentValue = value;
    input.value = currentValue;
    display.textContent = isPad ? pad(currentValue) : currentValue; // Use imported pad
  };

  upBtn.addEventListener("click", () => _increment());
  downBtn.addEventListener("click", () => _decrement());

  const _increment = () => {
    let newValue = currentValue + step;
    if (newValue > max) {
      newValue = wrap ? min : max;
    }
    update(newValue);
  };

  const _decrement = () => {
    let newValue = currentValue - step;
    if (newValue < min) {
      newValue = wrap ? max : min;
    }
    update(newValue);
  };

  // ⬇️ --- THIS IS THE FIX --- ⬇️
  // We create a single handler for the wheel event
  const wheelHandler = (e) => {
    e.preventDefault(); // Stop the page from scrolling
    if (e.deltaY < 0) {
      // Scrolled up
      _increment();
    } else {
      // Scrolled down
      _decrement();
    }
  };

  // Attach the listener to all visible parts of the spinner
  display.addEventListener("wheel", wheelHandler);
  upBtn.addEventListener("wheel", wheelHandler);
  downBtn.addEventListener("wheel", wheelHandler);
  // ❌ REMOVED: The old listener on the hidden 'input' element is gone.
  // ⬆️ --- END OF FIX --- ⬆️

  update(currentValue); // Initial display
}

/**
 * Creates the HTML for one time picker (e.g., "Start Time").
 */
export function createTimePicker(idPrefix, label, initialHour, initialMinute) {
  return `
    <div class="text-center">
      <label class="block text-sm font-medium text-gray-700 mb-1">${label}</label>
      <div class="flex justify-center items-center gap-2">
        <div class="flex flex-col items-center">
          <button type="button" id="${idPrefix}-hour-up"
                  class="p-1 w-10 bg-blue-500 hover:bg-blue-600 text-white rounded-t-md shadow-sm active:scale-95 transition">▲</button>
          <span id="${idPrefix}-hour-display"
                class="text-3xl font-mono bg-gray-100 border-x border-gray-300 w-16 text-center py-1">
            ${pad(initialHour)} 
          </span>
          <input type="hidden" id="${idPrefix}-hour-input" value="${initialHour}">
          <button type="button" id="${idPrefix}-hour-down"
                  class="p-1 w-10 bg-blue-500 hover:bg-blue-600 text-white rounded-b-md shadow-sm active:scale-95 transition">▼</button>
        </div>

        <span class="text-3xl font-bold pb-2">:</span>

        <div class="flex flex-col items-center">
          <button type="button" id="${idPrefix}-min-up"
                  class="p-1 w-10 bg-blue-500 hover:bg-blue-600 text-white rounded-t-md shadow-sm active:scale-95 transition">▲</button>
          <span id="${idPrefix}-min-display"
                class="text-3xl font-mono bg-gray-100 border-x border-gray-300 w-16 text-center py-1">
            ${pad(initialMinute)}
          </span>
          <input type="hidden" id="${idPrefix}-min-input" value="${initialMinute}">
          <button type="button" id="${idPrefix}-min-down"
                  class="p-1 w-10 bg-blue-500 hover:bg-blue-600 text-white rounded-b-md shadow-sm active:scale-95 transition">▼</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * 🕰️ Generate compact emoji-style name
 */
export function generateDisplayName(dayTimes, selectedDays, isOnline, isGroup) {
  if (selectedDays.size === 0) {
    return "";
  }

  // 1. Get earliest hour
  let earliestHour = 24;
  let hasTime = false;
  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  for (const day of dayOrder) {
    if (selectedDays.has(day)) {
      const time = dayTimes[day];
      if (time) {
        const startHour = parseInt(time.split(":")[0]);
        if (startHour < earliestHour) {
          earliestHour = startHour;
        }
        hasTime = true;
      }
    }
  }
  const hour = hasTime ? earliestHour : "?";

  // 2. Get day abbreviations in correct order
  const dayAbbr = dayOrder
    .filter(d => selectedDays.has(d))
    .map(d => (d === "Thu" ? "Th" : d.charAt(0)))
    .join("");

  // 3. Get icons
  const modeIcon = isOnline ? "💻" : "🛖";
  const groupIcon = isGroup ? "👥" : "👤";

  return `🕰️${hour} ${dayAbbr || "?"} ${modeIcon}${groupIcon}`;
}