// js/moduleScreen.js
import { navigateTo } from "../router.js";
import { db } from "../firebase-init.js"; // Import Firestore db
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"; // Import Firestore functions

let currentPartIndex = 0;
let moduleParts = [];
let moduleMeta = { courseTitle: "", moduleId: "", titleRaw: null };

export async function renderModuleScreen(container) {
  container.innerHTML = `
    <div class="p-4">
      <h1 id="moduleTitle" class="text-xl font-bold mb-4">Module</h1>
      <div id="moduleProgress" class="text-sm text-gray-600 mb-2"></div>
      <div id="moduleContent" class="bg-white p-4 rounded shadow mb-4">Loading module...</div>
      <div class="flex justify-between items-center gap-2">
        <button id="backToCourseBtn" class="bg-gray-500 text-white px-4 py-2 rounded">Back</button>
        <button id="nextPartBtn" class="bg-blue-600 text-white px-4 py-2 rounded">Next</button>
      </div>
    </div>
  `;

  document.getElementById("backToCourseBtn").addEventListener("click", handlePreviousPart);
  document.getElementById("nextPartBtn").addEventListener("click", handleNextPart);

  const moduleId = localStorage.getItem("activeModuleId");
  const courseId = localStorage.getItem("activeCourseDocId"); // We need the courseId too

  if (!moduleId || !courseId) {
    document.getElementById("moduleContent").innerHTML = `<p class="text-red-600">Missing module or course info.</p>`;
    return;
  }

  moduleMeta = { courseTitle: "", moduleId: moduleId, titleRaw: null };

  // This function is now rewritten to load from Firestore
  await loadModuleFromFirestore(courseId, moduleId); 

  document.addEventListener("oquway:languageChanged", onLanguageChangedOncePerScreen);
}

// --- HELPER FUNCTIONS (No change here) ---
function getLang() { /* ... */ }
function resolveLocalized(val, lang = getLang()) { /* ... */ }
function onLanguageChangedOncePerScreen() { /* ... */ }


// --- DATA LOADING (REWRITTEN) ---
async function loadModuleFromFirestore(courseId, moduleId) {
  const container = document.getElementById("moduleContent");

  try {
    // --- NEW LOGIC: Get the specific module document from the subcollection ---
    const moduleRef = doc(db, "courses", courseId, "modules", moduleId);
    const moduleSnap = await getDoc(moduleRef);

    if (!moduleSnap.exists()) {
        throw new Error(`Module ${moduleId} not found in Firestore.`);
    }

    const moduleData = moduleSnap.data();
    moduleParts = moduleData.steps || []; // Get steps from the document
    currentPartIndex = 0;
    moduleMeta.titleRaw = moduleData.title;

    document.getElementById("moduleTitle").textContent = resolveLocalized(moduleMeta.titleRaw);

    updateProgress();
    await renderCurrentPart();
  } catch (err) {
    console.error("❌ Failed to load module from Firestore:", err);
    container.innerHTML = `<p class="text-red-600">Error loading module data.</p>`;
  }
}

// --- UI AND NAVIGATION LOGIC (No major changes below this line) ---

function updateProgress() {
  const progressEl = document.getElementById("moduleProgress");
  if (!progressEl) return;
  const total = moduleParts.length || 0;
  const currentStep = currentPartIndex + 1;
  progressEl.textContent = total ? `Step ${currentStep} of ${total}` : "";
  const nextBtn = document.getElementById("nextPartBtn");
  if (nextBtn) { nextBtn.textContent = currentStep >= total ? "Finish" : "Next"; }
  const backBtn = document.getElementById("backToCourseBtn");
  if (backBtn) { backBtn.textContent = currentPartIndex === 0 ? "Back to Course" : "Back"; }
}

async function renderCurrentPart() {
  const container = document.getElementById("moduleContent");
  if (!container) return;
  const part = moduleParts[currentPartIndex];
  if (!part) { container.innerHTML = `<p>No more content.</p>`; return; }
  if (!part.type || typeof part.type !== "string") { container.innerHTML = `<p class="text-red-600">Invalid step type.</p>`; return; }

  try {
    const fileName = `render${capitalize(part.type)}.js`;
    const mod = await import(`../steps/${fileName}`);
    const renderer = mod.default || mod.render;
    if (typeof renderer !== "function") {
      throw new Error(`Renderer missing default export in ${fileName}`);
    }
    renderer(container, part);
  } catch (err) {
    console.error(`⚠️ Failed to render part type: ${part.type}`, err);
    container.innerHTML = `<p class="text-red-600">Unsupported or broken part: ${part.type}</p>`;
  }
}

function handleNextPart() {
  if (currentPartIndex >= moduleParts.length - 1) {
    alert("🎉 You’ve completed this module!");
    navigateTo("coursePlayerScreen");
    return;
  }
  currentPartIndex++;
  updateProgress();
  renderCurrentPart();
}

function handlePreviousPart() {
  if (currentPartIndex <= 0) {
    navigateTo("coursePlayerScreen");
    return;
  }
  currentPartIndex--;
  updateProgress();
  renderCurrentPart();
}

function capitalize(str = "") {
  return str.charAt(0).toUpperCase() + str.slice(1);
}