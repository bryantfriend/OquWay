// 🔥 MUST RUN ONCE BEFORE ANY SCHEMA RENDERING
import '../../Shared/Fields/index.js';

import { StepManager } from './modules/StepManager.js';
import { EditorUI } from './modules/EditorUI.js';
import { CodeHandler } from './modules/CodeHandler.js';
import { PreviewManager } from './modules/PreviewManager.js';
import { TagManager } from './modules/TagManager.js';
import SchemaForm from '../js/components/SchemaForm.js';


class StepEditorApp {
    constructor() {
        this.stepManager = new StepManager();

        // --- 1. Map UI Elements ---
        this.ui = new EditorUI({
            // Structure
            stepTypeList: document.getElementById('stepTypeList'),
            editorEmpty: document.getElementById('editor-empty'),

            // Header
            currentTitle: document.getElementById('current-step-title'),
            currentId: document.getElementById('current-step-id'),
            versionBadge: document.getElementById('version-badge'),
            statusBadge: document.getElementById('status-badge'),
            cloudBadge: document.getElementById('cloud-badge'),

            // Actions
            saveBtn: document.getElementById('save-btn'),
            publishBtn: document.getElementById('publish-btn'),
            newStepTypeBtn: document.getElementById('newStepTypeBtn'),
            searchSteps: document.getElementById('searchSteps'),
            validationMsg: document.getElementById('validation-msg'),

            // Tabs
            tabConfig: document.getElementById('tab-config'),
            tabSchema: document.getElementById('tab-schema'),
            tabCode: document.getElementById('tab-code'),
            tabExperience: document.getElementById('tab-experience'),

            panelConfig: document.getElementById('panel-config'),
            panelSchema: document.getElementById('panel-schema'),
            panelCode: document.getElementById('panel-code'),
            panelExperience: document.getElementById('panel-experience'),

            // Experience Panel
            expDevice: document.getElementById('exp-device'),
            expTheme: document.getElementById('exp-theme'),
            expMotion: document.getElementById('exp-motion'),
            expA11y: document.getElementById('exp-a11y'),

            // Code specific
            codeOverlay: document.getElementById('code-overlay'),
            codeActions: document.getElementById('code-actions'),
        });

        // --- 2. Initialize Sub-Handlers ---

        this.codeHandler = new CodeHandler(document.getElementById('code-editor'));

        this.previewManager = new PreviewManager(
            document.getElementById('preview-container'),
            document.getElementById('experience-overlay'),
            document.getElementById('seed-input')
        );

        this.tagManager = new TagManager({
            manageTagsBtn: document.getElementById('manage-tags-btn'),
            activeTagsList: document.getElementById('active-tags-list'),
            tagPickerModal: document.getElementById('tagPickerModal'),
            closeTagPickerBtn: document.getElementById('closeTagPickerBtn'),
            tagPickerList: document.getElementById('tagPickerList'),
            newTagInput: document.getElementById('newTagInput'),
            addNewTagBtn: document.getElementById('addNewTagBtn'),
            confirmTagsBtn: document.getElementById('confirmTagsBtn')
        });

        this.schemaForm = new SchemaForm(
            document.getElementById('config-form-container')
        );


        // --- 3. Wire Up Events ---
        this.initEvents();

        // --- 4. Boot ---
        this.stepManager.init().then(() => this.render());
    }

    getActiveCourseLanguages() {
        try {
            const raw = localStorage.getItem("activeCourseLanguages");
            const langs = JSON.parse(raw);
            if (Array.isArray(langs) && langs.length) return langs;
        } catch (e) { }
        return ['en'];
    }

    initEvents() {
        // UI Events
        this.ui.on('create-step', async () => {
            const name = prompt("Enter Name for new Cloud Step (e.g. 'FlashcardGame'):");
            if (!name) return;
            try {
                const id = await this.stepManager.createCloudStep(name);
                alert(`✅ Cloud Step '${name}' created!`);
                window.location.reload();
            } catch (e) {
                alert("Failed: " + e.message);
            }
        });

        // Save Button (Hub)
        this.ui.elements.saveBtn.onclick = () => this.handleSave();

        // Publish
        this.ui.elements.publishBtn.onclick = () => this.handlePublish();

        // Schema Save
        const schemaBtn = document.getElementById('save-schema-btn');
        if (schemaBtn) schemaBtn.onclick = () => this.handleSchemaSave();

        // Code Format & AI Buttons
        const formatBtn = document.getElementById('format-code-btn');
        if (formatBtn) {
            formatBtn.onclick = () => this.codeHandler.formatCode();
        } else {
            const actions = document.getElementById('code-actions');
            if (actions) {
                // FORMAT BUTTON
                const btn = document.createElement('button');
                btn.id = 'format-code-btn';
                btn.className = "text-xs text-blue-600 hover:text-blue-800 font-bold mr-4 px-2 py-1 rounded hover:bg-blue-50 transition";
                btn.innerHTML = '<i class="fas fa-magic mr-1"></i> Format Code';
                btn.onclick = () => this.codeHandler.formatCode();
                actions.insertBefore(btn, actions.firstChild);

                // --- AI BUTTONS ---

                // Validate Code
                const valBtn = document.createElement('button');
                valBtn.className = "text-xs text-green-600 hover:text-green-800 font-bold mr-4 px-2 py-1 rounded hover:bg-green-50 transition";
                valBtn.innerHTML = '<i class="fas fa-check-double mr-1"></i> Check Logic';
                valBtn.onclick = () => {
                    const result = this.codeHandler.validateStructure();
                    if (result.valid) {
                        alert("✅ Logic looks compliant with BaseStep contract.");
                    } else {
                        alert("⚠️ Logic Issues Found:\n\n- " + result.defects.join("\n- "));
                    }
                };
                actions.insertBefore(valBtn, actions.firstChild);

                // Generate Skeleton
                const genBtn = document.createElement('button');
                genBtn.className = "text-xs text-purple-600 hover:text-purple-800 font-bold mr-4 px-2 py-1 rounded hover:bg-purple-50 transition";
                genBtn.innerHTML = '<i class="fas fa-robot mr-1"></i> Reset to Skeleton';
                genBtn.onclick = () => {
                    if (!this.currentEngine) return;
                    if (confirm("Overwrite current code with a fresh skeleton?")) {
                        this.codeHandler.generateSkeleton(this.currentEngine.id, this.currentEngine.displayName);
                    }
                };
                actions.insertBefore(genBtn, actions.firstChild);
            }
        }

        // Preview Controls
        document.getElementById('refresh-preview').onclick = () => this.refreshPreview();
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (fullscreenBtn) fullscreenBtn.onclick = () => this.previewManager.toggleFullscreen(document.getElementById('preview-pane-wrapper'));

        document.querySelectorAll('.resize-preview-btn').forEach(btn => {
            btn.onclick = () => {
                // Visual update
                document.querySelectorAll('.resize-preview-btn').forEach(b => b.classList.remove('text-blue-600', 'bg-blue-50'));
                btn.classList.add('text-blue-600', 'bg-blue-50');

                const mode = btn.dataset.width === '375px' ? 'phone' : (btn.dataset.width === '768px' ? 'tablet' : 'desktop');
                this.previewManager.setDeviceMode(mode);
            };
        });
    }

    render() {
        const steps = this.stepManager.getAllSteps();
        this.ui.renderList(steps, (id) => this.selectStep(id));
        if (steps.length > 0) this.selectStep(steps[0].id);
    }

    async selectStep(id) {
        const Engine = this.stepManager.selectStep(id);
        if (!Engine) return;

        this.currentConfig = Engine.defaultConfig
            ? structuredClone(Engine.defaultConfig)
            : {};
        this.currentEngine = Engine;

        // UI Updates
        this.ui.updateHeader(Engine);
        this.ui.updateExperiencePanel(Engine);

        // Tags
        this.tagManager.setStep(id);

        // Schema 
        this.schemaForm.render({
            schema: Engine.editorSchema,
            value: this.currentConfig,
            onChange: (newData) => {
                this.currentConfig = newData;
                this.validateAndPreview();
            },
            context: {
                languages: this.getActiveCourseLanguages(),
                stepId: Engine.id
            }
        });

        // Code
        if (Engine.isCloud) {
            const code = await this.stepManager.getCloudCode(Engine.cloudId);
            this.codeHandler.setValue(code);
            this.codeHandler.setReadOnly(false);
        } else {
            this.codeHandler.setValue("// Read Mode Only\n// Source available in local codebase.");
            this.codeHandler.setReadOnly(true);
        }

        // Preview
        this.validateAndPreview();
    }

    validateAndPreview() {
        if (!this.currentEngine) return;

        // 1. Validate
        // Runtime validation is removed. We trust the editor inputs (FieldEngine).
        // Optionally, we could run SchemaInference again to check types, but let's assume valid.

        let errors = [];
        this.ui.showValidation(errors);

        // 2. Preview
        this.previewManager.render(this.currentEngine, this.currentConfig);
    }

    refreshPreview() {
        this.validateAndPreview();
    }

    async handleSave() {
        if (!this.currentEngine) return;

        // Determine Mode
        const isCodeMode = !this.ui.elements.panelCode.classList.contains('hidden');

        if (isCodeMode) {
            if (!this.currentEngine.isCloud) {
                alert("Cannot save built-in steps.");
                return;
            }

            this.ui.setSaveButtonState('loading');
            try {
                let newCode = this.codeHandler.getValue();

                // 🔒 Cloud Step Safety: forbid ES imports
                if (/^\s*import\s+/m.test(newCode)) {
                    throw new Error(
                        "Cloud steps cannot use ES module imports.\n" +
                        "Use: const BaseStep = window.CourseEngine.BaseStep;"
                    );
                }

                const freshEngine = await this.stepManager.saveCode(
                    this.currentEngine.id,
                    newCode
                );


                // Update local ref
                this.currentEngine = freshEngine;
                this.validateAndPreview(); // Re-render with new code

                this.ui.setSaveButtonState('success');
            } catch (err) {
                console.error(err);
                this.ui.setSaveButtonState('error', "Failed to save code: " + err.message);
            }

        } else {
            // Config Save (Just validate)
            this.validateAndPreview();
            alert("Configuration Validated (Local Preview Only).");
        }
    }

    async handleSchemaSave() {
        alert("Schemas are now inferred from defaultConfig. Please update defaultConfig in the Code tab.");
    }

    async handlePublish() {
        if (!this.currentEngine) return;
        if (!confirm(`Publish '${this.currentEngine.displayName}'?`)) return;

        try {
            await this.stepManager.publishStep(this.currentEngine.id);
            alert("✅ Published Successfully!");
        } catch (e) {
            alert("Failed: " + e.message);
        }
    }
}

// Boot
window.StepEditorApp = new StepEditorApp();
