import { Registry } from './js/engines/Registry.js';
import { SchemaForm } from './js/components/SchemaForm.js';
import { db } from "./firebase-init.js";
import { doc, onSnapshot, setDoc, addDoc, collection, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { PreviewManager } from './StepEditor/modules/PreviewManager.js';

// Auto-register & Async Init
const initPromise = Promise.resolve(Registry.init());

function getActiveCourseLanguages() {
    try {
        const raw = localStorage.getItem("activeCourseLanguages");
        const langs = JSON.parse(raw);
        if (Array.isArray(langs) && langs.length) return langs;
    } catch (e) { }
    return ['en'];
}
const classLanguages = getActiveCourseLanguages();

function updateExperiencePanel(Engine) {
    if (!Engine?.experience) return;

    document.getElementById('exp-device').textContent =
        Engine.experience.device ?? 'Auto';

    document.getElementById('exp-theme').textContent =
        Engine.experience.theme ?? 'Default';

    document.getElementById('exp-motion').textContent =
        Engine.experience.motion === false ? 'Disabled' : 'Enabled';

    document.getElementById('exp-a11y').textContent =
        Engine.experience.a11y ?? 'Standard';
}

// Init CodeMirror helpers if needed (Logic for init was also removed, let's put it back)
let cmEditor = null;
setTimeout(() => {
    const txtArea = document.getElementById('code-editor');
    if (txtArea) {
        cmEditor = CodeMirror.fromTextArea(txtArea, {
            mode: "javascript",
            theme: "dracula",
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            extraKeys: { "Ctrl-Space": "autocomplete" }
        });
        cmEditor.setSize("100%", "600px");
    }
}, 100);

// DOM Elements

// DOM Elements
const stepTypeList = document.getElementById('stepTypeList');
const editorEmpty = document.getElementById('editor-empty');
const currentTitle = document.getElementById('current-step-title');
const currentId = document.getElementById('current-step-id');
const configContainer = document.getElementById('config-form-container');
const schemaEditor = document.getElementById('schema-json-editor');
// const codeEditor = document.getElementById('code-editor'); // Replaced by CodeMirror
const codeOverlay = document.getElementById('code-overlay');
const cloudBadge = document.getElementById('cloud-badge');
const codeActions = document.getElementById('code-actions'); // For Format Button

// Preview & Experience Elements
const previewContainer = document.getElementById('preview-container');
const versionBadge = document.getElementById('version-badge');
const validationMsg = document.getElementById('validation-msg');
const saveBtn = document.getElementById('save-btn');
const publishBtn = document.getElementById('publish-btn');
const seedInput = document.getElementById('seed-input');

// Initialize Preview Manager
const previewManager = new PreviewManager(
    previewContainer,
    document.getElementById('experience-overlay'),
    seedInput
);

// TABS
const tabConfig = document.getElementById('tab-config');
const tabSchema = document.getElementById('tab-schema');
const tabCode = document.getElementById('tab-code');
const tabExperience = document.getElementById('tab-experience');
const panelExperience = document.getElementById('panel-experience');
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
const tabs = {
    config: { tab: tabConfig, panel: panelConfig },
    schema: { tab: tabSchema, panel: panelSchema },
    code: { tab: tabCode, panel: panelCode },
    experience: { tab: tabExperience, panel: panelExperience }
};

function switchTab(tabKey) {
    Object.values(tabs).forEach(({ tab, panel }) => {
        if (tab) {
            tab.classList.remove('border-b-2', 'border-blue-500', 'text-blue-600');
            tab.classList.add('text-gray-500');
        }
        if (panel) panel.classList.add('hidden');
    });

    const active = tabs[tabKey];
    if (!active) return;

    active.tab.classList.remove('text-gray-500');
    active.tab.classList.add('border-b-2', 'border-blue-500', 'text-blue-600');
    active.panel.classList.remove('hidden');
}

tabConfig.onclick = () => switchTab('config');
tabSchema.onclick = () => switchTab('schema');
tabCode.onclick = () => {
    switchTab('code');
    if (cmEditor) setTimeout(() => cmEditor.refresh(), 50);
};
tabExperience.onclick = () => switchTab('experience');

// 1. Initialize List
async function renderList() {
    await initPromise; // Wait for registry
    const steps = Registry.getAll();
    console.log(`[StepTypeEditor] Rendering ${steps.length} steps:`, steps.map(s => s.id));
    stepTypeList.innerHTML = '';
    steps.forEach(Engine => {
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
    currentConfig = (Engine.defaultConfig && typeof Engine.defaultConfig === 'object')
        ? structuredClone(Engine.defaultConfig)
        : (Engine.editorSchema ? generateDefaultFromSchema(Engine.editorSchema) : {});
    const schema = Engine.editorSchema || {};

    // Render Config Form (SchemaForm V2)


    currentSchemaForm = new SchemaForm(configContainer);
    currentSchemaForm.render({
        schema,
        value: currentConfig,
        onChange: (newData) => {
            currentConfig = newData;
            validateAndPreview(Engine);
        },
        context: {
            languages: classLanguages,
            className: 'Test Course',
            moduleName: 'Test Module'
        }
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
        codeActions.classList.remove('hidden'); // Show Actions

        // Add Format Button if not present
        if (!document.getElementById('format-code-btn')) {
            const btn = document.createElement('button');
            btn.id = 'format-code-btn';
            btn.className = "text-xs text-blue-600 hover:text-blue-800 font-bold mr-4 px-2 py-1 rounded hover:bg-blue-50 transition";
            btn.innerHTML = '<i class="fas fa-magic mr-1"></i> Format Code';
            btn.onclick = () => {
                if (cmEditor) {
                    const clean = js_beautify(cmEditor.getValue(), { indent_size: 4 });
                    cmEditor.setValue(clean);
                }
            };
            codeActions.insertBefore(btn, codeActions.firstChild);
        }

        try {
            const docSnap = await getDoc(doc(db, "system_step_types", Engine.cloudId));
            if (docSnap.exists()) {
                if (cmEditor) cmEditor.setValue(docSnap.data().code);
            }
        } catch (e) { console.error(e); }
        if (cmEditor) cmEditor.setOption("readOnly", false);
    } else {
        cloudBadge.classList.add('hidden');
        codeOverlay.classList.remove('hidden');
        codeActions.classList.add('hidden');
        if (cmEditor) {
            cmEditor.setValue("// Read Mode Only\n// Source available in local codebase.");
            cmEditor.setOption("readOnly", true);
        }
    }
    updateExperiencePanel(Engine);

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

function generateDefaultFromSchema(schema) {
    const fresh = {};
    if (schema.fields) {
        schema.fields.forEach(f => {
            if (f.default !== undefined) fresh[f.key] = f.default;
            else if (f.type === 'array' || f.type === 'list') fresh[f.key] = [];
            else if (f.type === 'object') fresh[f.key] = {};
            else fresh[f.key] = "";
        });
    }
    return fresh;
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
    const rawResult = Engine.validateConfig
        ? Engine.validateConfig(currentConfig)
        : { valid: true, errors: [] };

    // Resilience: Normalize to object
    const result = (typeof rawResult === 'object' && rawResult !== null)
        ? rawResult
        : { valid: !!rawResult, errors: rawResult ? [] : [{ message: 'Configuration is invalid' }] };

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

        // 2. Update Preview via Manager
        previewManager.render(Engine, currentConfig);
    }
}

// Global Listeners
document.getElementById('refresh-preview').onclick = () => previewManager.refresh();
// seedInput listener handled by PreviewManager


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
const resizeButtons = document.querySelectorAll('.resize-preview-btn');

resizeButtons.forEach(btn => {
    btn.onclick = () => {
        const mode = btn.dataset.width === '375px' ? 'phone' : (btn.dataset.width === '768px' ? 'tablet' : 'desktop');

        previewManager.setDeviceMode(mode);

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
      return {};
    }

    static get defaultConfig() {
        return { message: "Hello from Cloud!" };
    }

    static render({ container, config = {}, context = {}, onComplete }) {
        const isEditing = context?.mode === 'editor' || context?.mode === 'preview';
        const lang = context.language || 'en';
        const title = config.title?.[lang] || config.title?.en || 'Step';

        if (isEditing) {
            container.innerHTML = \`<div class="p-6 rounded-xl bg-white shadow-sm border-2 border-dashed text-center text-gray-400">
                <div class="text-3xl mb-2">✨</div>
                <div class="text-lg font-bold text-gray-600">\${title}</div>
                <div class="text-xs mt-1">Preview Mode</div>
            </div>\`;
            return;
        }

        container.innerHTML = \`<div class="p-4 text-center">
            <h1 class="text-2xl font-bold">\${title}</h1>
            <p class="text-gray-500">Player Placeholder</p>
        </div>\`;
        
        if(onComplete) setTimeout(() => onComplete({success:true}), 1000);
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

        const newCode = cmEditor ? cmEditor.getValue() : "";

        // UX: Show saving state
        const originalText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving...';

        try {
            // 1. Save to Firestore
            const docRef = doc(db, "system_step_types", Engine.cloudId || Engine.id);
            await setDoc(docRef, {
                code: newCode,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            // 2. Hot Reload in Registry (In-Memory)
            await Registry.reloadCloudStep(Engine.cloudId, newCode);

            // 3. Success Feedback
            saveBtn.innerHTML = '<i class="fas fa-check mr-1"></i> Saved!';
            saveBtn.classList.remove('text-gray-600');
            saveBtn.classList.add('text-green-600', 'border-green-200', 'bg-green-50');

            // 4. Update Preview immediately
            const NewEngine = Registry.get(selectedEngineId); // Get fresh class
            if (NewEngine) {
                validateAndPreview(NewEngine);
            }

            // 5. Reset Button after delay
            setTimeout(() => {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalText;
                saveBtn.classList.remove('text-green-600', 'border-green-200', 'bg-green-50');
                saveBtn.classList.add('text-gray-600');
            }, 2000);

        } catch (err) {
            console.error(err);
            alert("Failed to save code: " + err.message);
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
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
const saveSchemaBtn = document.getElementById('save-schema-btn');

if (saveSchemaBtn) {
    saveSchemaBtn.onclick = async () => {
        const Engine = Registry.get(selectedEngineId);
        if (!Engine || !Engine.isCloud) {
            alert("Schema can only be saved for cloud steps.");
            return;
        }

        let parsedSchema;
        try {
            parsedSchema = JSON.parse(schemaEditor.value);
        } catch (err) {
            alert("❌ Invalid JSON schema.\n\n" + err.message);
            return;
        }

        // OPTIONAL: light sanity check
        if (!parsedSchema.fields && !parsedSchema.groups) {
            alert("Schema must contain `fields` or `groups`.");
            return;
        }

        try {
            // 🔥 SAVE SCHEMA TO FIRESTORE
            await setDoc(
                doc(db, "system_step_types", Engine.cloudId),
                {
                    schema: parsedSchema,
                    updatedAt: new Date().toISOString()
                },
                { merge: true }
            );

            // 🔁 HOT-APPLY SCHEMA LOCALLY
            Engine.editorSchema = parsedSchema;

            // 🔄 REBUILD CONFIG FORM
            currentSchemaForm = new SchemaForm(
                configContainer,
                parsedSchema,
                currentConfig,
                (newData) => {
                    currentConfig = newData;
                    validateAndPreview(Engine);
                }
            );

            alert("✅ Schema saved and applied.");

        } catch (err) {
            console.error(err);
            alert("Failed to save schema.");
        }
    };
}


publishBtn.onclick = async () => {
    const Engine = Registry.get(selectedEngineId);
    if (!Engine) return;

    if (!Engine.isCloud) {
        alert("Built-in steps are pre-published and cannot be modified.");
        return;
    }

    // Optional: Prompt for version bump? For now just mark status.
    if (!confirm(`Publish '${Engine.displayName}' ? This will make the latest code live for all courses.`)) return;

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

(async () => {
    await initPromise;
    renderList();

    const all = Registry.getAll();
    if (all.length > 0) selectStepType(all[0].id);
})();



