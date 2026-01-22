export class EditorUI {
    constructor(elements) {
        this.elements = elements;
        this.listeners = {};
        this.tabs = {
            config: { tab: elements.tabConfig, panel: elements.panelConfig },
            schema: { tab: elements.tabSchema, panel: elements.panelSchema },
            code: { tab: elements.tabCode, panel: elements.panelCode },
            experience: { tab: elements.tabExperience, panel: elements.panelExperience }
        };

        this.initEventListeners();
    }

    initEventListeners() {
        this.elements.tabConfig.onclick = () => this.switchTab('config');
        this.elements.tabSchema.onclick = () => this.switchTab('schema');
        this.elements.tabCode.onclick = () => {
            this.switchTab('code');
            this.emit('tab-switch', 'code');
        };
        this.elements.tabExperience.onclick = () => this.switchTab('experience');

        // New Step Button
        if (this.elements.newStepTypeBtn) {
            this.elements.newStepTypeBtn.onclick = () => this.emit('create-step');
        }

        // Search Input
        if (this.elements.searchSteps) {
            this.elements.searchSteps.oninput = (e) => this.filterList(e.target.value);
        }
    }

    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    emit(event, payload) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(payload));
        }
    }

    switchTab(tabKey) {
        Object.values(this.tabs).forEach(({ tab, panel }) => {
            if (tab) {
                tab.classList.remove('border-b-2', 'border-blue-500', 'text-blue-600');
                tab.classList.add('text-gray-500');
            }
            if (panel) panel.classList.add('hidden');
        });

        const active = this.tabs[tabKey];
        if (!active) return;

        active.tab.classList.remove('text-gray-500');
        active.tab.classList.add('border-b-2', 'border-blue-500', 'text-blue-600');
        active.panel.classList.remove('hidden');
    }

    renderList(steps, onSelect) {
        const list = this.elements.stepTypeList;
        list.innerHTML = '';
        steps.forEach(Engine => {
            const item = document.createElement('div');
            item.className = "step-item p-3 rounded hover:bg-blue-50 cursor-pointer border border-transparent hover:border-blue-100 transition flex justify-between items-center";
            item.dataset.id = Engine.id;

            let meta = `v${Engine.version}`;
            if (Engine.isCloud) meta += ` <span class="bg-blue-100 text-blue-600 px-1 rounded text-[10px] font-bold">CLOUD</span>`;

            item.innerHTML = `
                <div>
                    <div class="font-bold text-sm text-gray-800">${Engine.id}</div>
                    <div class="text-xs text-gray-500">${meta}</div>
                </div>
                <span class="text-gray-300">›</span>
            `;
            item.onclick = () => {
                // Highlight active
                list.querySelectorAll('.step-item').forEach(el => el.classList.remove('bg-blue-50', 'border-blue-100'));
                item.classList.add('bg-blue-50', 'border-blue-100');
                onSelect(Engine.id);
            };
            list.appendChild(item);
        });
    }

    filterList(query) {
        const lower = query.toLowerCase();
        const items = this.elements.stepTypeList.querySelectorAll('.step-item');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(lower) ? 'flex' : 'none';
        });
    }

    updateHeader(Engine) {
        this.elements.editorEmpty.classList.add('hidden');
        this.elements.currentTitle.textContent = Engine.displayName || Engine.id;
        this.elements.currentId.textContent = Engine.id;
        this.elements.versionBadge.textContent = 'v' + Engine.version;

        if (Engine.isCloud) {
            this.elements.cloudBadge.classList.remove('hidden');
            this.elements.codeOverlay.classList.add('hidden');
            this.elements.codeActions.classList.remove('hidden');
        } else {
            this.elements.cloudBadge.classList.add('hidden');
            this.elements.codeOverlay.classList.remove('hidden');
            this.elements.codeActions.classList.add('hidden');
        }
    }

    updateExperiencePanel(Engine) {
        if (!Engine?.experience) return;
        this.elements.expDevice.textContent = Engine.experience.device ?? 'Auto';
        this.elements.expTheme.textContent = Engine.experience.theme ?? 'Default';
        this.elements.expMotion.textContent = Engine.experience.motion === false ? 'Disabled' : 'Enabled';
        this.elements.expA11y.textContent = Engine.experience.a11y ?? 'Standard';
    }

    showValidation(errors) {
        if (errors && errors.length > 0) {
            this.elements.validationMsg.classList.remove('hidden');
            this.elements.validationMsg.textContent = `⚠ ${errors[0].message}`;
            this.elements.saveBtn.disabled = true;
            this.elements.publishBtn.disabled = true;
        } else {
            this.elements.validationMsg.classList.add('hidden');
            this.elements.saveBtn.disabled = false;
            this.elements.publishBtn.disabled = false;
        }
    }

    setSaveButtonState(state, message) {
        const btn = this.elements.saveBtn;
        if (state === 'loading') {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving...';
        } else if (state === 'success') {
            btn.innerHTML = `<i class="fas fa-check mr-1"></i> ${message || 'Saved!'}`;
            btn.classList.remove('text-gray-600');
            btn.classList.add('text-green-600', 'border-green-200', 'bg-green-50');
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-save mr-1"></i> Save';
                btn.classList.remove('text-green-600', 'border-green-200', 'bg-green-50');
                btn.classList.add('text-gray-600');
            }, 2000);
        } else if (state === 'error') {
            btn.disabled = false;
            btn.textContent = 'Save';
            alert(message);
        } else {
            btn.disabled = false;
            btn.textContent = 'Save';
        }
    }
}
