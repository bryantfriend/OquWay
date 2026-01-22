//
// ========== CourseCreatorModules.js ==========
//

import { courseService } from "./services/courseService.js";
import { assetService } from "./services/assetService.js";
import { Modal } from "./components/Modal.js";
import { Toast } from "./components/Toast.js";
import { store } from "./Store.js"; // NEW: Central State
import { StructurePanel } from "./components/StructurePanel.js";
import { Canvas } from "./components/Canvas.js";
import { Inspector } from "./components/Inspector.js";
import { CommandPalette } from "./components/CommandPalette.js";
import { Registry } from "../Shared/steps/Registry.js";

// Import the step classes from our separate file
// import { stepClasses } from "./StepTypes.js"; // DEPRECATED: Use Registry
// Import renderers for specific complex lists usage still in Modules?
import { renderDialogueLineItem, renderRoleplaySceneItem } from "./js/utils/FormRenderers.js"; // Needed for form dynamic items

import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged } from
    "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // Role-based gating (Requirement 6)
    try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const userData = userSnap.data();
        if (userData?.role !== 'admin' && userData?.role !== 'editor') {
            console.warn("Access denied: Admin or Editor role required.");
            // Redirect to a safe place (student panel or teacher splash with warning)
            window.location.href = "../teacher-dashboard/splash.html?error=unauthorized";
        }
    } catch (e) {
        console.error("Auth check failed:", e);
    }
});

// Initialize Registry with DB
Registry.init(db);


// --- Element Selectors ---
const dashboardView = document.getElementById("dashboardView");
const editorView = document.getElementById("editorView");
const modulesList = document.getElementById("modulesList");
const backBtn = document.getElementById("backBtn");
const addModuleBtn = document.getElementById("addModuleBtn");

// Editor Elements
const closeEditorBtn = document.getElementById("closeEditorBtn");
const editorModuleName = document.getElementById("editorModuleName");
const saveStatus = document.getElementById("saveStatus");

// Ensure Publish Status Element exists in Top Bar
let publishStatus = document.getElementById("publishStatus");
if (!publishStatus && saveStatus) {
    publishStatus = document.createElement("div");
    publishStatus.id = "publishStatus";
    publishStatus.className = "ml-4";
    saveStatus.parentNode.insertBefore(publishStatus, saveStatus);
}

// NEW: Manual Save Button
let manualSaveBtn = document.getElementById("manualSaveBtn");
if (!manualSaveBtn && closeEditorBtn) {
    manualSaveBtn = document.createElement("button");
    manualSaveBtn.id = "manualSaveBtn";
    manualSaveBtn.className = "ml-4 bg-green-600 text-white px-4 py-1 rounded shadow hover:bg-green-700 font-bold text-sm tracking-wide";
    manualSaveBtn.innerHTML = `<i class="fas fa-save mr-2"></i> SAVE`;
    // Insert before Close button
    closeEditorBtn.parentNode.insertBefore(manualSaveBtn, closeEditorBtn);

    manualSaveBtn.onclick = async () => {
        const originalText = manualSaveBtn.innerHTML;
        manualSaveBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Saving...`;
        manualSaveBtn.disabled = true;
        try {
            await store.save();
            Toast.success("Saved successfully!");
        } catch (err) {
            console.error(err);
            Toast.error("Failed to save.");
        } finally {
            manualSaveBtn.innerHTML = originalText;
            manualSaveBtn.disabled = false;
        }
    };
}

// Context for Block Picker
let activeBlockPickerContext = {
    pageId: null,
    insertionIndex: -1
};

let currentCourseId = localStorage.getItem("activeCourseDocId");
let courseCache = {};
let appComponents = {
    structure: null,
    canvas: null,
    inspector: null
};

// --- Form Element Renderers Map (Reused for Inspector) ---
const listItemRenderers = {
    options: renderSimpleListItem,
    pairs: renderPairListItem,
    items: renderAudioLessonItem,
    lines: renderDialogueLineItem,
    scenes: renderRoleplaySceneItem,
};

// =================================================================================
// INIT & VIEW SWITCHING
// =================================================================================

async function init() {
    if (!currentCourseId) {
        modulesList.innerHTML = `<p class="text-red-600">No course selected.</p>`;
        return;
    }

    // Load Course Info
    const courseData = await courseService.getCourse(currentCourseId);
    if (courseData) {
        courseCache[currentCourseId] = courseData;
        document.getElementById("courseName").textContent = courseData.title || "Untitled";
        const langEl = document.getElementById("courseLanguages");
        if (langEl) {
            const langs = courseData.languages || ['en'];
            langEl.textContent = `Languages: ${langs.map(l => l.toUpperCase()).join(', ')}`;
        }
    } else {
        document.getElementById("courseName").textContent = "Course Not Found";
    }

    // Load Modules List (Dashboard)
    loadModulesList();

    // Initialize Editor Components (Singletons)
    // passing the IDs of the containers they should live in or use
    appComponents.structure = new StructurePanel('structurePanel');
    appComponents.canvas = new Canvas('canvasPanel');
    appComponents.inspector = new Inspector('inspectorPanel');

    // Feature: Command Palette (Self-initializing listener)
    new CommandPalette();

    // Feature: Structure Panel Toggle
    const structureCollapseBtn = document.getElementById('structureCollapseBtn');
    const structurePanel = document.getElementById('structurePanel');
    if (structureCollapseBtn && structurePanel) {
        structureCollapseBtn.addEventListener('click', () => {
            structurePanel.classList.toggle('w-72');
            structurePanel.classList.toggle('w-0');
            structurePanel.classList.toggle('border-r');
            structurePanel.classList.toggle('opacity-0');
            // Also hide children to prevent overflow
            const children = structurePanel.children;
            for (let child of children) {
                if (child !== structurePanel.firstElementChild) child.classList.toggle('hidden');
            }
        });
    }

    // Setup Global Event Listeners for Component Interaction
    setupGlobalListeners();
}

function switchView(viewName) {
    if (viewName === 'editor') {
        dashboardView.classList.add('hidden');
        editorView.classList.remove('hidden');
    } else {
        dashboardView.classList.remove('hidden');
        editorView.classList.add('hidden');
        loadModulesList(); // Refresh list on return
    }
}

function setupGlobalListeners() {
    // 1. Block Picker Request (from Canvas)
    document.addEventListener('request-block-picker', (e) => {
        const { index, trackId, previousStepType } = e.detail;
        openBlockPicker(trackId, index, previousStepType);
    });

    // 2. Inspector Actions (Dynamic Form Fields from Inspector)
    document.addEventListener('inspector-action', (e) => {
        handleGlobalFormAction(e.detail.originalEvent);
    });

    // 3. Inspector Fullscreen Toggle (Animation)
    document.addEventListener('toggle-inspector-fullscreen', (e) => {
        const { isFullscreen } = e.detail;
        const structurePanel = document.getElementById('structurePanel');
        const canvasPanel = document.getElementById('canvasPanel');
        const inspectorPanel = document.getElementById('inspectorPanel');

        if (isFullscreen) {
            // Slide/Fade out Left and Center
            structurePanel.classList.add('-translate-x-full', 'w-0', 'border-0', 'opacity-0', 'p-0');
            canvasPanel.classList.add('hidden'); // Simplify: remove from flow

            // Expand Right
            inspectorPanel.classList.remove('w-80', 'border-l');
            inspectorPanel.classList.add('w-full');
        } else {
            // Restore
            structurePanel.classList.remove('-translate-x-full', 'w-0', 'border-0', 'opacity-0', 'p-0');
            canvasPanel.classList.remove('hidden');

            // Restore Right
            inspectorPanel.classList.add('w-80', 'border-l');
            inspectorPanel.classList.remove('w-full');
        }
    });

    // 4. Global Keyboard Shortcuts
    document.addEventListener('keydown', async (e) => {
        // Save: Ctrl + S / Cmd + S
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            Toast.info("Saving...");
            try {
                await store.save();
                Toast.success("Saved!");
            } catch (err) {
                Toast.error("Save Failed");
            }
            return;
        }

        const activeEl = document.activeElement;
        const isInputActive = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);

        // If typing, ignore other shortcuts
        if (isInputActive) return;

        // Delete Step: Delete / Backspace
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const selectedStep = store.getSelectedStep();
            if (selectedStep) {
                e.preventDefault(); // Prevent navigating back
                if (confirm('Delete selected step?')) {
                    store.deleteStep(selectedStep.id);
                }
            }
        }

        // Duplicate Step: Ctrl + D
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            const selectedStep = store.getSelectedStep();
            if (selectedStep) {
                e.preventDefault();
                const trackId = store.getSelectedTrack().id;
                // Find index
                const track = store.getTrack(trackId);
                const idx = track.steps.findIndex(s => s.id === selectedStep.id);

                const newStep = JSON.parse(JSON.stringify(selectedStep));
                delete newStep.id;
                store.addStep(trackId, newStep, idx + 1);
                Toast.success("Step Duplicated");
            }
        }

        // Move Step: Alt + Up / Down
        if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            const selectedStep = store.getSelectedStep();
            if (selectedStep) {
                e.preventDefault();
                const trackId = store.state.selectedTrackId;
                const track = store.getTrack(trackId);
                const idx = track.steps.findIndex(s => s.id === selectedStep.id);

                if (idx === -1) return;

                const newIndex = e.key === 'ArrowUp' ? idx - 1 : idx + 1;

                if (newIndex >= 0 && newIndex < track.steps.length) {
                    // Swap
                    const temp = track.steps[newIndex];
                    track.steps[newIndex] = track.steps[idx];
                    track.steps[idx] = temp;
                    store.reorderSteps(trackId, track.steps);
                }
            }
        }
        // Command Palette is now handled by components/CommandPalette.js
    });
}

// --- Command Palette Logic ---
// Now handled by components/CommandPalette.js
// We just init it in setupGlobalListeners or init()

// Focus Mode Toggle
const focusBtn = document.getElementById('focusModeBtn');
if (focusBtn) {
    focusBtn.addEventListener('click', () => {
        document.body.classList.toggle('focus-mode');
        const isFocus = document.body.classList.contains('focus-mode');

        // Toggle Panels
        const structureInfo = document.getElementById('structurePanel');
        const inspectorInfo = document.getElementById('inspectorPanel');

        if (isFocus) {
            structureInfo.classList.add('-translate-x-full', 'w-0', 'border-0');
            inspectorInfo.classList.add('translate-x-full', 'w-0', 'border-0');
            focusBtn.classList.add('text-blue-600', 'bg-blue-50');
        } else {
            structureInfo.classList.remove('-translate-x-full', 'w-0', 'border-0');
            inspectorInfo.classList.remove('translate-x-full', 'w-0', 'border-0');
            focusBtn.classList.remove('text-blue-600', 'bg-blue-50');
        }
    });
}

// ... (rest of listeners)


// =================================================================================
// DASHBOARD LOGIC (Module List)
// =================================================================================

async function loadModulesList() {
    modulesList.innerHTML = `<p class="text-gray-500">Loading modules...</p>`;
    const modules = await courseService.getModules(currentCourseId);

    if (modules.length === 0) {
        modulesList.innerHTML = `<p class="text-gray-600">No modules found. Create one!</p>`;
        return;
    }

    modulesList.innerHTML = "";

    // Sort logic handled by backend usually, but let's ensure compliance
    modules.sort((a, b) => (a.order || 0) - (b.order || 0));

    modules.forEach(mod => {
        const card = document.createElement("div");
        card.className = "bg-white shadow p-4 rounded mb-4 flex justify-between items-center group hover:bg-gray-50 transition cursor-pointer";

        let displayTitle = mod.title;
        if (typeof mod.title === 'object') displayTitle = mod.title.en || "Untitled";

        card.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="bg-gray-200 w-10 h-10 rounded flex items-center justify-center text-gray-500">
                    ⋮⋮
                </div>
                <div>
                    <h3 class="font-bold text-lg text-gray-800">${displayTitle || "Untitled Module"}</h3>
                    <p class="text-xs text-gray-500">${mod.tracks ? mod.tracks.length + ' tracks' : (mod.steps?.length || 0) + ' steps (legacy)'}</p>
                </div>
            </div>
            <div class="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition">
                 <button class="deleteBtn text-red-400 hover:text-red-600 p-2" title="Delete">🗑️</button>
                 <button class="editBtn bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow-sm">
                    Open Editor
                 </button>
            </div>
        `;

        // Click on card opens editor
        card.addEventListener('click', (e) => {
            if (e.target.closest('.deleteBtn')) return;
            openModuleInEditor(mod);
        });

        card.querySelector('.deleteBtn').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Delete module "${displayTitle}"?`)) {
                await courseService.deleteModule(currentCourseId, mod.id);
                card.remove();
            }
        });

        modulesList.appendChild(card);
    });

    // Initialize Sortable for reordering modules at course level
    new Sortable(modulesList, {
        animation: 150,
        handle: '.bg-gray-200', // Drag handle
        onEnd: async (evt) => {
            // Reorder logic here
            const orderedIds = Array.from(modulesList.children).map(c => {
                // We need to attach ID to element or find it from data. 
                // (Simpler: reload for now or store ID in dataset)
                // This part is skipped for brevity in this refactor step.
            });
        }
    });
}


// Template Picker Elements
const templatePickerModal = document.getElementById("templatePickerModal");
const closeTemplateModalBtn = document.getElementById("closeTemplateModalBtn");
const templateList = document.getElementById("templateGrid");

function openTemplatePicker() {
    templatePickerModal.classList.remove('hidden');
    renderTemplates();
}

function closeTemplatePicker() {
    templatePickerModal.classList.add('hidden');
}

// Template Definitions
const templateDefinitions = [
    {
        id: 'blank',
        title: 'Blank Module',
        description: 'Start from scratch with a single empty track.',
        icon: '⬜',
        color: 'bg-gray-100',
        tags: ['Flexible']
    },
    {
        id: 'vocab',
        title: 'Vocabulary Drill',
        description: 'Classic flow: Primer -> Audio -> Match -> Reflection.',
        icon: '🧠',
        color: 'bg-green-100',
        tags: ['Beginner', 'Drill']
    },
    {
        id: 'story',
        title: 'Story Arc',
        description: 'Context -> Dialogue -> Comprehension Check -> Video.',
        icon: '📖',
        color: 'bg-purple-100',
        tags: ['Content', 'Reading']
    },
    {
        id: 'roleplay',
        title: 'Roleplay Scenario',
        description: 'Interactive branching conversation with an AI character.',
        icon: '🎭',
        color: 'bg-red-100',
        tags: ['Speaking', 'Interactive']
    }
];

function renderTemplates() {
    if (!templateList) return;
    templateList.innerHTML = '';

    templateDefinitions.forEach(tpl => {
        const card = document.createElement('div');
        card.className = `template-card bg-white border rounded-lg p-4 cursor-pointer hover:shadow-lg transition transform hover:-translate-y-1 relative overflow-hidden group`;
        card.dataset.template = tpl.id;

        card.innerHTML = `
            <div class="absolute top-0 left-0 w-1 h-full ${tpl.color.replace('bg-', 'bg-border-')}"></div>
            <div class="flex items-start justify-between mb-2">
                <div class="${tpl.color} w-10 h-10 rounded-full flex items-center justify-center text-xl">
                    ${tpl.icon}
                </div>
                <div class="flex gap-1">
                    ${tpl.tags.map(t => `<span class="text-[10px] uppercase font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">${t}</span>`).join('')}
                </div>
            </div>
            <h4 class="font-bold text-gray-800 mb-1">${tpl.title}</h4>
            <p class="text-xs text-gray-500 leading-relaxed">${tpl.description}</p>
        `;

        templateList.appendChild(card);
    });
}

const loadingOverlay = document.createElement('div');
loadingOverlay.className = 'hidden fixed inset-0 bg-black bg-opacity-30 z-[100] flex items-center justify-center';
loadingOverlay.innerHTML = `
    <div class="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p class="text-gray-700 font-semibold">Creating Module...</p>
    </div>
`;
document.body.appendChild(loadingOverlay);

function showLoading() { loadingOverlay.classList.remove('hidden'); }
function hideLoading() { loadingOverlay.classList.add('hidden'); }

// Logic for creating module from template
async function createModuleFromTemplate(templateType) {
    let newTitle = "New Module";
    let tracks = [];

    // 1. Get Title
    const inputTitle = await Modal.prompt("Name your Module", "Module Title");
    if (!inputTitle) return; // User cancelled
    newTitle = inputTitle;

    showLoading(); // START LOADING

    try {
        // 2. Define Template Content
        if (templateType === 'blank') {
            tracks = [{ id: 'tr-' + Date.now(), title: 'Main Track', color: 'blue', steps: [] }];
        }
        else if (templateType === 'vocab') {
            const t1 = {
                id: 'tr-vocab-' + Date.now(),
                title: 'Introduction',
                color: 'blue',
                steps: [
                    { type: 'primer', id: 's-1', content: { title: 'Lesson Goals', text: 'You will learn 5 updated terms.' } },
                ]
            };
            const t2 = {
                id: 'tr-drill-' + Date.now(),
                title: 'Drills',
                color: 'green',
                steps: [
                    { type: 'matching', id: 's-2', content: { instruction: 'Match terms', pairs: [{ left: 'Cat', right: 'Gato' }] } }
                ]
            };
            tracks = [t1, t2];
        }
        else if (templateType === 'story') {
            tracks = [{ id: 'tr-1', title: 'Story Context', color: 'purple', steps: [] }];
        }
        else if (templateType === 'roleplay') {
            tracks = [{ id: 'tr-1', title: 'Scene 1', color: 'red', steps: [] }];
        }

        // 3. Create Module
        const existingModules = await courseService.getModules(currentCourseId);

        const slug = inputTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        const newModule = {
            moduleId: slug,                 // semantic ID
            slug,

            title: { en: inputTitle },
            description: { en: "" },

            order: existingModules.length,
            unlockWeek: existingModules.length + 1,
            startDate: null,
            allowEarlyAccess: false,

            status: "draft",

            tracks,
            steps: [],

            intentionReward: {
                blue: 10,
                purple: 5
            },

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const createdMod = await courseService.createModule(currentCourseId, newModule);

        // Immediately open editor
        openModuleInEditor(createdMod);

        // 4. Update UI
        closeTemplatePicker();

        // Check to ensure loadModuleList is the function we need
        if (typeof loadModulesList !== 'function') {
            console.error("loadModulesList not available");
            return;
        }
        openModuleInEditor(createdMod);
        Toast.success("Module created!");

    } catch (err) {
        console.error(err);
        Toast.error("Failed to create module.");
    } finally {
        hideLoading(); // END LOADING
    }
}


// Attach Template Listeners
if (templateList) {
    templateList.addEventListener('click', (e) => {
        const card = e.target.closest('.template-card');
        if (card) {
            createModuleFromTemplate(card.dataset.template);
        }
    });
}
if (closeTemplateModalBtn) closeTemplateModalBtn.addEventListener('click', closeTemplatePicker);

async function addModule() {
    openTemplatePicker();
}


// =================================================================================
// EDITOR CONTROLLER
// =================================================================================

function openModuleInEditor(moduleData) {
    if (!moduleData.id) {
        console.error("Missing module ID", moduleData);
        return;
    }

    // Initialize Store
    const courseLangs = courseCache[currentCourseId]?.languages || ['en'];
    const courseTitle = courseCache[currentCourseId]?.title || 'Untitled Course';
    store.init(currentCourseId, moduleData.id, moduleData, courseLangs, courseTitle);

    // Update UI Header
    let displayTitle = moduleData.title;
    if (typeof displayTitle === 'object') displayTitle = displayTitle.en || "Untitled";
    editorModuleName.textContent = displayTitle;

    // Switch View
    switchView('editor');

    // Components auto-update via store subscription, but we might want to reset scroll etc.
    updatePublishStatus();
}

function updatePublishStatus() {
    const statusObj = store.getPublishStatus();
    const statusEl = document.getElementById('publishStatus'); // We need to add this to HTML or create it
    if (!statusEl) return;

    if (statusObj.isReady) {
        statusEl.innerHTML = `<span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">READY</span>`;
        statusEl.title = "Module is ready to be published";
    } else {
        statusEl.innerHTML = `<span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold border border-yellow-200 cursor-pointer">DRAFT</span>`;
        statusEl.onclick = () => {
            Toast.info("Issues:\n" + statusObj.issues.join('\n'));
        };
    }
}

// Subscribe to updates for status
store.subscribe(() => {
    updatePublishStatus();
});


// =================================================================================
// BLOCK PICKER LOGIC (Replaces old 'openStepSelector')
// =================================================================================

// ... imports ...
import { SmartStepPicker } from "./components/SmartStepPicker.js";

// =================================================================================
// BLOCK PICKER LOGIC (Replaces old 'openStepSelector')
// =================================================================================

// (Old elements removed/ignored, we use dynamic modal now)

function openBlockPicker(trackId, insertionIndex, previousStepType = null) {
    activeBlockPickerContext = { trackId, insertionIndex };

    // Instantiate and render the new Smart Picker
    const picker = new SmartStepPicker((typeId) => {
        createBlock(typeId);
    });
    picker.render(previousStepType);
}

// Old renderBlockOptions removed.

function createBlock(type) {
    const { trackId, insertionIndex } = activeBlockPickerContext;
    if (!trackId) return;

    const Engine = Registry.get(type);
    if (!Engine) return;

    const newStepData = JSON.parse(JSON.stringify(Engine.defaultConfig));
    newStepData.type = type; // Ensure type is intact

    store.addStep(trackId, newStepData, insertionIndex);

    Toast.success(`Added ${Engine.displayName || type}`);

    // Auto-scroll logic handled by Store/Canvas subscription usually
}

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        addStepModal.classList.add('hidden');
    });
}


// =================================================================================
// GLOBAL FORM HANDLING (For Inspector dynamic fields)
// =================================================================================

function handleGlobalFormAction(e) {
    const target = e.target;

    // 1. Remove Item
    if (target.classList.contains("remove-item-btn")) {
        target.closest(".list-item, .list-item-card")?.remove();
        // Trigger save implies we need to notify inspector to save?
        // Inspector handles 'input' events, but DOM removal doesn't trigger input.
        // We need to forcefully trigger a save.
        triggerInspectorSave();
        return;
    }

    // 2. Add Item
    if (target.classList.contains("add-item-btn")) {
        const lang = target.dataset.lang;
        const listContainer = target.previousElementSibling;
        const field = target.closest("[data-list-field]")?.dataset.listField;
        if (!field) return;

        const renderer = listItemRenderers[field];
        const courseLanguages = courseCache[currentCourseId]?.languages || ["en"];
        let newItemHtml = "";

        if (renderer) {
            if (lang === "complex") {
                // Find default data for this field from the relevant Engine?
                // Difficult because we don't know WHICH engine this field belongs to easily here without context.
                // However, the `field` name (e.g. 'items', 'lines') usually maps to a specific step type property.
                // For now, let's provide safe defaults based on field name or try to look up generic defaults.

                let defaultData = {};
                // Helper map for sub-item defaults (could be moved to Registry later)
                const subItemDefaults = {
                    items: { word: 'New Word', translation: 'Translation' }, // AudioLesson
                    lines: { character: 'A', text: 'Hello' }, // Dialogue
                    scenes: { title: 'New Scene' } // Roleplay
                };
                defaultData = subItemDefaults[field] || {};

                newItemHtml = renderer(null, defaultData, listContainer.children.length, courseLanguages);
            } else {
                newItemHtml = renderer(lang, {}, listContainer.children.length);
            }
        } else {
            newItemHtml = `<div class="text-gray-400 text-sm">(Unknown field type: ${field})</div>`;
        }

        listContainer.insertAdjacentHTML("beforeend", newItemHtml);
        triggerInspectorSave(); // We might want to wait for user input, but adding empty item updates structure.
    }

    // 3. Upload Asset
    if (target.closest(".upload-asset-btn")) {
        const btn = target.closest(".upload-asset-btn");
        const fileInput = btn.parentElement.querySelector(".asset-file-input");
        if (fileInput) {
            fileInput.onchange = null; // Clear old listeners
            fileInput.onchange = async (ev) => {
                const file = ev.target.files[0];
                if (!file) return;

                const originalText = btn.innerHTML;
                btn.innerHTML = `...`;
                btn.disabled = true;

                try {
                    const url = await assetService.uploadFile(file);
                    const textInput = btn.parentElement.querySelector('input[type="text"]');
                    if (textInput) {
                        textInput.value = url;
                        // Trigger input event to save
                        textInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    Toast.success("File uploaded!");
                } catch (err) {
                    console.error("Upload failed:", err);
                    Toast.error("Upload failed.");
                } finally {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    fileInput.value = "";
                }
            };
            fileInput.click();
        }
    }
}

function triggerInspectorSave() {
    // We can just call the inspector's save method via the instance
    if (appComponents.inspector) {
        appComponents.inspector.saveBlockChange();
    }
}

// Helpers for Renderers (Global scope for now, used by StepTypes generated HTML)
function renderSimpleListItem(lang, value) { return `<div class="flex items-center gap-2 list-item mb-2"><input type="text" value="${value}" class="flex-grow border p-2 rounded"><button type="button" class="remove-item-btn text-red-500 hover:bg-red-50 p-1 rounded">×</button></div>`; }
function renderPairListItem(lang, pair) { return `<div class="flex items-center gap-2 pair-item list-item mb-2"><input type="text" data-key="word" value="${pair.word || ''}" placeholder="Word" class="border p-2 rounded flex-1"><input type="text" data-key="match" value="${pair.match || ''}" placeholder="Match" class="border p-2 rounded flex-1"><button type="button" class="remove-item-btn text-red-500 hover:bg-red-50 p-1 rounded">×</button></div>`; }
function renderAudioLessonItem(lang, item, index, languages) { return `<div class="list-item-card border p-3 rounded bg-gray-50 relative mb-2"><button type="button" class="remove-item-btn absolute top-1 right-2 text-red-500 hover:text-red-700">×</button><h5 class="font-semibold text-xs text-gray-500 mb-2 uppercase">Item ${index + 1}</h5>${renderMultiLanguageInput('Word', 'word', item.word, languages)}${renderMultiLanguageInput('Translation', 'translation', item.translation, languages)}</div>`; }
function renderMultiLanguageInput(label, field, data, languages) { const inputs = (languages || ['en']).map(lang => `<div class="flex items-center gap-2 mb-1"><span class="text-xs font-bold text-gray-400 w-6 uppercase">${lang}</span><input type="text" data-field="${field}.${lang}" value="${data?.[lang] || ''}" class="flex-1 border p-1 rounded text-sm"></div>`).join(''); return `<div class="mb-2"><label class="text-xs font-medium text-gray-700 block mb-1">${label}</label>${inputs}</div>`; }


// =================================================================================
// EVENT LISTENERS (Base)
// =================================================================================

backBtn.addEventListener("click", () => {
    window.location.href = "CourseCreator.html";
});

const previewBtn = document.getElementById('previewCourseBtn');
if (previewBtn) {
    previewBtn.addEventListener('click', () => {
        window.location.href = `CoursePlayer.html?courseId=${currentCourseId}`;
    });
}

addModuleBtn.addEventListener("click", addModule);

closeEditorBtn.addEventListener("click", () => {
    // Maybe trigger a final save or check status?
    // Autosave usually handles it.
    switchView('dashboard');
});

// Initial Load
init();


