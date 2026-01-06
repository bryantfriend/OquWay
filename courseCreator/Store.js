// Store.js - Central State Management for Module Editor
// Refactored: Tracks -> Steps (No Pages)

import { courseService } from "./services/courseService.js";

class Store {
    constructor() {
        this.state = {
            courseId: null,
            moduleId: null,
            module: null, // { tracks: [ { id, title, color, steps: [] } ] }
            selectedTrackId: null,
            selectedStepId: null,
            // Global context
            courseLanguages: ['en'],
        };
        this.subscribers = new Set();
        this.autosaveTimeout = null;
    }

    // --- ACTIONS ---

    init(courseId, moduleId, moduleData, courseLanguages = ['en']) {
        this.state.courseId = courseId;
        this.state.moduleId = moduleId;
        this.state.module = this._ensureCompatibility(moduleData);
        this.state.courseLanguages = courseLanguages;

        // Default Selection
        if (this.state.module.tracks.length > 0) {
            this.selectTrack(this.state.module.tracks[0].id);
        }
    }

    // Ensure module has the new tracks->steps structure
    _ensureCompatibility(moduleData) {
        // 1. If no tracks, migrate from legacy 'steps' or old 'pages' system
        if (!moduleData.tracks || !Array.isArray(moduleData.tracks)) {
            // Migrating legacy data to Track -> Step system...


            // Default Track
            const defaultTrack = {
                id: 'track-' + Date.now(),
                title: "Main Track",
                color: "blue",
                steps: []
            };

            // Migrate legacy flat steps
            if (moduleData.steps && Array.isArray(moduleData.steps)) {
                defaultTrack.steps = moduleData.steps;
            }

            moduleData.tracks = [defaultTrack];
        }

        // 2. Cleanup: Ensure every track has a 'steps' array (handling previous 'pages' usage)
        moduleData.tracks.forEach(track => {
            if (!track.steps) {
                track.steps = [];
                // If we had pages, flatten them into steps
                if (track.pages) {
                    track.pages.forEach(p => {
                        if (p.blocks) {
                            track.steps.push(...p.blocks);
                        }
                    });
                    delete track.pages; // Remove pages property
                }
            }
        });

        return moduleData;
    }

    // --- SELECTION ---

    selectTrack(trackId) {
        this.state.selectedTrackId = trackId;
        this.state.selectedStepId = null;
        this._notify();
    }

    selectStep(stepId) {
        this.state.selectedStepId = stepId;
        // Ensure parent track is selected? 
        // useful if we select via search or other means
        const track = this.getTrackForStep(stepId);
        if (track && track.id !== this.state.selectedTrackId) {
            this.state.selectedTrackId = track.id;
        }
        this._notify();
    }

    // --- DATA MODIFICATION (MUTATORS) ---

    updateModuleTitle(newTitle) {
        this.state.module.title = newTitle;
        this._notify();
        this._triggerAutosave();
    }

    // Track Methods
    addTrack(title, color = "gray") {
        const newTrack = {
            id: 'track-' + Date.now(),
            title,
            color,
            mood: 'neutral',   // NEW
            intent: 'learn',   // NEW
            steps: []
        };
        this.state.module.tracks.push(newTrack);
        this._notify();
        this._triggerAutosave();
        return newTrack;
    }

    updateTrackTitle(trackId, title) {
        const track = this.getTrack(trackId);
        if (track) {
            track.title = title;
            this._notify();
            this._triggerAutosave();
        }
    }

    updateTrackColor(trackId, color) {
        const track = this.getTrack(trackId);
        if (track) {
            track.color = color;
            this._notify();
            this._triggerAutosave();
        }
    }

    updateTrackMood(trackId, mood) {
        const track = this.getTrack(trackId);
        if (track) {
            track.mood = mood;
            this._notify();
            this._triggerAutosave();
        }
    }

    updateTrackIntent(trackId, intent) {
        const track = this.getTrack(trackId);
        if (track) {
            track.intent = intent;
            this._notify();
            this._triggerAutosave();
        }
    }

    duplicateTrack(trackId) {
        const track = this.getTrack(trackId);
        if (!track) return;

        const newTrack = JSON.parse(JSON.stringify(track));
        newTrack.id = 'track-' + Date.now();
        newTrack.title = `${newTrack.title} (Copy)`;

        // Regenerate IDs for steps to avoid collisions
        newTrack.steps.forEach(s => {
            s.id = 'step-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        });

        const idx = this.state.module.tracks.findIndex(t => t.id === trackId);
        this.state.module.tracks.splice(idx + 1, 0, newTrack);

        this._notify();
        this._triggerAutosave();
    }

    deleteTrack(trackId) {
        // Enforce Minimum 3 Tracks
        if (this.state.module.tracks.length <= 3) {
            Toast.error("Modules must have at least 3 tracks.");
            return;
        }

        this.state.module.tracks = this.state.module.tracks.filter(t => t.id !== trackId);
        if (this.state.selectedTrackId === trackId) {
            this.selectTrack(this.state.module.tracks[0].id);
        } else {
            this._notify();
            this._triggerAutosave();
        }
    }

    reorderTracks(newTracksArray) {
        this.state.module.tracks = newTracksArray;
        this._notify();
        this._triggerAutosave();
    }


    // Step Methods (Renamed from Block)
    addStep(trackId, stepData, index = -1) {
        const track = this.getTrack(trackId);
        if (!track) return;

        // Assign ID if missing
        if (!stepData.id) {
            stepData.id = 'step-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        }

        if (index === -1) {
            track.steps.push(stepData);
        } else {
            track.steps.splice(index, 0, stepData);
        }

        // Force select
        this.state.selectedStepId = stepData.id;

        this._notify();
        this._triggerAutosave();
        return stepData;
    }

    updateStep(stepId, newData) {
        const track = this.getTrackForStep(stepId);
        if (!track) return;

        const idx = track.steps.findIndex(s => s.id === stepId);
        if (idx !== -1 && newData) {
            track.steps[idx] = { ...track.steps[idx], ...newData };
        }

        this._notify();
        this._triggerAutosave();
    }

    deleteStep(stepId) {
        const track = this.getTrackForStep(stepId);
        if (!track) return;

        track.steps = track.steps.filter(s => s.id !== stepId);
        if (this.state.selectedStepId === stepId) {
            this.state.selectedStepId = null;
        }
        this._notify();
        this._triggerAutosave();
    }

    reorderSteps(trackId, newStepsArray) {
        const track = this.getTrack(trackId);
        if (!track) return;
        track.steps = newStepsArray;
        this._notify();
        this._triggerAutosave();
    }

    moveStep(stepId, targetTrackId, newIndex) {
        const sourceTrack = this.getTrackForStep(stepId);
        const targetTrack = this.getTrack(targetTrackId);

        if (!sourceTrack || !targetTrack) return;

        // Remove from source
        const stepIndex = sourceTrack.steps.findIndex(s => s.id === stepId);
        if (stepIndex === -1) return;

        const [step] = sourceTrack.steps.splice(stepIndex, 1);

        // Add to target
        if (newIndex === -1 || newIndex >= targetTrack.steps.length) {
            targetTrack.steps.push(step);
        } else {
            targetTrack.steps.splice(newIndex, 0, step);
        }

        // Update selection if needed
        if (this.state.selectedStepId === stepId) {
            this.state.selectedTrackId = targetTrackId;
        }

        this._notify();
        this._triggerAutosave();
    }


    // --- GETTERS ---

    getModule() { return this.state.module; }

    getTrack(trackId) {
        return this.state.module.tracks.find(t => t.id === trackId);
    }

    getTrackForStep(stepId) {
        return this.state.module.tracks.find(t => t.steps.some(s => s.id === stepId));
    }

    getStep(stepId) {
        for (const t of this.state.module.tracks) {
            const s = t.steps.find(step => step.id === stepId);
            if (s) return s;
        }
        return null;
    }

    getSelectedTrack() { return this.getTrack(this.state.selectedTrackId); }
    getSelectedStep() { return this.getStep(this.state.selectedStepId); }


    // --- SUBSCRIPTION & EVENTS ---

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    _notify() {
        this.subscribers.forEach(cb => cb(this.state));
    }

    // --- VALIDATION ---

    getPublishStatus() {
        const issues = [];
        const tracks = this.state.module.tracks;

        if (tracks.length < 3) {
            issues.push(`Need at least 3 tracks (current: ${tracks.length})`);
        }

        tracks.forEach(t => {
            if (t.steps.length === 0) {
                issues.push(`Track "${t.title}" is empty`);
            }
        });

        return {
            isReady: issues.length === 0,
            status: issues.length === 0 ? 'Published' : 'Draft',
            issues
        };
    }

    // --- PERSISTENCE ---

    _triggerAutosave() {
        if (this.autosaveTimeout) clearTimeout(this.autosaveTimeout);

        const statusEl = document.getElementById('saveStatus');
        if (statusEl) statusEl.textContent = "Saving...";

        this.autosaveTimeout = setTimeout(async () => {
            try {
                if (this.state.courseId && this.state.moduleId) {

                    // Simple sync:
                    const flatSteps = [];
                    this.state.module.tracks.forEach(t => {
                        t.steps.forEach(s => {
                            flatSteps.push(s);
                        });
                    });

                    const dataToSave = {
                        tracks: this.state.module.tracks,
                        steps: flatSteps, // Keep 'steps' populated for the player!
                        title: this.state.module.title
                    };

                    await courseService.updateModule(this.state.courseId, this.state.moduleId, dataToSave);
                    if (statusEl) statusEl.textContent = "Saved";
                }
            } catch (err) {
                console.error("Autosave failed", err);
                if (statusEl) statusEl.textContent = "Error saving";
            }
        }, 1000);
    }

}

export const store = new Store();
