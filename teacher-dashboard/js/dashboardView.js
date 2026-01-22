import { db, auth } from "../../Shared/firebase-init.js";
import { collection, query, where, onSnapshot, getDocs } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { requireTeacherAuth } from "./auth-guard.js";
import { createStudentCard } from "./components/studentCard.js";
import { openStudentModal } from "./components/studentDetailModal.js";

// DOM Elements
const grid = document.getElementById('student-grid');
const sidebarList = document.getElementById('sidebar-student-list');
const leaderboardList = document.getElementById('leaderboard-list');
const activityFeed = document.getElementById('activity-feed');
const graphContainer = document.getElementById('graph-container');
const moduleSelect = document.getElementById('module-select');
const logoutBtn = document.getElementById('logout-btn');

// Counts
const elActive = document.getElementById('count-active');
const elIdle = document.getElementById('count-idle');
const elOffline = document.getElementById('count-offline');

// Filter Toggles
// Current active filter: 'all' or 'active' / 'idle' / 'offline'
let currentFilter = 'all';

window.toggleFilter = function (status) {
    if (currentFilter === status) {
        currentFilter = 'all'; // Toggle off
    } else {
        currentFilter = status; // Toggle on
    }
    updateFilterUI();
    refreshDashboard();
}

function updateFilterUI() {
    ['active', 'idle', 'offline'].forEach(status => {
        const btn = document.getElementById(`filter-${status}`);
        if (!btn) return;

        if (currentFilter === 'all') {
            // All on
            btn.classList.remove('opacity-40', 'grayscale', 'ring-2', 'ring-white');
        } else if (currentFilter === status) {
            // Selected
            btn.classList.remove('opacity-40', 'grayscale');
            btn.classList.add('ring-2', 'ring-white', 'shadow-lg');
        } else {
            // Others dimmed
            btn.classList.add('opacity-40', 'grayscale');
            btn.classList.remove('ring-2', 'ring-white', 'shadow-lg');
        }
    });
}

// Settings Modal Logic
const settingsModal = document.getElementById('settings-modal');
const settingsBtn = document.getElementById('settings-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');

if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
        setTimeout(() => settingsModal.classList.remove('opacity-0'), 10);
    });
}
if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('opacity-0');
        setTimeout(() => settingsModal.classList.add('hidden'), 300);
    });
}


// State
let usersMap = new Map();
let currentClassId = 'class_7a';
let currentModuleId = 'photosynthesis';
let allStudents = [];

// Mock Data
const MOCK_NAMES = ["Ella Rezzle", "Andy", "Lisa", "Sam", "Jacob", "Noah", "Olivia", "Ben", "Mia", "Chloe", "Ryan", "Kevin", "Diana", "Bruce", "Clark"];
const DEMO_STUDENTS = MOCK_NAMES.map((name, i) => ({
    id: `student_${i}`,
    name,
    progress: Math.floor(Math.random() * 90) + 10,
    score: Math.floor(Math.random() * 40) + 60,
    lastActive: new Date(Date.now() - Math.random() * 600000).toISOString(), // Most active
    lastStep: ['Chloroplasts', 'DNA Puzzle', 'Cell Respiration', 'Intro'].sort(() => 0.5 - Math.random())[0],
    photoUrl: i < 8 ? `https://i.pravatar.cc/150?u=${i + 10}` : null
}));
// Fix demo data to ensure we have some "Offline"
DEMO_STUDENTS.push({ id: "st_off1", name: "Severus", progress: 20, score: 50, lastActive: new Date(Date.now() - 3600000).toISOString(), lastStep: "Intro", photoUrl: null });
DEMO_STUDENTS.push({ id: "st_off2", name: "Minerva", progress: 99, score: 98, lastActive: new Date(Date.now() - 7200000).toISOString(), lastStep: "Final", photoUrl: null });


async function init() {
    const user = await requireTeacherAuth();
    if (!user && !isDemoMode()) return;

    setupLogout();
    setupModuleSelector();

    if (isDemoMode()) {
        allStudents = DEMO_STUDENTS;
        refreshDashboard();
        startMockFeed();
        renderSmoothGraph();
    } else {
        await loadUsers();
        startStream();
        renderSmoothGraph();
        startMockFeed();
    }
}

function isDemoMode() {
    return new URLSearchParams(window.location.search).get('demo') === 'true';
}

async function loadUsers() {
    try {
        const snap = await getDocs(collection(db, "users"));
        snap.forEach(doc => usersMap.set(doc.id, { photoUrl: doc.data().photoUrl }));
    } catch (e) { console.error(e); }
}

function startStream() {
    const q = query(collection(db, "stepResults"), where("classId", "==", currentClassId), where("moduleId", "==", currentModuleId));
    onSnapshot(q, (snapshot) => {
        const studentsMap = new Map();
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!studentsMap.has(data.studentId)) {
                const user = usersMap.get(data.studentId) || {};
                studentsMap.set(data.studentId, {
                    id: data.studentId,
                    name: data.studentName || 'Unknown',
                    progress: data.progress || 0,
                    score: data.score || 0,
                    lastActive: data.timestamp ? data.timestamp.toDate() : new Date(),
                    lastStep: data.stepName || 'Unknown',
                    photoUrl: user.photoUrl
                });
            } else {
                const s = studentsMap.get(data.studentId);
                s.score = Math.max(s.score, data.score || 0);
                s.progress = Math.max(s.progress, data.progress || 0);
            }
        });
        allStudents = Array.from(studentsMap.values());
        refreshDashboard();
    });
}

function refreshDashboard() {
    grid.innerHTML = '';
    sidebarList.innerHTML = '';

    // Sort
    allStudents.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));

    let countA = 0, countI = 0, countO = 0;
    const now = new Date();

    allStudents.forEach(s => {
        const diff = (now - new Date(s.lastActive)) / 1000;
        let type = 'offline';
        let ring = "border-gray-600";
        if (diff < 60) { type = 'active'; countA++; ring = "border-game-neonGreen"; }
        else if (diff < 300) { type = 'idle'; countI++; ring = "border-game-neonYellow"; }
        else { countO++; }

        // Render Sidebar Item (Always unless specific filter?) 
        // Logic: Show all in sidebar, but dim them? Or match grid? 
        // User asked: "The list on the left panel shows all the students correctly... We also should see Offline. Each of these buttons should when clicked only show the students in that category."
        // So we filter BOTH grid and sidebar.

        let isVisible = (currentFilter === 'all') || (currentFilter === type);

        if (isVisible) {
            // Render Card
            grid.appendChild(createStudentCard(s, openStudentModal));

            // Render Sidebar Item
            const item = document.createElement('div');
            item.className = "flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition opacity-80 hover:opacity-100";
            if (type === 'offline') item.className += " grayscale opacity-50";

            let avatar = s.photoUrl ? `<img src="${s.photoUrl}" class="w-8 h-8 rounded-full border-2 ${ring} object-cover">` : `<div class="w-8 h-8 rounded-full bg-indigo-600 border-2 ${ring} flex items-center justify-center text-xs font-bold">${s.name[0]}</div>`;

            item.innerHTML = `${avatar} <span class="font-bold text-xs truncate w-24 text-gray-300">${s.name}</span>`;
            item.onclick = () => openStudentModal(s);
            sidebarList.appendChild(item);
        }
    });

    if (elActive) elActive.textContent = countA;
    if (elIdle) elIdle.textContent = countI;
    if (elOffline) elOffline.textContent = countO;

    renderLeaderboard(allStudents);
}

function renderLeaderboard(students) {
    if (!leaderboardList) return;
    leaderboardList.innerHTML = '';
    const sorted = [...students].sort((a, b) => b.score - a.score).slice(0, 3);

    sorted.forEach((s, idx) => {
        let badge = ['🥇', '🥈', '🥉'][idx];
        const row = document.createElement('div');
        row.className = "flex items-center justify-between p-2 bg-black/20 rounded-lg border border-white/5 hover:bg-white/10 transition cursor-pointer";
        row.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-xl animate-bounce-slow">${badge}</span>
                <span class="font-bold text-sm truncate w-24 text-gray-200">${s.name}</span>
            </div>
            <span class="font-mono text-game-neonYellow font-bold text-sm">${s.score}pts</span>
        `;
        row.onclick = () => openStudentModal(s);
        leaderboardList.appendChild(row);
    });
}

function startMockFeed() {
    const actions = [
        { text: "used hint", icon: "💡", color: "bg-game-neonYellow/20 text-game-neonYellow border-game-neonYellow/30" },
        { text: "passed quiz", icon: "✅", color: "bg-game-neonGreen/20 text-game-neonGreen border-game-neonGreen/30" },
        { text: "skipped", icon: "⏩", color: "bg-gray-700/50 text-gray-300 border-gray-600" },
        { text: "timed out", icon: "⏱️", color: "bg-game-neonPink/20 text-game-neonPink border-game-neonPink/30" }
    ];

    setInterval(() => {
        const student = allStudents[Math.floor(Math.random() * allStudents.length)];
        if (!student) return;
        const action = actions[Math.floor(Math.random() * actions.length)];
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const item = document.createElement('div');
        item.className = `flex items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-full border shrink-0 opacity-0 animate-[float_0.5s_ease-out_forwards] ${action.color}`;
        item.innerHTML = `
            <span class="font-bold text-white text-xs hover:underline cursor-pointer" onclick="alert('${time}')">${student.name}</span>
            <span class="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">${action.icon} ${action.text}</span>
            <span class="text-[9px] opacity-60 ml-1">${time}</span>
        `;

        activityFeed.insertBefore(item, activityFeed.firstChild);
        if (activityFeed.children.length > 20) activityFeed.removeChild(activityFeed.lastChild);

        requestAnimationFrame(() => item.classList.remove('opacity-0'));
    }, 2800);
}

function renderSmoothGraph() {
    // Smoother Bezier Curve SVG
    // Use viewBox="0 0 100 50" to match the Aspect Ratio better

    const pointsA = [10, 30, 25, 45, 30, 60, 50, 20];
    const pointsB = [20, 25, 30, 20, 40, 50, 60, 40];

    const makePath = (points, color) => {
        // Map points to 0-100 x, 0-50 y
        let d = `M 0,${50 - points[0]}`;
        for (let i = 1; i < points.length; i++) {
            const x = i * (100 / (points.length - 1));
            const y = 50 - points[i]; // fit in 50 height
            const prevX = (i - 1) * (100 / (points.length - 1));
            const prevY = 50 - points[i - 1];
            const cp1x = prevX + (x - prevX) / 2;
            const cp1y = prevY;
            const cp2x = prevX + (x - prevX) / 2;
            const cp2y = y;
            d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x},${y}`;
        }
        return `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.5" vector-effect="non-scaling-stroke" class="drop-shadow-[0_0_5px_${color}]" />`;
    }

    const makeDots = (points, color) => {
        return points.map((p, i) => {
            const x = i * (100 / (points.length - 1));
            const y = 50 - p;
            return `<circle cx="${x}" cy="${y}" r="1.5" fill="white" stroke="${color}" stroke-width="0.5" class="hover:r-3 transition-all cursor-pointer"><title>Value: ${p}</title></circle>`;
        }).join('');
    }

    const svg = `
        <svg viewBox="0 0 100 50" class="w-full h-full" preserveAspectRatio="none">
            <!-- Grid -->
            <line x1="0" y1="12.5" x2="100" y2="12.5" stroke="#ffffff10" stroke-width="0.2" stroke-dasharray="2,2"/>
            <line x1="0" y1="25" x2="100" y2="25" stroke="#ffffff10" stroke-width="0.2" stroke-dasharray="2,2"/>
            <line x1="0" y1="37.5" x2="100" y2="37.5" stroke="#ffffff10" stroke-width="0.2" stroke-dasharray="2,2"/>

            ${makePath(pointsA, '#00F0FF')}
            ${makePath(pointsB, '#BC13FE')}
            
            <g>${makeDots(pointsA, '#00F0FF')}</g>
            <g>${makeDots(pointsB, '#BC13FE')}</g>
        </svg>
    `;

    graphContainer.innerHTML = svg;
}

function setupLogout() {
    logoutBtn.addEventListener('click', () => auth.signOut().then(() => window.location.href = "../StudentPanel/login.html"));
}

function setupModuleSelector() {
    if (moduleSelect) {
        moduleSelect.addEventListener('change', (e) => {
            if (e.target.value === 'demo') window.location.search = '?demo=true';
        });
    }
}

init();
