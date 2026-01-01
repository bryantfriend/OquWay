import { db } from "../firebase-init.js";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

class CourseService {
  // ==========================
  // COURSES
  // ==========================

  async getAllCourses() {
    try {
      const snap = await getDocs(collection(db, "courses"));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error("Error fetching courses:", error);
      throw error;
    }
  }

  async getCourse(courseId) {
    try {
      const snap = await getDoc(doc(db, "courses", courseId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() };
    } catch (error) {
      console.error(`Error fetching course ${courseId}:`, error);
      throw error;
    }
  }

  async createCourse(data) {
    try {
      const newCourseRef = doc(collection(db, "courses"));
      await setDoc(newCourseRef, data);
      return { id: newCourseRef.id, ...data };
    } catch (error) {
      console.error("Error creating course:", error);
      throw error;
    }
  }

  async updateCourse(courseId, data) {
    try {
      const ref = doc(db, "courses", courseId);
      await updateDoc(ref, data);
    } catch (error) {
      console.error(`Error updating course ${courseId}:`, error);
      throw error;
    }
  }

  // ==========================
  // MODULES
  // ==========================

  async getModules(courseId) {
    try {
      const modulesRef = collection(db, "courses", courseId, "modules");
      const q = query(modulesRef, orderBy("order", "asc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error(`Error fetching modules for course ${courseId}:`, error);
      throw error;
    }
  }

  async getModule(courseId, moduleId) {
    try {
      const snap = await getDoc(doc(db, "courses", courseId, "modules", moduleId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() };
    } catch (error) {
      console.error(`Error fetching module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new module.
   * @param {string} courseId 
   * @param {object} data 
   * @param {string|null} specificId Optional specific ID (e.g. for imports)
   */
  async createModule(courseId, data, specificId = null) {
    try {
      let ref;
      if (specificId) {
        ref = doc(db, "courses", courseId, "modules", specificId);
      } else {
        ref = doc(collection(db, "courses", courseId, "modules"));
      }
      await setDoc(ref, data);
      return { id: ref.id, ...data };
    } catch (error) {
      console.error("Error creating module:", error);
      throw error;
    }
  }

  /**
   * Update an existing module (merge by default).
   */
  async updateModule(courseId, moduleId, data) {
    try {
      const ref = doc(db, "courses", courseId, "modules", moduleId);
      await setDoc(ref, data, { merge: true });
    } catch (error) {
      console.error(`Error updating module ${moduleId}:`, error);
      throw error;
    }
  }

  async deleteModule(courseId, moduleId) {
    try {
      await deleteDoc(doc(db, "courses", courseId, "modules", moduleId));
    } catch (error) {
      console.error(`Error deleting module ${moduleId}:`, error);
      throw error;
    }
  }

  async reorderModules(courseId, orderedModuleIds) {
    try {
      const batch = writeBatch(db);
      orderedModuleIds.forEach((modId, index) => {
        const ref = doc(db, "courses", courseId, "modules", modId);
        batch.update(ref, { order: index });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error reordering modules:", error);
      throw error;
    }
  }
}

export const courseService = new CourseService();
