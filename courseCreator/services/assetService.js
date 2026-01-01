import { storage } from "../firebase-init.js";
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

export const assetService = {
    /**
     * Uploads a file to Firebase Storage
     * @param {File} file
     * @param {string} folder - e.g. "course-assets"
     * @returns {Promise<string>} - The download URL
     */
    async uploadFile(file, folder = "uploads") {
        // Create a unique filename: timestamp_random_originalName
        const uniqueName = `${Date.now()}_${Math.floor(Math.random() * 1000)}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const storageRef = ref(storage, `${folder}/${uniqueName}`);

        // Upload
        const snapshot = await uploadBytes(storageRef, file);

        // Get URL
        return await getDownloadURL(snapshot.ref);
    },

    /**
     * Optional: Delete a file by URL (advanced, might need parsing)
     */
    async deleteFileByUrl(url) {
        // Basic implementation - requires parsing the ref from URL or storing the ref path
        // For now, we'll skip this to avoid accidental deletions of shared assets
        console.warn("deleteFileByUrl is not yet fully implemented for safety.");
    }
};
