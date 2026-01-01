// js/AdminPanel/locations/LocationService.js
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

import { db, storage } from "../firebase-init.js";

/**
 * Normalize a Firestore document into a JS object with id
 */
function normalizeDoc(docSnap) {
  return { id: docSnap.id, ...docSnap.data() };
}

export default class LocationService {
  static async getAll() {
    const snapshot = await getDocs(collection(db, "locations"));
    return snapshot.docs.map(normalizeDoc);
  }

  static async getById(id) {
    const snap = await getDoc(doc(db, "locations", id));
    if (!snap.exists()) return null;
    return normalizeDoc(snap);
  }

  static async create(data) {
    // Default fields if not provided
    const payload = {
      name: data.name || "Untitled",
      type: data.type || "",
      city: data.city || "",
      region: data.region || "",
      address: data.address || "",
      contact: data.contact || "",
      hours: data.hours || "",
      isArchived: !!data.isArchived,
      socialLinks: data.socialLinks || {},
      photoUrl: data.photoUrl || "" // photo handled separately
    };

    const docRef = await addDoc(collection(db, "locations"), payload);

    // If image was uploaded via base64 → upload to storage
    if (data.photoDataUrl) {
      const url = await this._uploadPhoto(docRef.id, data.photoDataUrl);
      await updateDoc(doc(db, "locations", docRef.id), { photoUrl: url });
      payload.photoUrl = url;
    }

    return { id: docRef.id, ...payload };
  }

  static async update(id, data) {
    const payload = {
      name: data.name || "",
      type: data.type || "",
      city: data.city || "",
      region: data.region || "",
      address: data.address || "",
      contact: data.contact || "",
      hours: data.hours || "",
      isArchived: !!data.isArchived,
      socialLinks: data.socialLinks || {}
    };

    // Handle photo update
    if (data.photoDataUrl) {
      const url = await this._uploadPhoto(id, data.photoDataUrl);
      payload.photoUrl = url;
    } else if (data.photoUrl) {
      payload.photoUrl = data.photoUrl; // already uploaded URL
    }

    await updateDoc(doc(db, "locations", id), payload);
    return { id, ...payload };
  }

  static async remove(id) {
    // Try to delete the photo from storage if exists
    try {
      const photoRef = ref(storage, `locations/${id}.jpg`);
      await deleteObject(photoRef);
    } catch (err) {
      console.warn("⚠️ No photo to delete or error deleting:", err.message);
    }

    await deleteDoc(doc(db, "locations", id));
  }

  // 🔹 Upload helper
  static async _uploadPhoto(id, dataUrl) {
    const photoRef = ref(storage, `locations/${id}.jpg`);
    await uploadString(photoRef, dataUrl, "data_url");
    return await getDownloadURL(photoRef);
  }
}
