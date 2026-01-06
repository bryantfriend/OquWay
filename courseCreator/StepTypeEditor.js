import { Registry } from '../Shared/steps/Registry.js';
import { SchemaForm } from './js/components/SchemaForm.js';
import { db } from "./firebase-init.js";
import { doc, onSnapshot, setDoc, addDoc, collection, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Auto-register & Async Init
const initPromise = Registry.init(db);

// DOM Elements
const stepTypeList = document.getElementById('stepTypeList');
const editorEmpty = document.getElementById('editor-empty');
const currentTitle = document.getElementById('current-step-title');
const currentId = document.getElementById('current-step-id');
const configContainer = document.getElementById('config-form-container');
const schemaEditor = document.getElementById('schema-json-editor');
const codeEditor = document.getElementById('code-editor'); // New
const codeOverlay = document.getElementById('code-overlay'); // New
const cloudBadge = document.getElementById('cloud-badge'); // New

const previewContainer = document.getElementById('preview-container');
const versionBadge = document.getElementById('version-badge');
const validationMsg = document.getElementById('validation-msg');
const saveBtn = document.getElementById('save-btn');
const publishBtn = document.getElementById('publish-btn');
const seedInput = document.getElementById('seed-input');

// TABS
const tabConfig = document.getElementById('tab-config');
const tabSchema = document.getElementById('tab-schema');
const tabCode = document.getElementById('tab-code');
const panelConfig = document.getElementById('panel-config');
const panelSchema = document.getElementById('panel-schema');
const panelCode = document.getElementById('panel-code');

// New Metadata & UI Elements
const manageTagsBtn = document.getElementById('manage-tags-btn');
const activeTagsList = document.getElementById('active-tags-list');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const previewPaneWrapper = document.getElementById('preview-pane-wrapper');

// Tag Modal Elements
const tagPickerModal = document.getElementById('tagPickerModal');
const closeTagPickerBtn = document.getElementById('closeTagPickerBtn');
const tagPickerList = document.getElementById('tagPickerList');
const newTagInput = document.getElementById('newTagInput');
const addNewTagBtn = document.getElementById('addNewTagBtn');
const confirmTagsBtn = document.getElementById('confirmTagsBtn');

// State
let selectedEngineId = null;
let currentConfig = {};
let currentSchemaForm = null;
let tagsUnsubscribe = null;
let currentStepTags = new Set();
// Initialize allTags with defaults immediately
let allTags = new Set([
    // Skills
    "listening", "speaking", "reading", "writing",
    // Types
    "grammar", "vocabulary", "pronunciation",
    // Levels
    "beginner", "intermediate", "advanced",
    // Format
    "interactive", "video", "audio", "text"
]);

// Global Tag Sync (Run once on load to populate allTags)
function initGlobalTagSync() {
    onSnapshot(collection(db, 'step_metadata'), (snapshot) => {
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.tags && Array.isArray(data.tags)) {
                data.tags.forEach(t => allTags.add(t));
            }
        });
    });
}
initGlobalTagSync();

// --- TAB SWITCHING ---
function switchTab(tabId) {
    // Reset classes
    [tabConfig, tabSchema, tabCode].forEach(t => {
        t.classList.remove('border-b-2', 'border-blue-500', 'text-blue-600');
        t.classList.add('text-gray-500');
    });
    [panelConfig, panelSchema, panelCode].forEach(p => p.classList.add('hidden'));

    // Activate
    const activeTab = document.getElementById(tabId);
    const activePanel = document.getElementById(tabId.replace('tab-', 'panel-'));

    activeTab.classList.remove('text-gray-500');
    activeTab.classList.add('border-b-2', 'border-blue-500', 'text-blue-600');
    activePanel.classList.remove('hidden');
}

tabConfig.onclick = () => switchTab('tab-config');
tabSchema.onclick = () => switchTab('tab-schema');
tabCode.onclick = () => switchTab('tab-code');


// 1. Initialize List
async function renderList() {
    await initPromise; // Wait for registry
    stepTypeList.innerHTML = '';
    Registry.getAll().forEach(Engine => {
        const item = document.createElement('div');
        item.className = "p-3 rounded hover:bg-blue-50 cursor-pointer border border-transparent hover:border-blue-100 transition flex justify-between items-center";

        let meta = `v${Engine.version}`;
        if (Engine.isCloud) meta += ` <span class="bg-blue-100 text-blue-600 px-1 rounded text-[10px] font-bold">CLOUD</span>`;

        item.innerHTML = `
            <div>
                <div class="font-bold text-sm text-gray-800">${Engine.id}</div>
                <div class="text-xs text-gray-500">${meta}</div>
            </div>
            <span class="text-gray-300">›</span>
        `;
        item.onclick = () => selectStepType(Engine.id);
        stepTypeList.appendChild(item);
    });
}

async function selectStepType(id) {
    selectedEngineId = id;
    const Engine = Registry.get(id);
    if (!Engine) return;

    editorEmpty.classList.add('hidden');
    currentTitle.textContent = Engine.displayName || Engine.id;
    currentId.textContent = Engine.id;
    versionBadge.textContent = 'v' + Engine.version;

    // Load Data
    currentConfig = { ...Engine.defaultConfig };
    const schema = Engine.editorSchema;

    // Render Config Form (SchemaForm V2)
    currentSchemaForm = new SchemaForm(configContainer, schema, currentConfig, (newData) => {
        currentConfig = newData;
        validateAndPreview(Engine);
    });

    // Render Schema JSON
    schemaEditor.value = JSON.stringify(schema, null, 2);

    // Initial Validation & Preview
    validateAndPreview(Engine);

    // Setup Tags Sync
    setupTagsSync(id);

    // --- CODE EDITOR LOGIC ---
    if (Engine.isCloud) {
        cloudBadge.classList.remove('hidden');
        codeOverlay.classList.add('hidden');
        // Fetch source code
        // We assume we have it in memory or fetch it? 
        // Registry doesn't store the raw string by default in memory unless we change it.
        // Let's fetch it freshly.
        try {
            const docSnap = await getDoc(doc(db, "system_step_types", Engine.cloudId));
            if (docSnap.exists()) {
                codeEditor.value = docSnap.data().code;
            }
        } catch (e) { console.error(e); }
        codeEditor.readOnly = false;
    } else {
        cloudBadge.classList.add('hidden');
        codeOverlay.classList.remove('hidden');
        codeEditor.value = "// Read Mode Only\n// Source available in local codebase.";
        codeEditor.readOnly = true;
    }
}

function setupTagsSync(stepId) {
    if (tagsUnsubscribe) {
        tagsUnsubscribe();
        tagsUnsubscribe = null;
    }

    currentStepTags.clear();
    renderActiveTags();

    tagsUnsubscribe = onSnapshot(doc(db, 'step_metadata', stepId), (docSnap) => {
        currentStepTags.clear();
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.tags && Array.isArray(data.tags)) {
                data.tags.forEach(t => currentStepTags.add(t));
            }
        }
        renderActiveTags();
    });
}

function renderActiveTags() {
    activeTagsList.innerHTML = '';
    if (currentStepTags.size === 0) {
        activeTagsList.innerHTML = '<span class="italic text-gray-400">No tags selected.</span>';
        return;
    }

    currentStepTags.forEach(tag => {
        const span = document.createElement('span');
        span.className = "bg-gray-100 text-gray-700 px-2 py-1 rounded border text-xs";
        span.textContent = "#" + tag;
        activeTagsList.appendChild(span);
    });
}

function openTagPicker() {
    tagPickerModal.classList.remove('hidden');
    renderTagPickerList();
    newTagInput.value = '';
    newTagInput.focus();
}

function closeTagPicker() {
    tagPickerModal.classList.add('hidden');
}

function renderTagPickerList() {
    tagPickerList.innerHTML = '';

    const sortedTags = Array.from(allTags).sort();

    if (sortedTags.length === 0) {
        tagPickerList.innerHTML = '<p class="text-gray-400 text-center text-sm">No tags found. Create one above!</p>';
        return;
    }

    sortedTags.forEach(tag => {
        const label = document.createElement('label');
        label.className = "flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer";

        const checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.checked = currentStepTags.has(tag);

        // Toggle logic (local state only, save on Done)
        checkbox.onchange = () => {
            if (checkbox.checked) {
                currentStepTags.add(tag);
            } else {
                currentStepTags.delete(tag);
            }
            // active view update is optional here since we haven't saved, 
            // but might be nice. Let's not renderActiveTags until confirm/real-time update.
        };

        label.append(checkbox, document.createTextNode(tag));
        tagPickerList.appendChild(label);
    });
}

function validateAndPreview(Engine) {
    // 1. Validate
    const result = Engine.validateConfig(currentConfig);

    if (!result.valid) {
        // Show Errors
        validationMsg.classList.remove('hidden');
        validationMsg.textContent = `⚠ ${result.errors[0].message}`;
        saveBtn.disabled = true;
        publishBtn.disabled = true;

        // Highlight in Form
        if (currentSchemaForm) currentSchemaForm.highlightErrors(result.errors);
    } else {
        // Valid
        validationMsg.classList.add('hidden');
        saveBtn.disabled = false;
        publishBtn.disabled = false;
        if (currentSchemaForm) currentSchemaForm.highlightErrors([]);
    }

    // 2. Update Preview
    updatePreview(Engine);
}

function updatePreview(Engine) {
    if (!Engine) Engine = Registry.get(selectedEngineId);
    if (!Engine) return;

    // Clear
    previewContainer.innerHTML = '';

    const seed = seedInput.value || null;

    try {
        Engine.render({
            container: previewContainer,
            config: currentConfig,
            context: { mode: 'preview', seed: seed }, // Pass seed
            onComplete: (res) => console.log("Step Complete:", res)
        });
    } catch (e) {
        previewContainer.innerHTML = `<div class="text-red-500 text-sm p-4">Error rendering preview: ${e.message}</div>`;
        console.error(e);
    }
}

// Global Listeners
document.getElementById('refresh-preview').onclick = () => updatePreview();
seedInput.addEventListener('change', () => updatePreview());

// Tag Management Listeners
manageTagsBtn.onclick = openTagPicker;
closeTagPickerBtn.onclick = closeTagPicker;

confirmTagsBtn.onclick = async () => {
    if (!selectedEngineId) return;
    try {
        const tags = Array.from(currentStepTags);
        // Optimistic update
        renderActiveTags();
        closeTagPicker();

        await setDoc(doc(db, 'step_metadata', selectedEngineId), { tags }, { merge: true });
    } catch (err) {
        console.error("Failed to save tags", err);
        alert("Error saving tags.");
    }
};

addNewTagBtn.onclick = () => {
    const raw = newTagInput.value.trim().toLowerCase();
    if (!raw) return;

    if (!allTags.has(raw)) {
        allTags.add(raw);
    }

    // Auto-select new tag
    currentStepTags.add(raw);

    newTagInput.value = '';
    renderTagPickerList();
    // Use focus to keep typing
    newTagInput.focus();
};

newTagInput.onkeydown = (e) => {
    if (e.key === 'Enter') addNewTagBtn.click();
}

// Fullscreen Toggle
if (fullscreenBtn && previewPaneWrapper) {
    fullscreenBtn.onclick = () => {
        if (!document.fullscreenElement) {
            previewPaneWrapper.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    // Update icon on state change (works for ESC key too)
    document.addEventListener('fullscreenchange', () => {
        const isFullscreen = !!document.fullscreenElement;
        const icon = fullscreenBtn.querySelector('i');
        if (icon) {
            icon.className = isFullscreen ? 'fas fa-compress' : 'fas fa-expand';
        }
    });
}


// Responsive Preview Logic
const previewSizer = document.getElementById('preview-sizer');
// We need to target the CONTAINER inside the sizer if we want to apply frame classes.
// In Canvas.js we used a separate 'preview-frame' div. 
// In HTML here, preview-sizer WRAPS preview-container.
// We should apply the class to ... `preview-container`? 
// No, `preview-container` IS the white box. 
// So let's apply the classes to `preview-container` directly.

const previewContainerLink = document.getElementById('preview-container'); // This is the inner box
// Wait, in StepTypeEditor.html:
// <div id="preview-sizer">
//   <div id="preview-container" class="bg-white shadow-xl ...">
// </div>
// We can apply .device-frame-phone etc to preview-container, BUT we need to remove the default utilities that conflict (w-full, border, etc.)
// Or we can toggle them.

const resizeButtons = document.querySelectorAll('.resize-preview-btn');

resizeButtons.forEach(btn => {
    btn.onclick = () => {
        const mode = btn.dataset.width === '375px' ? 'phone' : (btn.dataset.width === '768px' ? 'tablet' : 'desktop');

        // Reset base classes
        previewContainerLink.className = "bg-white shadow-xl overflow-hidden relative flex flex-col transition-all duration-300 mx-auto";

        if (mode === 'phone') {
            previewContainerLink.classList.add('device-frame-common', 'device-frame-phone');
        } else if (mode === 'tablet') {
            previewContainerLink.classList.add('device-frame-common', 'device-frame-tablet');
        } else {
            previewContainerLink.classList.add('device-frame-desktop', 'w-full', 'min-h-[600px]', 'border', 'border-gray-200', 'rounded-xl');
        }

        // Visual feedback
        resizeButtons.forEach(b => b.classList.remove('text-blue-600', 'bg-blue-50'));
        btn.classList.add('text-blue-600', 'bg-blue-50');
    };
});

// === NEW STEP LOGIC (CLOUD) ===
const newStepTypeBtn = document.getElementById('newStepTypeBtn');
if (newStepTypeBtn) {
    newStepTypeBtn.onclick = async () => {
        const name = prompt("Enter Name for new Cloud Step (e.g. 'FlashcardGame'):");
        if (!name) return;

        // Clean ID
        const id = name.replace(/[^a-zA-Z0-9]/g, '');
        if (!id) return;

        const boilerplate = `
export default class ${id} extends window.CourseEngine.BaseStep {
    static get id() { return '${id}'; }
    static get version() { return '1.0.0'; }
    static get displayName() { return '${name}'; }
    static get description() { return 'New Cloud Step'; }

    static get editorSchema() {
        return {
            fields: [
                { key: "message", label: "Message", type: "text", default: "Hello World" }
            ]
        };
    }

    static get defaultConfig() {
        return { message: "Hello from Cloud!" };
    }

    static render({ container, config }) {
        container.innerHTML = \`<div class="p-4 text-center">
            <h1 class="text-2xl font-bold">\${config.message}</h1>
            <p class="text-gray-500">I am a Cloud Step!</p>
        </div>\`;
    }
}`;

        try {
            // Save to Firestore
            // We use the ID as the doc ID for simplicity in 'system_step_types'
            const docRef = doc(db, "system_step_types", id);
            await setDoc(docRef, {
                code: boilerplate,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            alert(`✅ Cloud Step '${name}' created! Page will refresh to load it.`);
            window.location.reload();

        } catch (err) {
            console.error(err);
            alert("Failed to create cloud step.");
        }
    };
}

// === SAVE BUTTON LOGIC (Handles Code Save) ===
saveBtn.onclick = async () => {
    const Engine = Registry.get(selectedEngineId);
    if (!Engine) return;

    // Is Code Tab Active?
    const isCodeMode = !panelCode.classList.contains('hidden');

    if (isCodeMode) {
        // Saving CODE
        if (!Engine.isCloud) {
            alert("Cannot save built-in steps.");
            return;
        }

        const newCode = codeEditor.value;
        try {
            const docRef = doc(db, "system_step_types", Engine.cloudId || Engine.id);
            await setDoc(docRef, {
                code: newCode,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            alert("✅ Code Saved! Reloading to apply changes...");
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert("Failed to save code.");
        }

    } else {
        // Saving CONFIG (Default) - (Mock - usually we just update the preview)
        // In a real app we might save this as "System Defaults"? 
        // Or is this button for saving the Step Type DEFINITION? 
        // Actually, 'Save' in StepTypeEditor usually implies saving the Schema/Config.
        // For now, let's assume it just re-runs validation.
        validateAndPreview(Engine);
        alert("Configuration Validated (Local Preview Only). Use 'Publish' to version.");
    }
};

publishBtn.onclick = async () => {
    const Engine = Registry.get(selectedEngineId);
    if (!Engine) return;

    if (!Engine.isCloud) {
        alert("Built-in steps are pre-published and cannot be modified.");
        return;
    }

    // Optional: Prompt for version bump? For now just mark status.
    if (!confirm(`Publish '${Engine.displayName}'? This will make the latest code live for all courses.`)) return;

    try {
        publishBtn.disabled = true;
        publishBtn.textContent = "Publishing...";

        const docRef = doc(db, "system_step_types", Engine.cloudId);
        await setDoc(docRef, {
            status: 'published',
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }, { merge: true });

        alert(`✅ ${Engine.displayName} Published Successfully!`);
    } catch (err) {
        console.error(err);
        alert("Failed to publish: " + err.message);
    } finally {
        publishBtn.disabled = false;
        publishBtn.textContent = "Publish Step Type";
    }
};

// Start
renderList();

// Select first
const all = Registry.getAll();
if (all.length > 0) selectStepType(all[0].id);


