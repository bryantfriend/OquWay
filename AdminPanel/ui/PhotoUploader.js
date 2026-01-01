import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } 
  from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

const storage = getStorage();

export default class PhotoUploader {
  constructor(containerId, initialImage = "", folder = "uploads") {
    this.containerId = containerId;
    this.initialImage = initialImage;
    this.folder = folder; // e.g., "locations" or "classes"
    this.previewEl = null;
    this.fileInput = null;
    this.removeBtn = null;
    this.currentFile = null; // File object waiting for upload
    this.deleted = false;
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="flex items-center gap-4">
        <img id="${this.containerId}-preview" 
             src="${this.initialImage || "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg"}" 
             class="w-20 h-20 rounded border object-cover" />
        <input type="file" id="${this.containerId}-file" accept="image/*" class="border px-2 py-1 rounded" />
        <button id="${this.containerId}-remove" class="text-red-600 text-sm">✖</button>
      </div>
    `;

    this.previewEl = document.getElementById(`${this.containerId}-preview`);
    this.fileInput = document.getElementById(`${this.containerId}-file`);
    this.removeBtn = document.getElementById(`${this.containerId}-remove`);

    // Upload preview
    this.fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      this.currentFile = file;
      this.deleted = false;

      const reader = new FileReader();
      reader.onload = () => {
        this.previewEl.src = reader.result;
        this.previewEl.dataset.imgData = reader.result;
      };
      reader.readAsDataURL(file);
    });

    // Reset / remove
    this.removeBtn.addEventListener("click", () => {
      this.previewEl.src = "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg";
      this.previewEl.dataset.imgData = "";
      this.fileInput.value = "";
      this.currentFile = null;
      this.deleted = true;
    });
  }

  /**
   * Uploads file to Firebase Storage and returns download URL.
   * If deleted, clears the URL.
   */
  async saveImage(docId) {
    if (this.deleted) {
      // If image deleted → also remove from storage
      try {
        const fileRef = ref(storage, `${this.folder}/${docId}/photo.jpg`);
        await deleteObject(fileRef);
      } catch (err) {
        console.warn("No file to delete or error:", err.message);
      }
      return "";
    }

    if (this.currentFile) {
      const fileRef = ref(storage, `${this.folder}/${docId}/photo.jpg`);
      await uploadBytes(fileRef, this.currentFile);
      return await getDownloadURL(fileRef);
    }

    // No new upload → return existing image
    return this.initialImage || "";
  }
}
