// courses/CourseService.js
// READ-ONLY service for Admin Panel
// Course creation & editing happens in the separate Course Creator app

import { db } from "../firebase-init.js";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  where,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

export default class CourseService {

  /**
   * Get all courses (read-only)
   *
   * filter:
   *  - "all" (default)
   *  - "active"
   *  - "archived"
   */
  static async getAll(filter = "all") {
    const coursesRef = collection(db, "courses");

    let q;

    if (filter === "active") {
      q = query(
        coursesRef,
        where("status", "==", "active"),
        orderBy("title")
      );
    } else if (filter === "archived") {
      q = query(
        coursesRef,
        where("status", "==", "archived"),
        orderBy("title")
      );
    } else {
      q = query(coursesRef, orderBy("title"));
    }

    const snap = await getDocs(q);

    return snap.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  }

  /**
   * Get a single course by ID (read-only)
   */
  static async getById(courseId) {
    if (!courseId) return null;

    const ref = doc(db, "courses", courseId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    return {
      id: snap.id,
      ...snap.data(),
    };
  }

  /**
   * Utility: display title
   * Your schema uses a plain string title
   */
  static getDisplayTitle(course) {
    return course?.title || "Untitled Course";
  }

  /**
   * Utility: normalize language list
   */
  static getLanguages(course) {
    return Array.isArray(course?.languages) && course.languages.length
      ? course.languages
      : ["en"];
  }

  /**
   * Utility: published / active state
   */
  static isPublished(course) {
    return course?.status === "active";
  }

  /**
   * Utility: archived state
   */
  static isArchived(course) {
    return course?.status === "archived";
  }
}
