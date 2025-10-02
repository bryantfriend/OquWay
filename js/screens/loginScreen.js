// js/screens/loginScreen.js

import { db } from '../firebase-init.js';
import {
  collection, getDocs, query, where, limit
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { FRUIT_EMOJIS, studentData } from '../config.js';
import { navigateTo } from '../router.js';
import { getText } from '../i18n.js';

// State
let locations = [];
let selectedLocation = null;
let selectedClass = null;
let selectedStudent = null;
let screenVersion = 0;

// --- utils ---
function toRenderableUrl(u = '') {
  if (!u) return '';
  return (u.includes('github.com') && u.includes('/blob/'))
    ? u.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/')
    : u;
}

async function ensureUserDocForAnon(student) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in anonymously yet");

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      createdAt: serverTimestamp(),
      role: "student",
      displayName: student.name,
      classId: student.classId || null,
      avatar: student.photoUrl || "",
      fruit: (student.fruitPassword || []).join?.('') || "",
    });
  } else {
    // Optional: update info each login
    await setDoc(ref, {
      lastLogin: serverTimestamp(),
      classId: student.classId || null,
      avatar: student.photoUrl || "",
    }, { merge: true });
  }

  return ref.id;
}


function isStale(v) { return v !== screenVersion; }

function thumbUrl(u = '', w = 160, h = 160) {
  const raw = toRenderableUrl(u);
  if (!raw) return '';
  if (raw.startsWith('data:') || raw.startsWith('blob:') || !/^https?:\/\//i.test(raw)) return raw;
  const noScheme = raw.replace(/^https?:\/\//, '');
  return `https://images.weserv.nl/?url=${encodeURIComponent(noScheme)}&w=${w}&h=${h}&fit=cover&we=1`;
}

function imgSrcFrom(obj) {
  const raw = obj?.photoUrl || obj?.photoDataUrl || obj?.imageUrl || '';
  return thumbUrl(raw) || 'assets/school-default.jpg';
}

// --- main render ---
export async function renderLoginScreen(container) {
  screenVersion++; 
  const v = screenVersion; 
  
  
  container.innerHTML = `
    <div class="p-4">
      <button id="backToLocationBtn" class="text-blue-500 mb-2 hidden" data-i18n="backBtn">
        ${getText("backBtn")}
      </button>

      <div id="locationSection">
        <h2 class="text-xl font-semibold" data-i18n="selectLocation">${getText("selectLocation")}</h2>
        <div id="locationButtons" class="grid grid-cols-2 gap-4 mt-4"></div>
      </div>

      <div id="classSection" class="hidden">
        <h2 class="text-xl font-semibold mb-2" data-i18n="selectClass">${getText("selectClass")}</h2>
        <div id="classButtons" class="grid grid-cols-4 gap-4 mb-6"></div>

        <h2 id="selectStudentHeading" class="text-xl font-semibold mb-2 hidden" data-i18n="selectYourPhoto">${getText("selectYourPhoto")}</h2>
        <div id="studentButtons" class="grid grid-cols-4 gap-4 mb-6"></div>

        <p id="selectedStudentName" class="text-center text-lg font-bold mb-2 hidden"></p>
        <input id="emojiPasswordInput"
        readonly
        class="text-2xl text-center border px-3 py-2 rounded mb-2 w-full"
        placeholder="🍎🍇🍊🍌">
        <div id="fruitGrid" class="grid grid-cols-3 gap-2 justify-center mb-2"></div>
        <button id="loginBtn" class="bg-green-600 text-white px-4 py-2 rounded w-full" data-i18n="loginBtnLabel" disabled>
          ${getText("loginBtnLabel")}
        </button>
      </div>
    </div>
  `;

  await loadLocationsOnly();
  if (v !== screenVersion) return; // screen changed; abort
  populateLocations();
  buildFruitGrid();

  document.getElementById("loginBtn").addEventListener("click", handleLogin);
  document.getElementById("backToLocationBtn").addEventListener("click", goBack);

  // Ensure dynamic bits react if user switches language while on this screen
  document.addEventListener("oquway:languageChanged", () => {
    // Update only the labels that are language-dependent but not covered by updateTextContent()
    // (placeholders/text are already wired via [data-i18n])
    // No-op here; updateTextContent() handles them globally.
  }, { once: true });
}

// --- caching helpers ---
const CLASS_CACHE_KEY   = 'classesCache:v1';
const STUDENT_CACHE_KEY = 'studentsCache:v1';
const CLASS_TTL   = 5 * 60 * 1000;
const STUDENT_TTL = 5 * 60 * 1000;

function readCache(storeKey, id, ttl) {
  try {
    const raw = localStorage.getItem(storeKey);
    if (!raw) return null;
    const entry = JSON.parse(raw)?.[id];
    if (!entry || (Date.now() - entry.time) > ttl) return null;
    return entry.data;
  } catch { return null; }
}

function writeCache(storeKey, id, data) {
  try {
    const raw = localStorage.getItem(storeKey);
    const all = raw ? JSON.parse(raw) : {};
    all[id] = { time: Date.now(), data };
    localStorage.setItem(storeKey, JSON.stringify(all));
  } catch {}
}

// --- data loads ---
async function loadLocationsOnly() {
  const CACHE_KEY = 'locCache:v1';
  const ONE_HOUR = 60 * 60 * 1000;

  try {
    const cachedStr = localStorage.getItem(CACHE_KEY);
    const cached = cachedStr ? JSON.parse(cachedStr) : null;
    if (cached && (Date.now() - cached.time) < ONE_HOUR) {
      locations = cached.data;
      return;
    }
  } catch {
    localStorage.removeItem(CACHE_KEY);
  }

  const snap = await getDocs(collection(db, 'locations'));
  locations = snap.docs.map(docSnap => {
    const raw = docSnap.data();
    const safe = JSON.parse(JSON.stringify(raw));
    return { id: docSnap.id, ...safe };
  });

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data: locations }));
  } catch {}
}

async function populateClasses(locationId) {
  const v = screenVersion;                // capture
  renderClassLoading();
  const cached = readCache(CLASS_CACHE_KEY, locationId, CLASS_TTL);
  if (cached) {
    if (isStale(v)) return;
    renderClassNamesFirst(cached);
    queueMicrotask(() => { if (!isStale(v)) hydrateClassIcons(); });
    requestIdleCallback?.(async () => {
      const fresh = await fetchClassesForLocation(locationId);
      if (isStale(v)) return;
      writeCache(CLASS_CACHE_KEY, locationId, fresh);
      if (selectedLocation === locationId) {
        renderClassNamesFirst(fresh);
        queueMicrotask(() => { if (!isStale(v)) hydrateClassIcons(); });
      }
    });
  } else {
    const data = await fetchClassesForLocation(locationId);
    if (isStale(v)) return;
    writeCache(CLASS_CACHE_KEY, locationId, data);
    renderClassNamesFirst(data);
    queueMicrotask(() => { if (!isStale(v)) hydrateClassIcons(); });
  }
}

async function refreshClasses(locationId) {
  const fresh = await fetchClassesForLocation(locationId);
  writeCache(CLASS_CACHE_KEY, locationId, fresh);
  if (selectedLocation === locationId) {
    renderClassNamesFirst(fresh);
    queueMicrotask(hydrateClassIcons);
  }
}

async function fetchClassesForLocation(locationId) {
  const classesRef = collection(db, 'classes');
  const byCamel = await getDocs(query(classesRef, where('locationId', '==', locationId), where('isArchived', '==', false)));
  let out = byCamel.docs.map(d => ({ id: d.id, ...d.data() }));
  const bySnake = await getDocs(query(classesRef, where('location_id', '==', locationId), where('isArchived', '==', false)));
  out = out.concat(bySnake.docs.map(d => ({ id: d.id, ...d.data() })));
  const seen = new Set();
  return out.filter(c => !seen.has(c.id) && seen.add(c.id));
}

async function fetchStudentsForClass(classId) {
  const studentsRef = collection(db, 'users');
  const snap = await getDocs(query(studentsRef, where('classId', '==', classId), limit(500)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.role === 'student');
}

// --- lazy image loader ---
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    if (el.dataset.src) el.src = el.dataset.src;
    io.unobserve(el);
  });
}, { rootMargin: '250px' });

// --- UI builders ---
function populateLocations() {
  const container = document.getElementById("locationButtons");
  container.innerHTML = '';

  locations.forEach(loc => {
    const card = document.createElement("div");
    card.className = 'bg-white rounded-lg shadow p-4 text-center cursor-pointer hover:scale-105 transition transform duration-200';
    const src = imgSrcFrom(loc);
    card.innerHTML = `
      <img data-src="${src}"
           src="assets/school-default.jpg"
           alt="${loc.name}"
           width="80" height="80"
           class="w-20 h-20 mx-auto mb-2 rounded-full object-cover"
           loading="lazy" decoding="async" referrerpolicy="no-referrer">
      <div class="text-sm font-semibold">${loc.name}</div>
    `;
    container.appendChild(card);
    io.observe(card.querySelector('img'));

    card.addEventListener("click", () => {
      selectedLocation = loc.id;
      document.getElementById("locationSection").classList.add("hidden");
      document.getElementById("classSection").classList.remove("hidden");
      document.getElementById("backToLocationBtn").classList.remove("hidden");
      populateClasses(loc.id);
    });
  });
}

// skeleton while fetching classes
function renderClassLoading(count = 8) {
  const container = document.getElementById("classButtons");
  if (!container) return; // guard
  const items = Array.from({ length: count }).map(() => `
    <div class="animate-pulse bg-gray-100 rounded-lg h-24 flex items-center justify-center">
      <div class="w-16 h-4 bg-gray-200 rounded"></div>
    </div>
  `).join('');
  container.innerHTML = `
    <div class="col-span-4 text-center text-gray-500 mb-2 w-full" data-i18n="loadingClasses">
      ${getText("loadingClasses")}
    </div>
    ${items}
  `;
}

// PHASE 1: render class names (no images yet)
function renderClassNamesFirst(classes) {
  const container = document.getElementById("classButtons");
  if (!container) return; // guard
  container.innerHTML = '';
  classes.forEach(cls => {
    const btn = document.createElement("button");
    btn.className = 'btn flex flex-col items-center justify-center p-2';
    btn.dataset.icon = imgSrcFrom(cls);
    btn.dataset.classId = cls.id || '';
    btn.innerHTML = `
      <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-2">
        <span class="text-lg font-semibold">${(cls.name || '?').slice(0,1)}</span>
      </div>
      <div class="text-sm font-semibold text-center">${cls.name || ''}</div>
    `;
    btn.addEventListener("click", () => onClassSelected(cls));
    container.appendChild(btn);
  });
}

// PHASE 2: inject class images lazily
function hydrateClassIcons() {
  const container = document.getElementById("classButtons");
  if (!container) return; // guard
  container.querySelectorAll('button[data-icon]').forEach(btn => {
    const icon = btn.dataset.icon;
    if (!icon || btn.querySelector('img')) return;
    const img = document.createElement('img');
    img.alt = btn.querySelector('.text-sm')?.textContent || 'Class';
    img.className = 'w-20 h-20 rounded-full object-cover mb-2';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.src = 'assets/school-default.jpg';
    img.dataset.src = icon;
    const ph = btn.querySelector('div.w-20.h-20');
    if (ph) ph.replaceWith(img);
    io.observe(img);
  });
}

function onClassSelected(cls) {
  selectedClass = cls.id;
  const heading = document.getElementById("selectStudentHeading");
  if (heading) heading.classList.remove("hidden");

  renderStudentLoading();
  const v = screenVersion;

  const cached = readCache(STUDENT_CACHE_KEY, cls.id, STUDENT_TTL);
  if (cached) {
    if (isStale(v)) return;
    renderStudentNamesFirst(cached);
    queueMicrotask(() => { if (!isStale(v)) hydrateStudentIcons(); });
    requestIdleCallback?.(async () => {
      const fresh = await fetchStudentsForClass(cls.id);
      if (isStale(v)) return;
      writeCache(STUDENT_CACHE_KEY, cls.id, fresh);
      if (selectedClass === cls.id) {
        renderStudentNamesFirst(fresh);
        queueMicrotask(() => { if (!isStale(v)) hydrateStudentIcons(); });
      }
    });
  } else {
    fetchStudentsForClass(cls.id).then(list => {
      if (isStale(v)) return;
      writeCache(STUDENT_CACHE_KEY, cls.id, list);
      renderStudentNamesFirst(list);
      queueMicrotask(() => { if (!isStale(v)) hydrateStudentIcons(); });
    });
  }
}

// skeleton while fetching students
function renderStudentLoading(count = 12) {
  const container = document.getElementById("studentButtons");
  if (!container) return; // guard
  const items = Array.from({ length: count }).map(() => `
    <div class="animate-pulse bg-gray-100 rounded-lg h-24 flex items-center justify-center">
      <div class="w-12 h-12 bg-gray-200 rounded-full"></div>
    </div>
  `).join('');
  container.innerHTML = `
    <div class="col-span-4 text-center text-gray-500 mb-2 w-full" data-i18n="loadingStudents">
      ${getText("loadingStudents")}
    </div>
    ${items}
  `;
}

// PHASE 1: render student names only
function renderStudentNamesFirst(students) {
  const container = document.getElementById("studentButtons");
  if (!container) return; // guard
  container.innerHTML = '';
  students.forEach(s => {
    const btn = document.createElement("button");
    btn.className = 'student-photo-item flex flex-col items-center p-2';
    btn.dataset.icon = imgSrcFrom(s);
    btn.dataset.studentId = s.id || '';
    btn.innerHTML = `
      <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-1">
        <span class="text-lg font-semibold">${(s.name || '?').slice(0,1)}</span>
      </div>
      <div class="text-xs font-medium text-center truncate w-24">${s.name || ''}</div>
    `;
    btn.addEventListener("click", () => onStudentSelected(s));
    container.appendChild(btn);
  });
}

// PHASE 2: swap placeholders with actual images
function hydrateStudentIcons() {
  const container = document.getElementById("studentButtons");
  if (!container) return; // guard
  container.querySelectorAll('button[data-icon]').forEach(btn => {
    const icon = btn.dataset.icon;
    if (!icon || btn.querySelector('img')) return;
    const img = document.createElement('img');
    img.alt = btn.querySelector('div.text-xs')?.textContent || 'Student';
    img.className = 'w-20 h-20 rounded-full object-cover mb-1';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.src = 'assets/school-default.jpg';
    img.dataset.src = icon;
    const ph = btn.querySelector('div.w-20.h-20');
    if (ph) ph.replaceWith(img);
    io.observe(img);
  });
}

async function refreshStudents(classId) {
  const fresh = await fetchStudentsForClass(classId);
  writeCache(STUDENT_CACHE_KEY, classId, fresh);
  if (selectedClass === classId) {
    renderStudentNamesFirst(fresh);
    queueMicrotask(hydrateStudentIcons);
  }
}

function onStudentSelected(s) {
  selectedStudent = s;
  const emojiInput = document.getElementById("emojiPasswordInput");
  const loginBtn = document.getElementById("loginBtn");
  emojiInput.value = '';
  loginBtn.disabled = true;

  const nameEl = document.getElementById("selectedStudentName");
  nameEl.textContent = s.name;
  nameEl.classList.remove("hidden");
}

// --- fruit keypad ---
function buildFruitGrid() {
  const grid = document.getElementById("fruitGrid");
  const emojiInput = document.getElementById("emojiPasswordInput");
  const loginBtn = document.getElementById("loginBtn");
  grid.innerHTML = '';

  FRUIT_EMOJIS.forEach(fruit => {
    const btn = document.createElement("button");
    btn.className = "fruit-button";
    btn.textContent = fruit;
    btn.addEventListener("click", () => {
      const current = [...emojiInput.value.matchAll(/[\u{1F300}-\u{1FAFF}]/gu)].map(m => m[0]);
      if (current.length < 4) {
        emojiInput.value += fruit;
        if (current.length + 1 === 4) loginBtn.disabled = false;
      }
    });
    grid.appendChild(btn);
  });

  const clearBtn = document.createElement("button");
  clearBtn.className = "fruit-button";
  clearBtn.textContent = "🔙";
  clearBtn.addEventListener("click", () => {
    const current = [...emojiInput.value.matchAll(/[\u{1F300}-\u{1FAFF}]/gu)].map(m => m[0]);
    emojiInput.value = current.slice(0, -1).join('');
    loginBtn.disabled = true;
  });
  grid.appendChild(clearBtn);
}

// --- login ---
async function handleLogin() {
  const emojiInput = document.getElementById("emojiPasswordInput");
  const inputPwd = emojiInput.value;
  const user = selectedStudent;
  const emojis = [...inputPwd.matchAll(/[\u{1F300}-\u{1FAFF}]/gu)].map(m => m[0]);
  if (!user?.id || emojis.length !== 4) return alert("Please enter 4 emoji password.");

  let stored = user.fruitPassword;
  if (typeof stored === 'string') {
    try { stored = JSON.parse(stored); } catch { stored = []; }
  }
  if ((stored || []).join('') !== emojis.join('')) return alert("Incorrect password.");

  // ✅ Save locally
  studentData.studentId = user.id;
  studentData.name      = user.name;
  studentData.avatar    = user.photoUrl || '';
  studentData.points    = { physical: 0, cognitive: 0, creative: 0, social: 0 };
  studentData.classId   = selectedClass;

  // ✅ Create or update their own Firestore doc (by anonymous UID)
  try {
    await ensureUserDocForAnon({
      name: user.name,
      classId: selectedClass,
      photoUrl: user.photoUrl,
      fruitPassword: stored,
    });
  } catch (err) {
    console.error("Failed to ensure user doc:", err);
  }

  navigateTo('dashboard');
}

// --- back nav ---
function goBack() {
  selectedLocation = selectedClass = selectedStudent = null;

  document.getElementById("locationSection")?.classList.remove("hidden");
  document.getElementById("classSection")?.classList.add("hidden");
  document.getElementById("backToLocationBtn")?.classList.add("hidden");

  const cb = document.getElementById("classButtons");
  if (cb) cb.innerHTML = '';
  const sb = document.getElementById("studentButtons");
  if (sb) sb.innerHTML = '';

  document.getElementById("selectStudentHeading")?.classList.add("hidden");
  const name = document.getElementById("selectedStudentName");
  if (name) { name.classList.add("hidden"); name.textContent = ''; }

  const emoji = document.getElementById("emojiPasswordInput");
  if (emoji) emoji.value = '';
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) loginBtn.disabled = true;
}

