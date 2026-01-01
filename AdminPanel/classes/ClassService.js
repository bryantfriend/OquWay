// ClassService.js
import { db } from "../firebase-init.js";
import {
  collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { DEFAULT_PHOTO } from "../ui/constants.js";

export default class ClassService {
  static normalize(data, id) {
    
    // Helper for days (M, T, W, Th, F, S, Su)
    const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const formattedDays = (data.days || [])
        .sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
        .map(day => {
            if (day === "Mon") return "M";
            if (day === "Tue") return "T";
            if (day === "Wed") return "W";
            if (day === "Thu") return "Th"; 
            if (day === "Fri") return "F";
            if (day === "Sat") return "S";
            if (day === "Sun") return "Su";
            return day;
        })
        .join('');
        

    // Helper for times (e.g., 09:00 - 10:00, or multiple ranges)
    let timeRange = '';
    const dayTimes = data.dayTimes || {};
    // Find the earliest start time and the latest end time across all days for a concise range
    if (formattedDays) {
        let earliestStart = '23:59';
        let latestEnd = '00:00';

        Object.values(dayTimes).forEach(range => {
            const [start, end] = range.split('-');
            if (start < earliestStart) earliestStart = start;
            if (end > latestEnd) latestEnd = end;
        });
        timeRange = `${earliestStart} - ${latestEnd}`;
    }

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
      students: data.students || [],
      isArchived: data.isArchived || false,
      photoUrl: data.photoUrl || DEFAULT_PHOTO,
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
      locationId: data.locationId || null, // Ensure locationId is included
      isVisible: data.isVisible ?? true,   // New toggle, default to TRUE
      days: data.days || [],
      dayTimes: data.dayTimes || {},
      formattedDays: formattedDays,
      formattedTimes: timeRange || '—',
      courses: data.courses || []
    };
  }

  static async getAll() {
    // ... (rest of the file is unchanged)
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