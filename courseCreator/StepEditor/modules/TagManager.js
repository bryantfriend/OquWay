import { db } from "../../firebase-init.js";
import { doc, onSnapshot, setDoc, collection } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

export class TagManager {
    constructor(elements) {
        this.elements = elements; // activeTagsList, tagPickerModal, etc.
        this.allTags = new Set([
            "listening", "speaking", "reading", "writing",
            "grammar", "vocabulary", "pronunciation",
            "beginner", "intermediate", "advanced",
            "interactive", "video", "audio", "text"
        ]);
        this.currentStepTags = new Set();
        this.tagUnsubscribe = null;
        this.currentId = null;

        this.initGlobalTagSync();
        this.initEventListeners();
    }

    initGlobalTagSync() {
        // Sync all known tags
        onSnapshot(collection(db, 'step_metadata'), (snapshot) => {
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.tags && Array.isArray(data.tags)) {
                    data.tags.forEach(t => this.allTags.add(t));
                }
            });
        });
    }

    initEventListeners() {
        this.elements.manageTagsBtn.onclick = () => this.openPicker();
        this.elements.closeTagPickerBtn.onclick = () => this.elements.tagPickerModal.classList.add('hidden');

        this.elements.addNewTagBtn.onclick = () => this.addNewTag();
        this.elements.newTagInput.onkeydown = (e) => {
            if (e.key === 'Enter') this.addNewTag();
        };

        this.elements.confirmTagsBtn.onclick = () => this.saveTags();
    }

    setStep(id) {
        this.currentId = id;
        if (this.tagUnsubscribe) {
            this.tagUnsubscribe();
            this.tagUnsubscribe = null;
        }

        this.currentStepTags.clear();
        this.renderActiveTags();

        this.tagUnsubscribe = onSnapshot(doc(db, 'step_metadata', id), (docSnap) => {
            this.currentStepTags.clear();
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.tags && Array.isArray(data.tags)) {
                    data.tags.forEach(t => this.currentStepTags.add(t));
                }
            }
            this.renderActiveTags();
        });
    }

    renderActiveTags() {
        const list = this.elements.activeTagsList;
        list.innerHTML = '';
        if (this.currentStepTags.size === 0) {
            list.innerHTML = '<span class="italic text-gray-400">No tags selected.</span>';
            return;
        }

        this.currentStepTags.forEach(tag => {
            const span = document.createElement('span');
            span.className = "bg-gray-100 text-gray-700 px-2 py-1 rounded border text-xs";
            span.textContent = "#" + tag;
            list.appendChild(span);
        });
    }

    openPicker() {
        this.elements.tagPickerModal.classList.remove('hidden');
        this.renderPickerList();
        this.elements.newTagInput.value = '';
        this.elements.newTagInput.focus();
    }

    renderPickerList() {
        const list = this.elements.tagPickerList;
        list.innerHTML = '';
        const sorted = Array.from(this.allTags).sort();

        if (sorted.length === 0) {
            list.innerHTML = '<p class="text-gray-400 text-center text-sm">No tags found.</p>';
            return;
        }

        sorted.forEach(tag => {
            const label = document.createElement('label');
            label.className = "flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer";

            const checkbox = document.createElement('input');
            checkbox.type = "checkbox";
            checkbox.checked = this.currentStepTags.has(tag);
            checkbox.onchange = () => {
                if (checkbox.checked) {
                    this.currentStepTags.add(tag);
                } else {
                    this.currentStepTags.delete(tag);
                }
            };

            label.append(checkbox, document.createTextNode(tag));
            list.appendChild(label);
        });
    }

    addNewTag() {
        const raw = this.elements.newTagInput.value.trim().toLowerCase();
        if (!raw) return;

        if (!this.allTags.has(raw)) this.allTags.add(raw);
        this.currentStepTags.add(raw);

        this.elements.newTagInput.value = '';
        this.renderPickerList();
        this.elements.newTagInput.focus();
    }

    async saveTags() {
        if (!this.currentId) return;
        try {
            const tags = Array.from(this.currentStepTags);
            this.renderActiveTags();
            this.elements.tagPickerModal.classList.add('hidden');

            await setDoc(doc(db, 'step_metadata', this.currentId), { tags }, { merge: true });
        } catch (err) {
            console.error(err);
            alert("Error saving tags.");
        }
    }
}
