// js/screens/loginScreen.js
import { db } from '../firebase-init.js';
import { collection, getDocs, query, where, limit } 
  from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { FRUIT_EMOJIS, studentData } from '../config.js';
import { navigateTo } from '../router.js';
import { getText } from '../i18n.js';
import { getFunctions, httpsCallable } 
  from "https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js";
import { signInWithCustomToken } 
  from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { auth } from "../firebase-init.js";
import { dumpAuthClaims } from "../firebase-init.js";

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

function setLoginLoading(isLoading) {
  const btn = document.getElementById("loginBtn");
  if (!btn) return;

  if (isLoading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `
      <span class="flex items-center justify-center gap-2">
        <span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
        <span>Logging in…</span>
      </span>
    `;
    btn.classList.add("opacity-80", "cursor-wait");
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || getText("loginBtnLabel");
    btn.classList.remove("opacity-80", "cursor-wait");
  }
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
  const raw =
    obj?.photoUrl ||
    obj?.photoDataUrl ||
    obj?.imageUrl ||
    '';

  if (!raw) return 'assets/school-default.jpg';

  // Firebase Storage URLs → use directly
  if (raw.includes('firebasestorage.googleapis.com')) {
    return raw;
  }

  // data URLs
  if (raw.startsWith('data:')) {
    return raw;
  }

  return thumbUrl(raw) || 'assets/school-default.jpg';
}


// --- auto-login from localStorage ---
const saved = localStorage.getItem("studentData");
if (saved) {
  try {
    const parsed = JSON.parse(saved);
    console.log("🔄 Restored saved session:", parsed);
    Object.assign(studentData, parsed);

    // 🧠 Normalize avatar on restore
    studentData.avatar =
      (studentData.avatar && studentData.avatar.trim()) || "";

    navigateTo("dashboard");
    
    if (studentData.avatar) {
      studentData.avatar += `?t=${Date.now()}`;
    }


  } catch (err) {
    console.warn("⚠️ Failed to restore saved session:", err);
    localStorage.removeItem("studentData");
  }
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

  const q = query(
  collection(db, 'locations'),
  where('isArchived', '==', false)
);

const snap = await getDocs(q);
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

async function fetchClassesForLocation(locationId) {
  const classesRef = collection(db, 'classes');
  
  // Fetch only the standardized classes (camelCase)
  const q1 = query(
    classesRef, 
    where('locationId', '==', locationId), 
    where("isVisible", "==", true)
  );
  
  // Fallback for snake_case data structure
  const q2 = query(
    classesRef, 
    where('location_id', '==', locationId), 
    where("isVisible", "==", true)
  );

  // Use Promise.all to fetch both structures simultaneously
  const [snap1, snap2] = await Promise.all([
    getDocs(q1),
    getDocs(q2)
  ]);
  
  let out = snap1.docs.map(d => ({ id: d.id, ...d.data() }));
  out = out.concat(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
  
  console.log(`✅ [fetchClassesForLocation] Found ${out.length} classes for locationId=${locationId}`);
  
  // Deduplicate and return
  const seen = new Set();
  return out.filter(c => !seen.has(c.id) && seen.add(c.id));
}

async function fetchStudentsForClass(classId) {
  try {
    const functions = getFunctions();
    const fn = httpsCallable(functions, "getStudentsForClass");

    const { data } = await fn({ classId });

    console.log("✅ [fetchStudentsForClass] via CF:", data.length);
    return data;
  } catch (err) {
    console.error("🔥 [fetchStudentsForClass] FAILED:", err);
    return [];
  }
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
  grid.innerHTML = "";

  if (!grid || !emojiInput || !loginBtn) {
    console.error("Fruit grid elements missing in DOM");
    return;
  }

  // ✅ Build fruit buttons
  FRUIT_EMOJIS.forEach(fruit => {
    const btn = document.createElement("button");
    btn.className = "fruit-button cursor-pointer text-2xl";
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

  // ✅ Add backspace button
  const clearBtn = document.createElement("button");
  clearBtn.className = "fruit-button cursor-pointer text-2xl";
  clearBtn.textContent = "🔙";
  clearBtn.addEventListener("click", () => {
    const current = [...emojiInput.value.matchAll(/[\u{1F300}-\u{1FAFF}]/gu)].map(m => m[0]);
    emojiInput.value = current.slice(0, -1).join("");
    loginBtn.disabled = true;
  });
  grid.appendChild(clearBtn);
}

// --- login ---
async function handleLogin() {
  const emojiInput = document.getElementById("emojiPasswordInput");
  const inputPwd = emojiInput.value.trim();
  const user = selectedStudent;

  const emojis = [...inputPwd.matchAll(/[\u{1F300}-\u{1FAFF}]/gu)].map(m => m[0]);
  if (!user?.id || emojis.length !== 4) {
    alert("Please enter 4 emoji password.");
    return;
  }

  setLoginLoading(true);

  try {
    const functions = getFunctions();
    const studentLogin = httpsCallable(functions, "studentLogin");

    const result = await studentLogin({
      studentId: user.id,
      fruitPassword: emojis,
    });

    const data = result.data;

    await signInWithCustomToken(auth, data.token);

    // ✅ Save student data (authoritative source first)
    studentData.studentId = user.id;
    studentData.name = user.name || "Student";
    studentData.avatar =
      (data.photoUrl && data.photoUrl.trim()) ||
      (user.photoUrl && user.photoUrl.trim()) ||
      "";
    studentData.points = { physical: 0, cognitive: 0, creative: 0, social: 0 };
    studentData.classId = user.classId || selectedClass || null;

    // 🔥 Bust stale student cache
    localStorage.removeItem('studentsCache:v1');

    // 🧠 Cache-bust avatar
    if (studentData.avatar) {
      studentData.avatar += `?t=${Date.now()}`;
    }

    localStorage.setItem("studentData", JSON.stringify(studentData));

    navigateTo("dashboard");

  } catch (err) {
    console.error("❌ Fruit login failed:", err);
    alert("Login failed: " + err.message);
    setLoginLoading(false);
  }
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

