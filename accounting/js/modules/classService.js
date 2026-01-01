// js/modules/classService.js
import { db } from "../firebase-init.js";
import {
  collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

export default class ClassService {
  static normalize(data, id) {
    return {
      id,
      name: data.name || "",
      loginDisplayName: data.loginDisplayName || "",
      subject: data.subject || "",
      gradeLevel: data.gradeLevel || "",
      language: data.language || "",
      teacherName: data.teacherName || "",
      teacherId: data.teacherId || "",
      schedule: data.schedule || {},          
      classCode: data.classCode || "",       
      isOnline: data.isOnline ?? false,       
      isGroup: data.isGroup ?? true,     
      isVisible: data.isVisible ?? true,
      students: data.students || [],
      isArchived: data.isArchived || false,
      photoUrl: data.photoUrl || DEFAULT_PHOTO,
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
      
      days: data.days || [],
      dayTimes: data.dayTimes || {},
    };
  }

  static async getAll() {
    const snap = await getDocs(collection(db, "classes"));
    return snap.docs.map(d => this.normalize(d.data(), d.id));
  }

  static async getOne(id) {
    const snap = await getDoc(doc(db, "classes", id));
    return snap.exists() ? this.normalize(snap.data(), snap.id) : null;
  }

  static async create(data) {
    return await addDoc(collection(db, "classes"), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  static async update(id, data) {
    return await updateDoc(doc(db, "classes", id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  static async remove(id) {
    return await deleteDoc(doc(db, "classes", id));
  }
}