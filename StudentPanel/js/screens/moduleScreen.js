// js/moduleScreen.js
import { navigateTo } from "../router.js";
import { db } from "../firebase-init.js"; // Import Firestore db
import { doc, getDoc, updateDoc, setDoc, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { auth } from "../firebase-init.js";

// -- Speech Initialization (Bridge to Shared Engine) --
const getSpeech = () => window.CourseEngine?.speech;

function stopSpeech() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  document.querySelectorAll(".avatar-talking").forEach(el => el.classList.remove("avatar-talking"));
}

function speak(text, lang) {
  const engine = getSpeech();
  if (engine) engine.speak(text, lang);
}

function speakWithProfile(text, profile = "female_en_soft", avatarEl = null) {
  stopSpeech();
  const lang = profile.includes("_") ? profile.split("_")[1] || "en" : getLang();

  // For now, we use the engine's standard speak, but we could add profile-specific rate/pitch if needed.
  speak(text, lang);

  if (avatarEl) {
    animateAvatarMouth(avatarEl, profile.includes("soft") ? 1 : 1.2, { onend: null }); // Mock utter for now
  }
}

let currentPartIndex = 0;
let moduleParts = [];
let moduleMeta = { courseTitle: "", moduleId: "", titleRaw: null };

export async function renderModuleScreen(container) {
  container.innerHTML = `
    <div class="h-full flex flex-col">
      <div class="py-2 border-b bg-white flex justify-between items-center">
        <div>
           <h1 id="moduleTitle" class="text-lg font-bold">Module</h1>
           <div id="moduleProgress" class="text-xs text-gray-500"></div>
        </div>
        <div class="flex gap-2">
            <button id="backToCourseBtn" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition-colors font-medium">Back</button>
            <button id="nextPartBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1 rounded text-sm transition-colors font-bold shadow-md shadow-blue-500/20">Next</button>
        </div>
      </div>
      <div id="moduleContent" class="flex-grow relative bg-slate-100 overflow-hidden">
        <div class="absolute inset-0 flex items-center justify-center">Loading module...</div>
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

// Timer state
let stepTimer = null;
let stepTimeLeft = 60;

function resetNextButtonState() {
  const nextBtn = document.getElementById("nextPartBtn");
  if (!nextBtn) return;

  // Disable initially
  nextBtn.disabled = true;
  nextBtn.classList.add("opacity-50", "cursor-not-allowed");
  nextBtn.classList.remove("bg-blue-600", "hover:bg-blue-700");
  nextBtn.classList.add("bg-gray-400"); // Greyed out look

  if (stepTimer) clearInterval(stepTimer);
  stepTimeLeft = 60;

  updateTimerText(nextBtn);

  // Start Countdown
  stepTimer = setInterval(() => {
    stepTimeLeft--;
    if (stepTimeLeft <= 0) {
      enableNextButton();
    } else {
      updateTimerText(nextBtn);
    }
  }, 1000);
}

function updateTimerText(btn) {
  if (currentPartIndex >= moduleParts.length - 1) {
    btn.textContent = `Finish (${stepTimeLeft}s)`;
  } else {
    btn.textContent = `Next (${stepTimeLeft}s)`;
  }
}

function enableNextButton() {
  const nextBtn = document.getElementById("nextPartBtn");
  if (!nextBtn) return;

  if (stepTimer) clearInterval(stepTimer);
  stepTimer = null;

  nextBtn.disabled = false;
  nextBtn.classList.remove("opacity-50", "cursor-not-allowed", "bg-gray-400");
  nextBtn.classList.add("bg-blue-600", "hover:bg-blue-700");

  const isLast = currentPartIndex >= moduleParts.length - 1;
  nextBtn.textContent = isLast ? "Finish" : "Next";
}

async function renderCurrentPart() {
  const container = document.getElementById("moduleContent");
  if (!container) return;

  // Reset Button & Timer Logic
  resetNextButtonState();

  // Listen for Step Completion (Early Unlock)
  // Remove old listener if any? Actually container innerHTML rewrite clears listeners on children, 
  // but we attach to container. Better to use "once" or manage specific handler.
  // Since we replace container content, bubbling events from OLD children are gone.
  // But we need to attach listener to container (parent).
  // Problem: if I attach generic listener, it might duplicate.
  // Solution: Assign `onstepcomplete` handler or similar, or just re-add listener safely.

  // Cleanest: pass onComplete callback directly to renderStep if possible, 
  // BUT renderStep uses Engine.render which triggers event.
  // So we listen for event.

  container.onstepcomplete = (e) => {
    console.log("✅ Step Completed Early!", e.detail);
    enableNextButton();
  };
  // We need to bridge the CustomEvent to this handler property manually or just addEventListener
  // Since `container` persists (it's a div in renderModuleScreen), listeners pile up if we use addEventListener.
  // Let's use a wrapper or recreate container slightly?
  // Or just:

  const part = moduleParts[currentPartIndex];
  if (!part) { container.innerHTML = `<p>No more content.</p>`; return; }

  // Clear previous content (removes old children firing events)
  container.innerHTML = "Loading step...";

  // Re-attach listener specifically for this render cycle
  // Actually, bubbling events are caught by container. 
  // Let's just listen on the wrapper for the duration of this part.
  const stepWrapper = document.createElement('div');
  stepWrapper.className = "w-full h-full";
  stepWrapper.addEventListener('step-complete', () => enableNextButton());

  container.innerHTML = '';
  container.appendChild(stepWrapper);

  if (!part.type || typeof part.type !== "string") { stepWrapper.innerHTML = `<p class="text-red-600">Invalid step type.</p>`; return; }

  try {
    const { renderStep } = await import("../../../Shared/steps/renderStep.js");

    const firebaseUtils = { doc, updateDoc, setDoc, getDoc, increment };
    const speechUtils = { speak, stopSpeech, speakWithProfile };

    await renderStep(stepWrapper, part, {
      db,
      auth,
      firebaseUtils,
      speechUtils,
      commit: true // Enable persistence for student attempts
    });
  } catch (err) {
    console.error(`⚠️ Failed to render part type: ${part.type}`, err);
    container.innerHTML = `<p class="text-red-600">Unsupported or broken part: ${part.type}</p>`;
  }
}

async function handleNextPart() {
  const nextBtn = document.getElementById("nextPartBtn");
  if (nextBtn && nextBtn.disabled) return; // Prevent clicks if disabled

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