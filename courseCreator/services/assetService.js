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
        // Size validation (Max 5MB)
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_SIZE) {
            throw new Error(`File is too large. Max size is 5MB. (Current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        }

        // Create a unique filename: timestamp_random_originalName
        const uniqueName = `${Date.now()}_${Math.floor(Math.random() * 1000)}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        // Support deep paths if folder contains slashes, otherwise default behavior
        const fullPath = folder.endsWith('/') ? `${folder}${uniqueName}` : `${folder}/${uniqueName}`;
        const storageRef = ref(storage, fullPath);

        // Upload
        const snapshot = await uploadBytes(storageRef, file);

        // Get URL
        return await getDownloadURL(snapshot.ref);
    },

    /**
     * List all assets in a folder (for browsing)
     * @param {string} folder - Folder path to list
     * @returns {Promise<Array>} - List of objects { name, url, fullPath }
     */
    async listAssets(folder = "uploads") {
        try {
            const { listAll } = await import("https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js");
            const listRef = ref(storage, folder);
            const res = await listAll(listRef);

            const files = await Promise.all(res.items.map(async (itemRef) => {
                const url = await getDownloadURL(itemRef);
                return {
                    name: itemRef.name,
                    fullPath: itemRef.fullPath,
                    url: url
                };
            }));

            return files;
        } catch (err) {
            console.error("Error listing assets:", err);
            return [];
        }
    },

    /**
     * Optional: Delete a file by URL (advanced, might need parsing)
     * @param {string} url 
     */
    async deleteFileByUrl(url) {
        // Basic implementation - requires parsing the ref from URL or storing the ref path
        // For now, we'll skip this to avoid accidental deletions of shared assets
        console.warn("deleteFileByUrl is not yet fully implemented for safety.");
    }
};
