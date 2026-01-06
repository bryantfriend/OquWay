import { Registry } from "../../Shared/steps/Registry.js";
import { db } from "../firebase-init.js";
import { doc, getDoc, setDoc, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Ensure engines are loaded (Lazy load in loadSteps instead)
// Registry.init();

export class SmartStepPicker {
    constructor(onSelect) {
        this.onSelect = onSelect;
        this.stepMetadata = {}; // Store DB metadata here
        this.allTags = new Set();
        this.dbUnsubscribe = null;
        this.isSettingsMode = false;
        this.selectedFilters = new Set();

        this.currentCategory = 'all';
        this.searchQuery = '';
        this.availableSteps = [];
    }

    async loadSteps() {
        await Registry.init(db); // Wait for Cloud steps (Registry already has DB from main init or we pass global db if needed, but Registry singleton holds DB if init called once)

        // Temporary metadata map until all Engines are updated
        const metadataMap = {
            multiplicationGame: { category: 'game', tags: ['math', 'kids'], displayName: 'Multiplication Game' },
            matchingGame: { category: 'game', tags: ['pairs', 'kids'], displayName: 'Matching Game' },
            primer: { category: 'content', tags: ['intro', 'text'], displayName: 'Primer' },
            mission: { category: 'assessment', tags: ['quest', 'quiz'], displayName: 'Mission' },
            reflection: { category: 'input', tags: ['journal', 'text'], displayName: 'Reflection' },
            movie: { category: 'content', tags: ['video', 'watch'], displayName: 'Movie' },
            audioLesson: { category: 'content', tags: ['audio', 'listening'], displayName: 'Audio Lesson' },
            dialogue: { category: 'simulation', tags: ['chat', 'speak'], displayName: 'Dialogue' },
            roleplay: { category: 'simulation', tags: ['ai', 'speak'], displayName: 'Roleplay' },
            intentCheck: { category: 'assessment', tags: ['check', 'quiz'], displayName: 'Intent Check' },
            letterRacingGame: { category: 'game', tags: ['letters', 'speed'], displayName: 'Letter Racing' }
        };

        this.availableSteps = Registry.getAll().map(Engine => {
            const fallback = metadataMap[Engine.id] || {};
            return {
                typeId: Engine.id,
                displayName: Engine.displayName || fallback.displayName || this.formatDisplayName(Engine.id),
                description: Engine.description || "No description",
                category: Engine.category !== 'misc' ? Engine.category : (fallback.category || 'misc'),
                complexity: 'medium',
                defaultTags: (Engine.tags && Engine.tags.length) ? Engine.tags : (fallback.tags || [])
            };
        });

        // Collect initial tags
        this.allTags.clear();
        this.availableSteps.forEach(s => s.defaultTags.forEach(t => this.allTags.add(t)));
    }

    render(previousStepType = null) {

        // Define categories for tabs/groups
        this.categories = [
            { id: 'all', label: 'All', icon: '🔍' },
            { id: 'content', label: 'Content', icon: '📝' },
            { id: 'input', label: 'Input', icon: '✍️' },
            { id: 'assessment', label: 'Quiz', icon: '❓' },
            { id: 'game', label: 'Game', icon: '🎮' },
            { id: 'simulation', label: 'Sim', icon: '🎭' }
        ];
        // 1. Default fallback
        const defaultSuggested = ['primer', 'dialogue', 'matchingGame'];
        let suggestedIds = defaultSuggested;

        if (previousStepType) {
            const PreviousEngine = Registry.get(previousStepType);
            if (PreviousEngine && PreviousEngine.suggestedNextSteps && Array.isArray(PreviousEngine.suggestedNextSteps)) {
                suggestedIds = PreviousEngine.suggestedNextSteps;
            } else {
                const logic = {
                    primer: ['audioLesson', 'dialogue', 'matchingGame'],
                    audioLesson: ['matchingGame', 'reflection', 'dialogue'],
                    dialogue: ['roleplay', 'intentCheck', 'reflection'],
                    matchingGame: ['letterRacingGame', 'reflection', 'primer'],
                    letterRacingGame: ['primer', 'reflection', 'mission']
                };
                if (logic[previousStepType]) suggestedIds = logic[previousStepType];
            }
        }

        const suggestedSteps = this.availableSteps.filter(s => suggestedIds.includes(s.typeId));

        // Create modal container
        const modalOverlay = document.createElement('div');
        modalOverlay.className = "fixed inset-0 bg-gray-900 bg-opacity-50 z-[100] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in";
        modalOverlay.id = "smartStepPickerModal";

        // Close on click outside
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) this.close();
        });

        const modalContent = document.createElement('div');
        // FIX: Use max-h and flex-col, ensuring it doesn't overflow screen top
        modalContent.className = "bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all scale-100 my-4";
        modalContent.innerHTML = `
            <!-- Header -->
            <div class="px-6 py-4 border-b flex justify-between items-center bg-gray-50 flex-shrink-0">
                <div>
                    <h2 class="text-xl font-bold text-gray-800">Add Next Step</h2>
                    <p class="text-xs text-gray-500">Choose the best interaction for your learner</p>
                </div>
                <button class="close-btn text-gray-400 hover:text-gray-600 text-2xl leading-none px-2">&times;</button>
            </div>

            <!-- Toolbar (Search & Tabs) -->
            <div class="px-6 py-3 border-b bg-white flex flex-col gap-3 flex-shrink-0 z-10">
                <div class="flex gap-2">
                    <div class="relative flex-grow">
                        <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
                        <input type="text" id="pickerSearch" placeholder="Search steps..." 
                               class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow">
                    </div>
                </div>
                
                <div class="flex flex-wrap gap-2 items-center" id="filterContainer">
                    <!-- Filters injected here -->
                    <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar" id="categoryTabs">
                        ${this.categories.map(cat => `
                            <button class="cat-tab px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 hover:bg-gray-100 whitespace-nowrap transition-colors ${cat.id === 'all' ? 'bg-gray-800 text-white border-gray-800 hover:bg-gray-700' : 'text-gray-600'}" 
                                    data-cat="${cat.id}">
                                ${cat.icon} ${cat.label}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Tag Filter Bar (Visible when not in settings) -->
                 <div id="tagFilterBar" class="flex flex-wrap gap-2 text-xs">
                    <!-- Checkboxes for tags go here -->
                 </div>
            </div>

            <!-- Scrollable Content -->
            <div class="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
                
                <!-- Suggested Section (Only show if no search/filter active) -->
                <div id="suggestedSection" class="mb-8">
                    <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span>⭐ Suggested</span>
                        <div class="h-px bg-gray-200 flex-grow"></div>
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        ${suggestedSteps.map(step => this.renderSuggestedCard(step)).join('')}
                    </div>
                </div>

                <!-- All Steps Section -->
                <h3 id="allStepsTitle" class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span>📦 All Components</span>
                    <div class="h-px bg-gray-200 flex-grow"></div>
                </h3>
                
                <div id="stepsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <!-- Steps injected here via renderList -->
                </div>
                
                <div id="emptyState" class="hidden text-center py-12 text-gray-500">
                    <p class="text-lg">No steps match your search.</p>
                    <button class="mt-2 text-blue-600 hover:underline clear-search-btn">Clear filters</button>
                </div>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        this.modal = modalOverlay;
        this.stepsGrid = modalContent.querySelector('#stepsGrid');
        this.suggestedSection = modalContent.querySelector('#suggestedSection');
        this.allStepsTitle = modalContent.querySelector('#allStepsTitle');
        this.emptyState = modalContent.querySelector('#emptyState');
        this.searchInput = modalContent.querySelector('#pickerSearch');
        this.tabsContainer = modalContent.querySelector('#categoryTabs');

        // New UI Refs
        this.tagFilterBar = modalContent.querySelector('#tagFilterBar');

        // Initial Render
        this.renderList();
        this.renderTagFilters(); // Initial render of tags

        // Listeners
        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderList();
        });

        modalContent.querySelector('.close-btn').addEventListener('click', () => this.close());
        modalContent.querySelector('.clear-search-btn')?.addEventListener('click', () => {
            // ... clear logic
            this.selectedFilters.clear();
            this.renderTagFilters(); // update UI state
            this.searchQuery = '';
            this.searchInput.value = '';
            this.renderList();
        });

        this.tabsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.cat-tab');
            if (btn) {
                this.currentCategory = btn.dataset.cat;
                this.updateTabs();
                this.renderList();
            }
        });

        // Add listeners to Suggested Cards immediately
        modalContent.querySelectorAll('.suggested-card').forEach(card => {
            card.addEventListener('click', () => {
                this.onSelect(card.dataset.id);
                this.close();
            });
        });

        // Start Firestore Sync
        this.syncTagsWithFirestore();

        // Auto-focus search
        setTimeout(() => this.searchInput.focus(), 50);

        // Show Loading State
        this.stepsGrid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500"><div class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>Loading steps...</div>';

        // Load Steps & Refresh
        this.loadSteps().then(() => {
            this.renderList();
            this.renderTagFilters(); // Tags depend on steps
            this.updateSuggestedSection(previousStepType);
        });

        return this;
    }

    updateSuggestedSection(previousStepType) {
        // Re-calculate suggested steps now that availableSteps is populated
        const defaultSuggested = ['primer', 'dialogue', 'matchingGame'];
        let suggestedIds = defaultSuggested;

        if (previousStepType) {
            const PreviousEngine = Registry.get(previousStepType);
            if (PreviousEngine && PreviousEngine.suggestedNextSteps && Array.isArray(PreviousEngine.suggestedNextSteps)) {
                suggestedIds = PreviousEngine.suggestedNextSteps;
            } else {
                const logic = {
                    primer: ['audioLesson', 'dialogue', 'matchingGame'],
                    audioLesson: ['matchingGame', 'reflection', 'dialogue'],
                    dialogue: ['roleplay', 'intentCheck', 'reflection'],
                    matchingGame: ['letterRacingGame', 'reflection', 'primer'],
                    letterRacingGame: ['primer', 'reflection', 'mission']
                };
                if (logic[previousStepType]) suggestedIds = logic[previousStepType];
            }
        }

        const suggestedSteps = this.availableSteps.filter(s => suggestedIds.includes(s.typeId));

        if (this.suggestedSection) {
            const grid = this.suggestedSection.querySelector('.grid');
            if (grid) {
                grid.innerHTML = suggestedSteps.length ? suggestedSteps.map(step => this.renderSuggestedCard(step)).join('') : '<p class="text-sm text-gray-400 italic">No suggestions available.</p>';
            }

            // Re-bind listeners
            grid.querySelectorAll('.suggested-card').forEach(card => {
                card.addEventListener('click', () => {
                    this.onSelect(card.dataset.id);
                    this.close();
                });
            });

            // Show/Hide section based on availability (optional) or just keep it
            this.suggestedSection.style.display = suggestedSteps.length ? 'block' : 'none';
        }
    }

    async syncTagsWithFirestore() {
        const colRef = collection(db, 'step_metadata');
        this.dbUnsubscribe = onSnapshot(colRef, (snapshot) => {
            snapshot.docs.forEach(docSnap => {
                const stepId = docSnap.id;
                const data = docSnap.data();
                if (data.tags && Array.isArray(data.tags)) {
                    this.stepMetadata[stepId] = data.tags;
                    // Add to global list
                    data.tags.forEach(t => this.allTags.add(t));
                }
            });
            this.renderTagFilters();
            this.renderList(); // Re-render cards to reflect new metadata
        });
    }

    renderTagFilters() {
        if (!this.tagFilterBar) return;
        this.tagFilterBar.innerHTML = '';

        const sortedTags = Array.from(this.allTags).sort();

        sortedTags.forEach(tag => {
            const isSelected = this.selectedFilters.has(tag);
            const btn = document.createElement('button');
            btn.className = `px-2 py-1 rounded border text-xs font-semibold transition-colors ${isSelected
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`;
            btn.textContent = `#${tag}`;
            btn.onclick = () => {
                if (isSelected) this.selectedFilters.delete(tag);
                else this.selectedFilters.add(tag);
                this.renderTagFilters();
                this.renderList();
            };
            this.tagFilterBar.appendChild(btn);
        });
    }

    renderSuggestedCard(step) {
        return `
            <div class="suggested-card group bg-white p-4 rounded-xl shadow-sm hover:shadow-md border border-indigo-100 hover:border-indigo-300 cursor-pointer transition-all duration-200 flex items-center gap-4" data-id="${step.typeId}">
                <div class="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    ${this.getIcon ? this.getIcon(step.typeId) : '✨'}
                </div>
                <div>
                    <h4 class="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">${step.displayName}</h4>
                    <span class="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase">Popular</span>
                </div>
                <div class="ml-auto opacity-0 group-hover:opacity-100 text-indigo-500 font-bold text-xl">+</div>
            </div>
        `;
    }

    // Helper for icons if not generic
    getIcon(id) {
        // Simple map or fallback
        const icons = { primer: '🖼️', dialogue: '💬', matchingGame: '🧩' };
        return icons[id] || '📦';
    }

    updateTabs() {
        this.tabsContainer.querySelectorAll('.cat-tab').forEach(btn => {
            const isActive = btn.dataset.cat === this.currentCategory;
            if (isActive) {
                btn.className = "cat-tab px-3 py-1.5 rounded-full text-sm font-medium border border-gray-800 bg-gray-800 text-white whitespace-nowrap transition-colors";
            } else {
                btn.className = "cat-tab px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 whitespace-nowrap transition-colors";
            }
        });
    }

    renderList() {
        this.stepsGrid.innerHTML = '';

        const isFiltered = this.currentCategory !== 'all' || this.searchQuery.length > 0 || this.selectedFilters.size > 0;

        // Toggle Suggested Section
        if (this.suggestedSection) {
            this.suggestedSection.style.display = isFiltered ? 'none' : 'block';
        }
        if (this.allStepsTitle) {
            // Update title based on context
            this.allStepsTitle.querySelector('span').textContent = isFiltered ? 'Results' : '📦 All Components';
        }

        const filtered = this.availableSteps.filter(step => {
            // Merge tags: defaults + DB overrides
            const dbTags = this.stepMetadata[step.typeId] || [];
            // Union of tags
            const effectiveTags = new Set([...step.defaultTags, ...dbTags]); // Using defaults + DB
            // Attach to step obj for rendering
            step._currentTags = effectiveTags;

            const matchesCat = this.currentCategory === 'all' || step.category === this.currentCategory;
            const matchesSearch = !this.searchQuery ||
                step.displayName.toLowerCase().includes(this.searchQuery) ||
                step.description.toLowerCase().includes(this.searchQuery) ||
                Array.from(effectiveTags).some(t => t.toLowerCase().includes(this.searchQuery));

            // Tag Filter
            const matchesTags = this.selectedFilters.size === 0 ||
                Array.from(this.selectedFilters).every(filterTag => effectiveTags.has(filterTag));

            return matchesCat && matchesSearch && matchesTags;
        });

        if (filtered.length === 0) {
            this.emptyState.classList.remove('hidden');
            return;
        }
        this.emptyState.classList.add('hidden');

        filtered.forEach(step => {
            const card = document.createElement('div');
            card.className = "group bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex flex-col gap-2 relative overflow-hidden";

            // Complexity Badge
            const complexityColors = { low: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-red-100 text-red-700' };
            const badgeClass = complexityColors[step.complexity] || 'bg-gray-100 text-gray-600';

            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <h3 class="font-bold text-gray-800 group-hover:text-blue-600">${step.displayName}</h3>
                    <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${badgeClass}">${step.complexity}</span>
                </div>
                <p class="text-sm text-gray-500 line-clamp-2">${step.description}</p>
                <div class="mt-auto pt-2 flex gap-1 flex-wrap">
                    ${Array.from(step._currentTags).slice(0, 3).map(t => `<span class="text-xs bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded border border-gray-100">#${t}</span>`).join('')}
                    ${step._currentTags.size > 3 ? `<span class="text-xs text-gray-300">+${step._currentTags.size - 3}</span>` : ''}
                </div>
            `;

            // Card Click (Selection)
            card.addEventListener('click', () => {
                this.onSelect(step.typeId);
                this.close();
            });

            this.stepsGrid.appendChild(card);
        });
    }

    async handleTagToggle(stepId, tag, isChecked) {
        // Update DB
        const ref = doc(db, 'step_metadata', stepId);

        // Find existing tags from `availableSteps` cache (which has _currentTags)
        const step = this.availableSteps.find(s => s.typeId === stepId);
        if (!step) return;

        const newTags = new Set(step._currentTags);
        if (isChecked) newTags.add(tag);
        else newTags.delete(tag);

        const tagArray = Array.from(newTags);

        try {
            await setDoc(ref, { tags: tagArray }, { merge: true });
            // Optimistic update (onSnapshot will eventually update, but this is faster)
            this.stepMetadata[stepId] = tagArray;
            this.renderList();
        } catch (e) {
            console.error("Tag update failed", e);
            alert("Failed to save tag");
        }
    }

    close() {
        if (!this.modal) return;

        const modalEl = this.modal;
        this.modal = null; // Clear reference immediately to prevent double removal

        // If there's an active Firestore listener, unsubscribe
        if (this.dbUnsubscribe) {
            this.dbUnsubscribe();
            this.dbUnsubscribe = null;
        }

        modalEl.classList.add('opacity-0');
        setTimeout(() => {
            if (modalEl && modalEl.parentNode) {
                modalEl.parentNode.removeChild(modalEl);
            }
        }, 200);
    }

    formatDisplayName(name) {
        // Convert camelCase to Title Case
        const result = name.replace(/([A-Z])/g, " $1");
        return result.charAt(0).toUpperCase() + result.slice(1);
    }
}
