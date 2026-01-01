// js/AdminPanel/users/UserService.js
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { db } from "../firebase-init.js";

const USERS_COLLECTION = "users";

export default class UserService {
  /**
   * Get all users
   * @returns {Promise<Array>} list of user objects
   */
  static async getAll() {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  /**
   * Get a single user by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  static async getById(id) {
    const ref = doc(db, USERS_COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  }

  /**
   * Create a new user
   * @param {Object} data
   * @returns {Promise<string>} new document ID
   */
  static async create(data) {
    const ref = await addDoc(collection(db, USERS_COLLECTION), data);
    return ref.id;
  }

  /**
   * Update an existing user
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<void>}
   */
  static async update(id, data) {
    const ref = doc(db, USERS_COLLECTION, id);
    await updateDoc(ref, data);
  }

  /**
   * Delete a user
   * @param {string} id
   * @returns {Promise<void>}
   */
  static async remove(id) {
    const ref = doc(db, USERS_COLLECTION, id);
    await deleteDoc(ref);
  }
}
