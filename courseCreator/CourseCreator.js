//
// ========== CourseCreator.js ==========
//
// NOTE:
// Courses define content only.
// Class ↔ Course assignment is managed from the Class system.
// This tool does NOT assign courses to classes.

// Service Import
import { courseService } from "./services/courseService.js";
import { Modal } from "./components/Modal.js";
import { Toast } from "./components/Toast.js";
import { auth } from "./firebase-init.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

function isAllowedRole(role) {
  return (
    role === "superAdmin" ||
    role === "platformAdmin" ||
    role === "courseCreator"
  );
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    const token = await user.getIdTokenResult(true);
    const role = token.claims?.role;

    if (!isAllowedRole(role)) {
      alert("User not authorized to access Course Creator.");
      await signOut(auth);
      window.location.href = "login.html";
      return;
    }

    // ✅ Authorized → continue loading page
    loadCourses();

  } catch (err) {
    console.error("Auth check failed", err);
    await signOut(auth);
    window.location.href = "login.html";
  }
});

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const coursesList = document.getElementById("coursesList");
const addCourseBtn = document.getElementById("addCourseBtn");

// --- NEW: Language Management Elements ---
const languagesModal = document.getElementById("languagesModal");
const languagesModalBody = document.getElementById("languagesModalBody");
const closeLangModalBtn = document.getElementById("closeLangModalBtn");
const saveLangModalBtn = document.getElementById("saveLangModalBtn");

let allCourses = [];
let activeCourseForLangEdit = null;
let currentLang = "en";

// --- NEW: Central Language Configuration ---
// This is the master list of all languages your platform supports.
const allAvailableLanguages = {
  en: 'English',
  ru: 'Russian',
  kg: 'Kyrgyz',
  'zh-CN': 'Chinese', // Updated from 'cn'
  tr: 'Turkish',
  // Add more languages here in the future!
};

function getCourseHealth(course) {
  if (!course.languages || course.languages.length === 0) return "invalid";
  if (!course.modulesCount || course.modulesCount === 0) return "empty";
  return "ok";
}

function normalizeTitle(title, lang = "en") {
  if (!title) return "";

  // Already a string
  if (typeof title === "string") {
    return title.toLowerCase();
  }

  // Localized object
  if (typeof title === "object") {
    const val =
      title[lang] ??
      title.en ??
      Object.values(title)[0] ??
      "";
    return String(val).toLowerCase();
  }

  return "";
}


const logoutBtn = document.getElementById("logoutBtn");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});


async function loadCourses() {
  renderSkeletons();
  try {
    allCourses = await courseService.getAllCourses();
    renderCourses();
  } catch (err) {
    Toast.error("Error loading courses.");
  }
}

function renderSkeletons() {
  coursesList.innerHTML = Array(6).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text" style="width: 90%;"></div>
      <div class="skeleton skeleton-text" style="width: 60%;"></div>
      <div class="skeleton skeleton-body"></div>
    </div>
  `).join('');
}

async function addCourse() {
  const title = await Modal.prompt("Create New Course", "E.g. Introduction to Science");
  if (!title) return;

  const newCourseData = {
    title,
    description: "",
    status: "active",
    languages: ['en'], // NEW: Defaults to English
    iconUrl: "",
    classes: []
  };

  try {
    const created = await courseService.createCourse(newCourseData);
    allCourses.push(created);
    renderCourses();
    Toast.success("Course created successfully!");
  } catch (err) {
    console.error(err);
    Toast.error("Error creating course.");
  }
}

function renderCourses() {
  const searchText = searchInput.value.toLowerCase();
  const filterStatus = statusFilter.value;

  const filtered = allCourses.filter(c => {
    const titleStr = normalizeTitle(c.title, currentLang);
    const matchesSearch =
      titleStr.includes(searchText) ||
      c.id.toLowerCase().includes(searchText);

    const matchesStatus =
      (c.status || "active") === filterStatus;

    return matchesSearch && matchesStatus;
  });

  coursesList.innerHTML = "";
  if (filtered.length === 0) {
    coursesList.innerHTML = `<p class="text-gray-600">No courses found.</p>`;
    return;
  }
  filtered.forEach(c => renderCourseCard(c));
}

function renderCourseCard(course) {
  const card = document.createElement("div");
  card.className = "group border rounded p-4 shadow bg-white flex flex-col relative";
  const displayTitle = course.title || course.id;

  // --- NEW: Display language badges ---
  const languageBadges = (course.languages || ['en'])
    .map(lang => `<span class="bg-gray-200 text-gray-700 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">${lang.toUpperCase()}</span>`)
    .join('');

  card.innerHTML = `
    <div class="flex-1">
      <h2 class="font-semibold text-lg mb-2">${displayTitle}</h2>
      <p class="text-sm text-gray-600 mb-3">${course.description || ""}</p>
      <div class="mb-3">${languageBadges}</div>
    </div>
    <div class="mt-auto flex gap-2 flex-wrap">
      <button class="archiveBtn bg-yellow-500 text-white px-3 py-1 rounded text-sm">Archive</button>
      <button class="manageBtn bg-blue-600 text-white px-3 py-1 rounded text-sm">Manage Modules</button>
      <button class="langBtn bg-indigo-500 text-white px-3 py-1 rounded text-sm">Languages</button>
      <button class="settingsBtn bg-gray-600 text-white px-3 py-1 rounded text-sm">Settings</button>
      <button class="previewBtn bg-teal-600 text-white px-3 py-1 rounded text-sm">Preview</button>
    </div>

  `;

  const langCount = (course.languages || ['en']).length;
  const healthTag =
    langCount === 1
      ? `<span class="health-tag health-yellow">Single Language</span>`
      : `<span class="health-tag health-green">${langCount} Languages</span>`;

  card.querySelector(".manageBtn").addEventListener("click", () => {
    localStorage.setItem("activeCourseDocId", course.id);
    localStorage.setItem(
      "activeCourseLanguages",
      JSON.stringify(course.languages || ['en'])
    );
    window.location.href = "CourseCreatorModules.html";

  });

  // --- NEW: Event listener for the language button ---
  card.querySelector(".langBtn").addEventListener("click", () => {
    openLanguagesModal(course);
  });


  // --- NEW: Event listener for Preview button ---
  card.querySelector(".previewBtn").addEventListener("click", () => {
    window.open(`CoursePlayer.html?courseId=${course.id}`, '_blank');
  });

  card.querySelector(".settingsBtn").addEventListener("click", () => {
    openCourseSettingsModal(course);
  });


  coursesList.appendChild(card);
}

// --- NEW: Functions to control the languages modal ---
function openLanguagesModal(course) {
  activeCourseForLangEdit = course;
  languagesModalBody.innerHTML = '';

  const currentLangs = course.languages || ['en'];

  for (const [code, name] of Object.entries(allAvailableLanguages)) {
    const isChecked = currentLangs.includes(code) ||
      (code === 'zh-CN' && (currentLangs.includes('cn') || currentLangs.includes('zh')));
    const checkboxHtml = `
      <label class="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded">
        <input type="checkbox" value="${code}" class="form-checkbox h-5 w-5 text-blue-600" ${isChecked ? 'checked' : ''}>
        <span class="text-gray-700">${name}</span>
      </label>
    `;
    languagesModalBody.insertAdjacentHTML('beforeend', checkboxHtml);
  }
  languagesModal.classList.remove('hidden');
}

function closeLanguagesModal() {
  languagesModal.classList.add('hidden');
  activeCourseForLangEdit = null;
}

async function saveLanguages() {
  if (!activeCourseForLangEdit) return;

  const selectedLangs = Array.from(languagesModalBody.querySelectorAll('input:checked'))
    .map(input => input.value);

  if (selectedLangs.length === 0) {
    alert("A course must have at least one language.");
    return;
  }

  await courseService.updateCourse(activeCourseForLangEdit.id, { languages: selectedLangs });

  // Update the local data and re-render
  const courseInAll = allCourses.find(c => c.id === activeCourseForLangEdit.id);
  if (courseInAll) {
    courseInAll.languages = selectedLangs;
  }

  renderCourses();
  closeLanguagesModal();
}

function renderMultiLangInputs(label, fieldKey, valueObj = {}, languages = ['en']) {
  const wrapper = document.createElement("div");
  wrapper.className = "space-y-2";

  const labelEl = document.createElement("label");
  labelEl.className = "text-sm font-semibold";
  labelEl.textContent = label;

  wrapper.appendChild(labelEl);

  languages.forEach(lang => {
    const row = document.createElement("div");
    row.className = "flex items-center gap-2";

    row.innerHTML = `
      <span class="w-12 text-xs font-bold text-gray-600">${lang.toUpperCase()}</span>
      <input
        type="text"
        data-lang="${lang}"
        data-field="${fieldKey}"
        class="flex-1 border rounded px-2 py-1"
        value="${valueObj[lang] || ''}"
      />
    `;
    wrapper.appendChild(row);
  });

  return {
    el: wrapper,
    getValue() {
      const out = {};
      wrapper.querySelectorAll("input").forEach(input => {
        out[input.dataset.lang] = input.value.trim();
      });
      return out;
    }
  };
}

function openCourseSettingsModal(course) {
  const modal = new Modal();

  const langs = course.languages || ['en'];

  const titleInput = renderMultiLangInputs(
    "Course Title",
    "title",
    typeof course.title === "object" ? course.title : { en: course.title || "" },
    langs
  );

  const descriptionInput = renderMultiLangInputs(
    "Course Description",
    "description",
    typeof course.description === "object" ? course.description : { en: course.description || "" },
    langs
  );

  const statusSelect = document.createElement("select");
  statusSelect.className = "border rounded px-2 py-1 w-full";
  ["draft", "active", "archived"].forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s.toUpperCase();
    if ((course.status || "active") === s) opt.selected = true;
    statusSelect.appendChild(opt);
  });

  const container = document.createElement("div");
  container.className = "space-y-4";

  container.appendChild(titleInput.el);
  container.appendChild(descriptionInput.el);

  container.insertAdjacentHTML("beforeend", `
    <div>
      <label class="text-sm font-semibold">Status</label>
      <div class="mt-1"></div>
    </div>
  `);
  container.lastElementChild.appendChild(statusSelect);

  container.insertAdjacentHTML("beforeend", `
    <div class="text-xs text-gray-500">
      Course ID: <code>${course.id}</code>
    </div>
  `);

  modal.setContent(container);

  modal.setActions([
    {
      label: "Cancel",
      action: () => modal.close()
    },
    {
      label: "Save",
      primary: true,
      action: async () => {
        try {
          await courseService.updateCourse(course.id, {
            title: titleInput.getValue(),
            description: descriptionInput.getValue(),
            status: statusSelect.value,
            updatedAt: new Date()
          });

          // update local cache
          const local = allCourses.find(c => c.id === course.id);
          if (local) {
            local.title = titleInput.getValue();
            local.description = descriptionInput.getValue();
            local.status = statusSelect.value;
          }

          renderCourses();
          modal.close();
          Toast.success("Course settings saved");
        } catch (err) {
          console.error(err);
          Toast.error("Failed to save settings");
        }
      }
    }
  ]);

  modal.open();
}


// --- Events ---
searchInput.addEventListener("input", renderCourses);
statusFilter.addEventListener("change", renderCourses);
addCourseBtn.addEventListener("click", addCourse);
closeLangModalBtn.addEventListener('click', closeLanguagesModal);
saveLangModalBtn.addEventListener('click', saveLanguages);

// Initial load
loadCourses();