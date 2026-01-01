import { db } from "../../firebase-init.js";
import { collection, setDoc, doc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const classes = [
  // Morning
  { time: "07:00 - 08:00", days: "Mon Wed Fri", isOnline: true, isGroup: true, level: "A2" },
  { time: "09:00 - 10:00", days: "Everyday", isOnline: false, isGroup: true, level: "A1" },
  { time: "10:00 - 11:00", days: "Mon Wed Fri", isOnline: false, isGroup: true, level: "A1" },
  { time: "11:00 - 12:00", days: "Mon Wed Fri", isOnline: false, isGroup: true, level: "B1" },

  // Afternoon
  { time: "13:00 - 14:00", days: "Mon Wed Fri", isOnline: false, isGroup: true, level: "B2" },
  { time: "14:00 - 15:00", days: "Tue Thur Sat", isOnline: false, isGroup: true, level: "A2" },
  { time: "14:00 - 15:00", days: "Tue Thur Sat", isOnline: true, isGroup: true, level: "A2" },
  { time: "15:00 - 16:00", days: "Mon Wed Fri", isOnline: false, isGroup: true, level: "A1" },
  { time: "15:00 - 16:00", days: "Tue Thur Sat", isOnline: false, isGroup: true, level: "A2" },
  { time: "17:00 - 18:00", days: "Tue Thur Sat", isOnline: false, isGroup: true, level: "B2" },

  // Evening
  { time: "18:00 - 19:00", days: "Mon Wed Fri", isOnline: false, isGroup: true, level: "A1" },
  { time: "18:00 - 19:00", days: "Mon Wed Fri", isOnline: false, isGroup: false, level: "B1" },
  { time: "18:00 - 19:00", days: "Tue Thur Sat", isOnline: true, isGroup: true, level: "B1" },
  { time: "18:00 - 19:00", days: "Tue Thur Sat", isOnline: false, isGroup: true, level: "B2" },
  { time: "19:00 - 20:00", days: "Mon Wed Fri", isOnline: true, isGroup: true, level: "B2" },
  { time: "19:00 - 20:00", days: "Mon Wed Fri", isOnline: false, isGroup: true, level: "B2" },

  // Night
  { time: "20:00 - 21:00", days: "Mon Wed Fri", isOnline: false, isGroup: true, level: "B2" },
  { time: "20:00 - 21:00", days: "Tue Thur Sat", isOnline: true, isGroup: false, level: "A2" },
  { time: "21:00 - 22:00", days: "Mon Wed Fri", isOnline: true, isGroup: true, level: "B2" },
  { time: "21:00 - 22:00", days: "Mon Wed Fri", isOnline: false, isGroup: true, level: "B2" },
];

function generateClassCode(time, isOnline, isGroup, level) {
  const cleanTime = time.replace(/\s|:/g, "").replace("-", "");
  const mode = isOnline ? "on" : "off";
  const group = isGroup ? "grp" : "ind";
  const letter = level.charAt(0).toUpperCase();
  return `${cleanTime}-${mode}-${group}-${letter}`;
}

function generateClassName(time, isOnline, isGroup, level) {
  const hour = parseInt(time.split(":")[0]);
  let period = "Morning";
  if (hour >= 12 && hour < 17) period = "Afternoon";
  else if (hour >= 17 && hour < 20) period = "Evening";
  else if (hour >= 20) period = "Night";
  const mode = isOnline ? "Online" : "Offline";
  const type = isGroup ? "Group" : "Individual";
  return `${period} ${mode} ${type} ${level}`;
}

async function addInitialClasses() {
  for (const c of classes) {
    const data = {
      name: generateClassName(c.time, c.isOnline, c.isGroup, c.level),
      classCode: generateClassCode(c.time, c.isOnline, c.isGroup, c.level),
      isOnline: c.isOnline,
      isGroup: c.isGroup,
      scheduleDays: c.days,
      scheduleTime: c.time,
      teacherName: "",
      teacherId: "",
      students: [],
      photoUrl: "",
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const ref = doc(collection(db, "classes"), data.classCode);
    await setDoc(ref, data);
    console.log(`✅ Created: ${data.name} (${data.classCode})`);
  }
}

addInitialClasses();
