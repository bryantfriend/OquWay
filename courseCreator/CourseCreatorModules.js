//
// ========== CourseCreatorModules.js ==========
//

import { courseService } from "./services/courseService.js";
import { assetService } from "./services/assetService.js";
import { Modal } from "./components/Modal.js";
import { Toast } from "./components/Toast.js";

// Import the step classes from our separate file
import { stepClasses } from "./StepTypes.js";
import { renderDialogueLineItem, renderRoleplaySceneItem } from "./StepTypes.js";

import { auth } from "./firebase-init.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  }
});


// --- Element Selectors & Application State ---
const modulesList = document.getElementById("modulesList");
const addModuleBtn = document.getElementById("addModuleBtn");
const previewCourseBtn = document.createElement("button"); // Create it dynamically or assume it's in HTML (better to create if not there)
// Actually, let's just append it to the header or insert it.
// Looking at the HTML structure would be best, but I don't have CourseCreatorModules.html open.
// I'll assume I can insert it after backBtn for now, or just find the header container.
// Let's stick to safely adding it via JS if the element doesn't exist, OR just expect the user to see it if I add it to the HTML.
// Since I can't restart the server to reload HTML easily without user action, JS injection is safer.

const addStepModal = document.getElementById("addStepModal");
const importModuleBtn = document.getElementById("importModuleBtn");
const importModal = document.getElementById("importModal");
const cancelImportBtn = document.getElementById("cancelImportBtn");
const confirmImportBtn = document.getElementById("confirmImportBtn");
const jsonImportData = document.getElementById("jsonImportData");
let closeModalBtn = document.getElementById("closeModalBtn");
let stepSearchInput = document.getElementById("stepSearchInput");
let stepOptionsGrid = document.getElementById("stepOptionsGrid");

let currentCourseId = localStorage.getItem("activeCourseDocId");
let activeModuleData = null;
let activeStepEditor = {
    courseId: null,
    moduleId: null,
    stepIndex: -1,
    insertionIndex: -1,
};
let courseCache = {}; // Cache course data to avoid re-fetching

// --- Dynamically generate availableSteps from the imported registry ---
const availableSteps = Object.entries(stepClasses).map(([typeId, stepClass]) => ({
    typeId,
    displayName: stepClass.displayName,
    description: stepClass.description,
    defaultData: stepClass.defaultData,
}));

// --- Utility Function for Auto-Saving ---
function debounce(func, delay = 1500) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => { func.apply(this, args); }, delay);
    };
}

// --- FORM ELEMENT RENDERERS MAP ---
// Define once; new steps can add their own later if needed.
const listItemRenderers = {
    options: renderSimpleListItem,
    pairs: renderPairListItem,
    items: renderAudioLessonItem,
    lines: renderDialogueLineItem,
    scenes: renderRoleplaySceneItem,
    // You can easily add more field types later
};

const debouncedSaveSteps = debounce(async (courseId, moduleId, steps) => {
    await courseService.updateModule(courseId, moduleId, { steps });
}, 1000);


// =================================================================================
// MAIN APPLICATION LOGIC
// =================================================================================

async function loadModules(courseId) {
    if (!courseId) {
        modulesList.innerHTML = `<p class="text-red-600">No course selected.</p>`;
        return;
    }

    // Fetch and cache parent course data to get language settings
    const courseData = await courseService.getCourse(courseId);
    if (courseData) {
        courseCache[courseId] = courseData; // Store course data
        courseName.textContent = courseCache[courseId].title || courseId;
    } else {
        courseName.textContent = "Course not found";
        modulesList.innerHTML = '';
        return;
    }

    // 🔤 Display course languages under the course title
    const langEl = document.getElementById("courseLanguages");
    if (langEl) {
        const langs = courseCache[courseId].languages || ['en'];
        langEl.textContent = `Languages: ${langs.map(l => l.toUpperCase()).join(', ')}`;
    }


    renderModuleSkeletons();

    // Query modules and order them by the 'order' field
    const modules = await courseService.getModules(courseId);

    if (modules.length === 0) {
        modulesList.innerHTML = `<p class="text-gray-600">No modules found.</p>`;
        return;
    }

    modulesList.innerHTML = "";
    modules.forEach(mod => {
        renderModuleEditor(courseId, mod.id, mod);
    });

    // Initialize SortableJS for the entire modules list
    new Sortable(modulesList, {
        handle: '.drag-handle', // Only allow dragging via the handle
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: async (evt) => {
            const orderedIds = Array.from(modulesList.querySelectorAll('.module-card')).map(c => c.dataset.moduleId);
            await courseService.reorderModules(courseId, orderedIds);
        }
    });
}

function renderModuleSkeletons() {
    modulesList.innerHTML = Array(3).fill(0).map(() => `
      <div class="skeleton-card mb-4">
        <div class="flex justify-between items-center">
             <div class="flex gap-3 w-full">
                <div class="skeleton" style="width: 20px; height: 20px;"></div>
                <div class="skeleton skeleton-title" style="width: 50%;"></div>
             </div>
             <div class="skeleton" style="width: 20px; height: 20px; border-radius: 50%;"></div>
        </div>
      </div>
    `).join('');
}

function renderModuleEditor(courseId, moduleId, moduleData) {
    const card = document.createElement("div");
    card.className = "bg-white shadow p-4 rounded mb-4 module-card";
    card.dataset.moduleId = moduleId;

    // =======================================================
    // ======== TEMPORARY DEBUGGING CODE: ADD THIS ========
    // =======================================================
    console.log("Attempting to render module with ID:", moduleId);
    if (!moduleId || typeof moduleId !== 'string' || moduleId.trim() === "") {
        console.error("CRITICAL ERROR: The moduleId is invalid!", { id: moduleId, data: moduleData });
        alert("Found a module with a missing or invalid ID. Check the developer console for the broken module's data.");
        return; // Stop this function from continuing and crashing
    }
    // =======================================================
    // =======================================================
    let displayTitle = moduleData.title || moduleId;
    if (typeof displayTitle === 'object' && displayTitle !== null) {
        displayTitle = displayTitle.en || Object.values(displayTitle)[0] || moduleId;
    }

    // Also, handle the value for the input field separately to avoid [object Object] there.
    const titleInputValue = (typeof moduleData.title === 'object' && moduleData.title !== null)
        ? (moduleData.title.en || '')
        : (moduleData.title || '');

    card.innerHTML = `
      <div class="flex justify-between items-center cursor-pointer module-toggle">
        <div class="flex items-center gap-3">
            <span class="drag-handle cursor-move text-gray-400" title="Drag to reorder">⠿</span>
            <h2 class="font-semibold text-lg">${displayTitle}</h2>
        </div>
        <div class="flex items-center">
            <span class="text-2xl expand-icon">▶</span>
            <button class="deleteBtn text-red-600 ml-4 p-1">🗑️</button>
        </div>
      </div>
      
      <div class="module-content mt-4 border-t pt-4 hidden">
          <div class="grid grid-cols-2 gap-2">
            <input class="border p-2 rounded col-span-2 module-autosave" data-field="title" placeholder="Module Title" value="${titleInputValue}">
            <label class="col-span-2 text-sm text-gray-600">Default Unlock Date</label>
            <input class="border p-2 rounded col-span-2 module-autosave" data-field="startDate" type="date" value="${moduleData.startDate || ""}">
          </div>
          <div class="mt-2 flex items-center">
            <button class="saveBtn bg-blue-600 text-white px-3 py-1 rounded flex items-center justify-center">💾 Save Now</button>
            <span class="save-status text-sm text-gray-500 ml-2"></span>
          </div>
          <div class="mt-4 border-t pt-4">
            <h3 class="font-semibold mb-2">Steps (drag to reorder)</h3>
            <div class="relative">
              <div class="steps-list space-y-2" id="steps-list-${moduleId}"></div>
              <div class="step-inserter hidden" id="step-inserter-${moduleId}">
                  <div class="line"></div><button class="add-here-btn">+</button><div class="line"></div>
              </div>
            </div>
            <button class="addStepBtn mt-3 bg-green-600 text-white px-3 py-1 rounded">➕ Add Step to End</button>
          </div>
      </div>
    `;

    // --- Event Listeners ---
    const toggle = card.querySelector('.module-toggle');
    const content = card.querySelector('.module-content');
    const icon = card.querySelector('.expand-icon');
    toggle.addEventListener('click', (e) => {
        if (e.target.closest('.deleteBtn') || e.target.closest('.drag-handle')) return;
        content.classList.toggle('hidden');
        icon.textContent = content.classList.contains('hidden') ? '▶' : '▼';
    });
    const debouncedSave = debounce(() => saveModule(courseId, moduleId, moduleData, card));
    card.querySelectorAll('.module-autosave').forEach(input => {
        input.addEventListener('input', () => {
            card.querySelector('.save-status').textContent = 'Unsaved changes...';
            debouncedSave();
        });
    });
    card.querySelector(".deleteBtn").addEventListener("click", () => deleteModule(courseId, moduleId, displayTitle, card));
    card.querySelector(".saveBtn").addEventListener("click", () => saveModule(courseId, moduleId, moduleData, card));
    card.querySelector(".addStepBtn").addEventListener("click", () => {
        const totalSteps = moduleData.steps?.length || 0;
        openStepSelector(courseId, moduleId, moduleData, totalSteps);
    });
    const stepsListContainer = card.querySelector(`#steps-list-${moduleId}`);
    renderStepsList(stepsListContainer, courseId, moduleId, moduleData);
    const inserter = card.querySelector(`#step-inserter-${moduleId}`);
    let hideInserterTimeout;
    stepsListContainer.addEventListener('mousemove', (e) => {
        clearTimeout(hideInserterTimeout);
        const stepCards = Array.from(stepsListContainer.querySelectorAll('.step-card'));
        let closestIndex = stepCards.length;
        let smallestDistance = Infinity;
        stepCards.forEach((card, index) => {
            const rect = card.getBoundingClientRect();
            const midPoint = rect.top + rect.height / 2;
            const distance = Math.abs(e.clientY - midPoint);
            if (distance < smallestDistance) {
                smallestDistance = distance;
                closestIndex = (e.clientY < midPoint) ? index : index + 1;
            }
        });
        let topPosition = 0;
        if (stepCards.length > 0) {
            if (closestIndex === 0) {
                topPosition = 0;
            } else {
                const cardBefore = stepCards[closestIndex - 1];
                topPosition = cardBefore.offsetTop + cardBefore.offsetHeight + 4;
            }
        }
        inserter.style.top = `${topPosition}px`;
        inserter.classList.add('visible');
        activeStepEditor.insertionIndex = closestIndex;
    });
    stepsListContainer.addEventListener('mouseleave', () => {
        hideInserterTimeout = setTimeout(() => {
            inserter.classList.remove('visible');
        }, 5000);
    });
    inserter.querySelector('.add-here-btn').addEventListener('click', () => {
        clearTimeout(hideInserterTimeout);
        inserter.classList.remove('visible');
        openStepSelector(courseId, moduleId, moduleData, activeStepEditor.insertionIndex);
    });
    modulesList.appendChild(card);
}

function renderStepsList(container, courseId, moduleId, moduleData) {
    container.innerHTML = "";
    const steps = moduleData.steps || [];
    steps.forEach((stepData, index) => {
        const StepClass = stepClasses[stepData.type];
        if (StepClass) {
            container.insertAdjacentHTML('beforeend', new StepClass(stepData).renderSummary(index));
        }
    });
    const stepsWrapper = container.parentElement;
    container.querySelectorAll('.editStepBtn').forEach(btn => btn.addEventListener('click', (e) => {
        const index = e.target.closest('.step-card').dataset.stepIndex;
        openStepEditor(courseId, moduleId, moduleData, parseInt(index));
    }));
    container.querySelectorAll('.deleteStepBtn').forEach(btn => btn.addEventListener('click', async (e) => {
        const index = e.target.closest('.step-card').dataset.stepIndex;
        if (confirm(`Delete Step ${index + 1}?`)) {
            showStepsLoadingOverlay(stepsWrapper);
            await deleteStep(courseId, moduleId, moduleData, parseInt(index));
            const updatedModuleSnap = await courseService.getModule(courseId, moduleId);
            if (updatedModuleSnap) {
                moduleData.steps = updatedModuleSnap.steps;
                renderStepsList(container, courseId, moduleId, moduleData);
            }
            hideStepsLoadingOverlay(stepsWrapper);
        }
    }));
    container.querySelectorAll('.duplicateStepBtn').forEach(btn => btn.addEventListener('click', async (e) => {
        showStepsLoadingOverlay(stepsWrapper);
        const index = e.target.closest('.step-card').dataset.stepIndex;
        await duplicateStep(courseId, moduleId, moduleData, parseInt(index));
        const updatedModuleSnap = await courseService.getModule(courseId, moduleId);
        if (updatedModuleSnap) {
            moduleData.steps = updatedModuleSnap.steps;
            renderStepsList(container, courseId, moduleId, moduleData);
        }
        hideStepsLoadingOverlay(stepsWrapper);
    }));
    new Sortable(container, {
        animation: 150, ghostClass: 'sortable-ghost',
        onEnd: async (evt) => {
            showStepsLoadingOverlay(stepsWrapper);
            const newSteps = [...(moduleData.steps || [])];
            const [movedItem] = newSteps.splice(evt.oldIndex, 1);
            newSteps.splice(evt.newIndex, 0, movedItem);
            moduleData.steps = newSteps;
            await debouncedSaveSteps(courseId, moduleId, newSteps);
            renderStepsList(container, courseId, moduleId, moduleData);
            hideStepsLoadingOverlay(stepsWrapper);
        }
    });
}

async function openStepEditor(courseId, moduleId, moduleData, index) {
    activeStepEditor = { courseId, moduleId, stepIndex: index };
    activeModuleData = moduleData;
    const stepData = moduleData.steps[index];
    const StepClass = stepClasses[stepData.type];
    if (!StepClass) return alert(`Error: Unknown step type "${stepData.type}"`);

    const courseLanguages = courseCache[courseId]?.languages || ['en'];
    const stepInstance = new StepClass(stepData, courseLanguages);

    const modalContent = addStepModal.querySelector('.bg-white');
    modalContent.innerHTML = `<div class="flex justify-between items-center p-4 border-b"><h3 class="text-xl font-semibold">Edit Step ${index + 1}: ${StepClass.displayName}</h3><button id="closeEditorBtn" class="text-gray-500 hover:text-gray-800 text-2xl">×</button></div><div id="step-editor-form" class="p-4">${stepInstance.renderEditorForm()}</div><div class="flex justify-end p-4 border-t bg-gray-50"><button id="saveStepBtn" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center">Save Changes</button></div>`;
    addStepModal.classList.remove('hidden');
    modalContent.querySelector('#closeEditorBtn').addEventListener('click', closeStepEditor);
    modalContent.querySelector('#saveStepBtn').addEventListener('click', saveStepChanges);
    attachFormEventListeners();
}

async function saveStepChanges() {
    const saveBtn = document.getElementById('saveStepBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = `<div class="loading-spinner"></div> Saving...`; }
    const { courseId, moduleId, stepIndex } = activeStepEditor;
    const form = document.getElementById('step-editor-form');
    if (!form) return alert('Could not find form to save.');
    const newSteps = [...activeModuleData.steps];
    const originalStepData = newSteps[stepIndex];
    const StepClass = stepClasses[originalStepData.type];
    if (!StepClass) return alert(`Error: Unknown step type "${originalStepData.type}"`);
    const courseLanguages = courseCache[courseId]?.languages || ['en'];
    const stepInstance = new StepClass(originalStepData, courseLanguages);
    const updatedStepData = stepInstance.saveFromForm(form);
    newSteps[stepIndex] = updatedStepData;
    await debouncedSaveSteps(courseId, moduleId, newSteps);
    closeStepEditor();
    loadModules(currentCourseId);
}

function attachFormEventListeners() {
    const form = document.getElementById("step-editor-form");
    if (!form) return;

    form.addEventListener("click", (e) => {
        // Remove item
        if (e.target.classList.contains("remove-item-btn")) {
            e.target.closest(".list-item, .list-item-card")?.remove();
            return;
        }

        // Add new item
        if (e.target.id === "voicePreviewBtn") {
            const sampleText = "This is your voice preview. Adjust profile in renderRoleplaySequence.";
            import("../utils/speech.js").then(({ speakWithProfile }) => speakWithProfile(sampleText, "female_en_soft"));
        }


        if (e.target.classList.contains("add-item-btn")) {
            const lang = e.target.dataset.lang;
            const listContainer = e.target.previousElementSibling;
            const field = e.target.closest("[data-list-field]")?.dataset.listField;
            if (!field) return;

            const renderer = listItemRenderers[field];
            const courseLanguages = courseCache[currentCourseId]?.languages || ["en"];
            let newItemHtml = "";

            // Default case if no renderer exists
            if (renderer) {
                if (lang === "complex") {
                    // Pick the default complex item schema from its Step class
                    const defaultData =
                        Object.values(stepClasses)
                            .find(c => c.defaultData?.[field])?.defaultData?.[field] || {};
                    newItemHtml = renderer(null, defaultData, listContainer.children.length, courseLanguages);
                } else {
                    newItemHtml = renderer(lang, {}, listContainer.children.length);
                }
            } else {
                newItemHtml = `<div class="text-gray-400 text-sm">(Unknown field type: ${field})</div>`;
            }

            listContainer.insertAdjacentHTML("beforeend", newItemHtml);
        }

        // Add nested options (for Roleplay Scenes)
        if (e.target.classList.contains("add-option-btn")) {
            const parent = e.target.closest("[data-list-field='options']");
            const courseLanguages = courseCache[currentCourseId]?.languages || ["en"];
            const newOption = renderRoleplayOptionItem(
                { text: { en: "" }, isCorrect: false, feedback: { en: "" } },
                parent.children.length,
                courseLanguages
            );
            parent.insertAdjacentHTML("beforeend", newOption);
        }

        // Upload Asset Button
        if (e.target.closest(".upload-asset-btn")) {
            const btn = e.target.closest(".upload-asset-btn");
            const fileInput = btn.parentElement.querySelector(".asset-file-input");
            if (fileInput) {
                // Remove any previous handlers to prevent duplicate firing
                fileInput.onchange = null;

                fileInput.onchange = async (ev) => {
                    const file = ev.target.files[0];
                    if (!file) return;

                    const originalText = btn.innerHTML;
                    btn.innerHTML = `<div class="loading-spinner" style="width:12px;height:12px;border-width:2px;margin:0;"></div>`;
                    btn.disabled = true;

                    try {
                        const url = await assetService.uploadFile(file);
                        const textInput = btn.parentElement.querySelector('input[type="text"]');
                        if (textInput) {
                            textInput.value = url;
                        }
                        Toast.success("File uploaded successfully!");
                    } catch (err) {
                        console.error("Upload failed:", err);
                        Toast.error("Upload failed. Check console.");
                    } finally {
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                        fileInput.value = ""; // Reset
                    }
                };
                fileInput.click();
            }
        }
    });
}

function closeStepEditor() {
    addStepModal.classList.add('hidden');
    const modalContent = addStepModal.querySelector('.bg-white');
    // Set the modal back to its default "select step" state
    modalContent.innerHTML = `
        <div class="flex justify-between items-center p-4 border-b">
            <h3 class="text-xl font-semibold">Select a Step Type</h3>
            <button id="closeModalBtn" class="text-gray-500 hover:text-gray-800 text-2xl">×</button>
        </div>
        <div class="p-4">
            <input id="stepSearchInput" class="border p-2 rounded w-full mb-4" placeholder="Search for a step type...">
            <div id="stepOptionsGrid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"></div>
        </div>
    `;
    // Find the NEW close button inside the content we just added and attach the listener
    modalContent.querySelector('#closeModalBtn').addEventListener('click', closeStepSelector);
}

function openStepSelector(courseId, moduleId, moduleData, insertionIndex) {
    activeStepEditor = { courseId, moduleId, insertionIndex };
    activeModuleData = moduleData;

    // First, populate the list with all available steps
    populateStepOptions();

    // Then, find the NEW, live search input and attach the listener to it
    const liveSearchInput = document.getElementById('stepSearchInput');
    if (liveSearchInput) {
        liveSearchInput.addEventListener('input', populateStepOptions);
    }

    addStepModal.classList.remove('hidden');
}

function closeStepSelector() {
    addStepModal.classList.add('hidden');
    stepSearchInput.value = '';
}

async function populateStepOptions() {
    // Get fresh references to the modal elements each time the function runs
    const stepOptionsGrid = document.getElementById("stepOptionsGrid");
    const stepSearchInput = document.getElementById("stepSearchInput");

    // The rest of the function remains the same...
    const { courseId, moduleId, insertionIndex } = activeStepEditor;
    const moduleData = activeModuleData;
    const stepsWrapper = document.querySelector(`#steps-list-${moduleId}`).parentElement;
    stepOptionsGrid.innerHTML = "";
    const searchTerm = stepSearchInput.value.toLowerCase();
    const filteredSteps = availableSteps.filter(s => s.displayName.toLowerCase().includes(searchTerm));
    filteredSteps.forEach(step => {
        const option = document.createElement("div");
        option.className = "step-option text-left";
        option.innerHTML = ` <p class="font-semibold">${step.displayName}</p> <p class="text-sm text-gray-600">${step.description}</p> `;
        option.addEventListener('click', async () => {
            closeStepSelector();
            showStepsLoadingOverlay(stepsWrapper);
            const newSteps = [...(moduleData.steps || [])];
            const newStepData = JSON.parse(JSON.stringify(step.defaultData));
            newSteps.splice(insertionIndex, 0, newStepData);
            await debouncedSaveSteps(courseId, moduleId, newSteps);
            await loadModules(currentCourseId);
        });
        stepOptionsGrid.appendChild(option);
    });
}

async function handleImportModule() {
    const jsonString = jsonImportData.value;
    if (!jsonString.trim()) { return Toast.error("Please paste JSON data into the text area."); }
    let data;
    try { data = JSON.parse(jsonString); } catch (error) { return Toast.error("Error: The provided text is not valid JSON."); }
    if (!data.moduleId || !data.steps || !Array.isArray(data.steps)) { return Toast.error("Invalid Module JSON. It must contain 'moduleId' and 'steps'."); }
    const existingModuleCount = modulesList.querySelectorAll('.module-card').length;
    const newModuleId = data.moduleId;
    const newModuleData = { ...data, title: data.title || "Untitled Import", startDate: data.startDate || new Date().toISOString().split('T')[0], steps: transformStepsForFirestore(data.steps), order: existingModuleCount };
    try {
        const importBtn = document.getElementById('confirmImportBtn');
        importBtn.disabled = true;
        importBtn.innerHTML = `<div class="loading-spinner"></div> Importing...`;
        await courseService.createModule(currentCourseId, newModuleData, newModuleId);
        Toast.success(`Module "${newModuleId}" imported!`);
        importModal.classList.add('hidden');
        jsonImportData.value = '';
        loadModules(currentCourseId);
    } catch (error) { console.error("Firestore Save Error:", error); Toast.error(`Error saving to Firestore.`); }
    finally { const importBtn = document.getElementById('confirmImportBtn'); if (importBtn) { importBtn.disabled = false; importBtn.textContent = 'Import Module'; } }
}

function transformStepsForFirestore(steps) {
    return steps.map(step => {
        if (step.type === 'matchingGame' && step.pairs) {
            const transformedPairs = {};
            for (const lang in step.pairs) {
                if (Array.isArray(step.pairs[lang]?.[0])) {
                    transformedPairs[lang] = step.pairs[lang].map(pairArray => ({ word: pairArray[0] || '', match: pairArray[1] || '' }));
                } else {
                    transformedPairs[lang] = step.pairs[lang];
                }
            }
            return { ...step, pairs: transformedPairs };
        }
        return step;
    });
}

async function addModule() {
    if (!currentCourseId) return Toast.error("No course selected!");

    const newTitle = await Modal.prompt("Create New Module", "E.g. Chapter 1: Basics");
    if (!newTitle) return; // User cancelled

    // Get the current number of modules to determine the order
    const existingModuleCount = modulesList.querySelectorAll('.module-card').length;

    // Create the data for the new module
    const newModuleData = {
        title: newTitle, // The title is now just a field
        startDate: new Date().toISOString().split('T')[0],
        steps: [],
        order: existingModuleCount
    };

    // 3. Let Firestore automatically generate a unique ID
    try {
        await courseService.createModule(currentCourseId, newModuleData);
        Toast.success("Module created!");
        loadModules(currentCourseId);
    } catch (error) {
        console.error("Error creating module:", error);
        Toast.error("Could not create module.");
    }
}

async function saveModule(courseId, moduleId, moduleData, card) {
    const statusEl = card.querySelector('.save-status');
    const saveBtn = card.querySelector('.saveBtn');
    statusEl.textContent = 'Saving...';
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<div class="loading-spinner"></div> Saving...`;

    const inputs = card.querySelectorAll("[data-field]");
    const updated = {};
    inputs.forEach(input => {
        // Special handling for the title field, which might be an object
        if (input.dataset.field === 'title') {
            if (typeof moduleData.title === 'object' && moduleData.title !== null) {
                // If the original title is an object, update the 'en' property
                moduleData.title.en = input.value.trim();
                updated.title = moduleData.title;
            } else {
                // Otherwise, just save it as a string
                updated.title = input.value.trim();
            }
        } else {
            updated[input.dataset.field] = input.value.trim();
        }
    });

    const steps = moduleData.steps || [];
    await courseService.updateModule(courseId, moduleId, { ...moduleData, ...updated, steps });

    statusEl.textContent = '✓ Saved';
    saveBtn.disabled = false;
    saveBtn.innerHTML = `💾 Save Now`;
    setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 2000);
}

async function duplicateStep(courseId, moduleId, moduleData, index) {
    const newSteps = [...(moduleData.steps || [])];
    const stepToCopy = newSteps[index];
    const newStepData = JSON.parse(JSON.stringify(stepToCopy));
    newSteps.splice(index + 1, 0, newStepData);
    await debouncedSaveSteps(courseId, moduleId, newSteps);
}

async function deleteModule(courseId, moduleId, displayTitle, card) {
    if (confirm(`Delete module "${displayTitle}"?`)) {
        await courseService.deleteModule(courseId, moduleId);
        card.remove();
    }
}

async function deleteStep(courseId, moduleId, moduleData, index) {
    const newSteps = [...(moduleData.steps || [])];
    newSteps.splice(index, 1);
    await debouncedSaveSteps(courseId, moduleId, newSteps);
}

function showStepsLoadingOverlay(container) {
    const overlay = document.createElement('div');
    overlay.className = 'steps-overlay';
    overlay.innerHTML = `<div class="loading-spinner"></div>`;
    container.appendChild(overlay);
}

function hideStepsLoadingOverlay(container) {
    const overlay = container.querySelector('.steps-overlay');
    if (overlay) { overlay.remove(); }
}

const importHelpBtn = document.getElementById("importHelpBtn");
const importHelpModal = document.getElementById("importHelpModal");
const closeImportHelpBtn = document.getElementById("closeImportHelpBtn");
const copyImportHelpBtn = document.getElementById("copyImportHelpBtn");
const importHelpText = document.getElementById("importHelpText");

const importerInstructions = `# 📥 JSON Importer Instructions

Paste JSON with this schema:

{
  "moduleId": "string",
  "title": { "en": "string" },
  "startDate": "YYYY-MM-DD",
  "steps": [ StepObject, StepObject ]
}

## Step Types
- primer → { "type": "primer", "src": "images/placeholder.png", "text": { "en": "" } }
- mission → { "type": "mission", "prompt": { "en": "" } }
- reflection → { "type": "reflection", "prompt": { "en": "" } }
- movie → { "type": "movie", "title": { "en": "" }, "src": "https://..." }
- intentCheck → { "type": "intentCheck", "question": { "en": "" }, "options": { "en": ["A","B"] } }
- audioLesson → { "type": "audioLesson", "title": { "en": "" }, "items": [ { "word": { "en": "" }, "translation": { "en": "" } } ] }
- matchingGame → { "type": "matchingGame", "title": { "en": "" }, "pairs": { "en": [ { "word": "","match":"" } ] } }
- dialogue → { "type": "dialogue", "title": { "en": "" }, "lines": [ { "role": "guide", "text": { "en": "" } } ] }
- roleplay → { "type": "roleplay", "prompt": { "en": "" }, "options": { "en": ["Correct","Wrong"] }, "correctOption": 0, "feedback": { "en": "" } }
- roleplaySequence → { "type": "roleplaySequence", "scenario": { "en": "" }, "scenes": [ { "character": "You", "prompt": { "en": "" }, "options": [ { "text": { "en": "" }, "isCorrect": true, "feedback": { "en": "" } } ] } ] }
- letterRacingGame → { "type": "letterRacingGame", "title": { "en": "" }, "letters": "ABCDE", "goal": { "type": "score", "value": 10 } }

## Example
{
  "moduleId": "intro-to-animals",
  "title": { "en": "🐾 Introduction to Animals" },
  "steps": [
    { "type": "primer", "src": "images/lion.png", "text": { "en": "Welcome!" } },
    { "type": "intentCheck", "question": { "en": "Which is king of the jungle?" }, "options": { "en": ["Lion","Tiger"] } }
  ]
}`;

importHelpBtn.addEventListener("click", () => {
    importHelpText.textContent = importerInstructions;
    importHelpModal.classList.remove("hidden");
});

closeImportHelpBtn.addEventListener("click", () => {
    importHelpModal.classList.add("hidden");
});

copyImportHelpBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(importerInstructions).then(() => {
        copyImportHelpBtn.textContent = "✅ Copied!";
        setTimeout(() => { copyImportHelpBtn.textContent = "📋 Copy Instructions"; }, 2000);
    });
});


// --- Initial Setup & Event Listeners ---
backBtn.addEventListener("click", () => { window.location.href = "CourseCreator.html"; });
addModuleBtn.addEventListener("click", addModule);
closeModalBtn.addEventListener('click', closeStepSelector);
importModuleBtn.addEventListener('click', () => { importModal.classList.remove('hidden'); });
cancelImportBtn.addEventListener('click', () => { importModal.classList.add('hidden'); jsonImportData.value = ''; });
confirmImportBtn.addEventListener('click', handleImportModule);

loadModules(currentCourseId);

// These need to be available globally for attachFormEventListeners
function renderSimpleListItem(lang, value) { return `<div class="flex items-center gap-2 list-item"><input type="text" value="${value}" class="flex-grow"><button type="button" class="remove-item-btn text-red-500">×</button></div>`; }
function renderPairListItem(lang, pair) { return `<div class="flex items-center gap-2 pair-item list-item"><input type="text" data-key="word" value="${pair.word || ''}" placeholder="Word"><input type="text" data-key="match" value="${pair.match || ''}" placeholder="Match"><button type="button" class="remove-item-btn text-red-500">×</button></div>`; }
function renderAudioLessonItem(lang, item, index, languages) { return `<div class="list-item-card border p-3 rounded bg-gray-50 relative"><button type="button" class="remove-item-btn absolute top-1 right-2 text-red-500">×</button><h5 class="font-semibold text-sm mb-2">Item ${index + 1}</h5>${renderMultiLanguageInput('Word', 'word', item.word, languages)}${renderMultiLanguageInput('Translation', 'translation', item.translation, languages)}</div>`; }
function renderMultiLanguageInput(label, field, data, languages) { const inputs = (languages || ['en']).map(lang => `<div class="multilang-grid"><span>${lang.toUpperCase()}</span><input type="text" data-field="${field}.${lang}" value="${data?.[lang] || ''}"></div>`).join(''); return `<div class="form-group"><label>${label}</label>${inputs}</div>`; }

const backBtn = document.getElementById("backBtn");

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "CourseCreator.html";
  });
}
