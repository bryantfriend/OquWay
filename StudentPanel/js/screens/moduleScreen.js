// js/moduleScreen.js
import { navigateTo } from "../router.js";
import { db } from "../firebase-init.js"; // Import Firestore db
import { doc, getDoc, updateDoc, setDoc, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { speak, stopSpeech, speakWithProfile } from "../utils/speech.js";
import { auth } from "../firebase-init.js";

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
    // Optimization: Start importing renderStep NOW, while DB fetches (browser will enable cache for subsequent import)
    const _preloadRenderStep = import("../../../Shared/steps/renderStep.js");

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
    // Unified Shared Renderer
    const { renderStep } = await import("../../../Shared/steps/renderStep.js");

    // Prepare Context Dependencies
    const firebaseUtils = { doc, updateDoc, setDoc, getDoc, increment };
    const speechUtils = { speak, stopSpeech, speakWithProfile };

    await renderStep(container, part, {
      db,
      auth,
      firebaseUtils,
      speechUtils
    });
  } catch (err) {
    console.error(`⚠️ Failed to render part type: ${part.type}`, err);
    container.innerHTML = `<p class="text-red-600">Unsupported or broken part: ${part.type}</p>`;
  }
}

async function handleNextPart() {
  if (currentPartIndex >= moduleParts.length - 1) {
    try {
      await markModuleCompletedSafe();
      alert("🎉 You’ve completed this module!");
    } catch (err) {
      console.error("❌ Failed to save module completion:", err);
      alert("⚠️ Progress could not be saved. Please try again.");
      return;
    }

    navigateTo("coursePlayerScreen");
    return;
  }

  currentPartIndex++;
  updateProgress();
  renderCurrentPart();
}

async function markModuleCompletedSafe() {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  const courseId = localStorage.getItem("activeCourseDocId");
  const moduleId = localStorage.getItem("activeModuleId");

  if (!courseId || !moduleId) {
    throw new Error("Missing course or module ID");
  }

  const progressRef = doc(
    db,
    "users",
    user.uid,
    "modules_completed",
    moduleId
  );

  await setDoc(progressRef, {
    courseId,
    moduleId,
    completedAt: serverTimestamp()
  }, { merge: true });

  console.log(`✅ Module ${moduleId} completion saved for ${user.uid}`);
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