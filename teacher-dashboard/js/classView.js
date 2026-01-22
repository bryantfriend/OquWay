import { db, auth } from "../../Shared/firebase-init.js";
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { requireTeacherAuth } from "./auth-guard.js";
import { createStudentCard } from "./components/studentCard.js";
import { openStudentModal } from "./components/studentDetailModal.js";

// State
let currentClassId = new URLSearchParams(window.location.search).get('classId') || 'class_7a';
let currentModuleId = 'photosynthesis';
let usersMap = new Map();
let allStudents = [];
let currentFilter = 'all';

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const viewPanes = document.querySelectorAll('.view-pane');
const liveFeedBar = document.getElementById('live-feed-bar');

// Live Dashboard Elements
const grid = document.getElementById('student-grid');
const sidebarList = document.getElementById('sidebar-student-list');
const leaderboardList = document.getElementById('leaderboard-list');
const activityFeed = document.getElementById('activity-feed');
const graphContainer = document.getElementById('graph-container');
const elActive = document.getElementById('count-active');
const elIdle = document.getElementById('count-idle');
const elOffline = document.getElementById('count-offline');

// Tabs Initialization
function initTabs() {
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            switchTab(targetTab);
        });
    });

    const initialTab = new URLSearchParams(window.location.search).get('tab') || 'live';
    switchTab(initialTab);
}

function switchTab(tabId) {
    tabButtons.forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active');
            btn.classList.remove('text-gray-400');
        } else {
            btn.classList.remove('active');
            btn.classList.add('text-gray-400');
        }
    });

    viewPanes.forEach(pane => {
        if (pane.id === `view-${tabId}`) {
            pane.classList.remove('hidden');
        } else {
            pane.classList.add('hidden');
        }
    });

    if (tabId === 'live') {
        liveFeedBar?.classList.remove('translate-y-20', 'opacity-0');
    } else {
        liveFeedBar?.classList.add('translate-y-20', 'opacity-0');
    }

    loadTabData(tabId);
}

async function loadTabData(tabId) {
    switch (tabId) {
        case 'live': break;
        case 'modules': await loadAssignedModules(); break;
        case 'students': await loadStudentRoster(); break;
        case 'progress': await loadProgressStats(); break;
    }
}

async function loadAssignedModules() {
    const list = document.getElementById('assigned-modules-list');
    if (!list) return;
    list.innerHTML = `
        <div class="glass-panel p-4 rounded-2xl border border-white/5 hover:border-game-neonBlue/50 transition cursor-pointer flex justify-between items-center group">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-game-neonBlue/10 flex items-center justify-center text-game-neonBlue text-xl">🧬</div>
                <div>
                    <h4 class="font-bold text-white">Photosynthesis Deep Dive</h4>
                    <p class="text-xs text-gray-400">Assigned Jan 15 • Due Jan 30</p>
                </div>
            </div>
            <div class="text-right">
                <div class="text-game-neonGreen font-bold">85% Complete</div>
                <div class="text-[10px] text-gray-500 uppercase font-black">Average Score: 78%</div>
            </div>
        </div>
    `;
}

async function loadStudentRoster() {
    const roster = document.getElementById('students-roster-container');
    if (!roster) return;
    roster.innerHTML = `
        <div class="glass-panel rounded-3xl p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold">Class Roster</h3>
                <button class="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-bold font-mono">EXPORT CSV</button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-xs text-gray-400 uppercase tracking-widest border-b border-white/5">
                            <th class="pb-3 pl-2">Student</th>
                            <th class="pb-3">Last Active</th>
                            <th class="pb-3 text-center">Avg Score</th>
                            <th class="pb-3 text-center">Modules</th>
                            <th class="pb-3 text-right pr-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                        ${allStudents.map(s => `
                            <tr class="group hover:bg-white/[0.02] transition">
                                <td class="py-4 pl-2">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold border border-white/20">${s.name[0]}</div>
                                        <span class="font-bold text-sm text-gray-200">${s.name}</span>
                                    </div>
                                </td>
                                <td class="py-4 text-xs text-gray-400">${new Date(s.lastActive).toLocaleDateString()}</td>
                                <td class="py-4 text-center">
                                    <span class="font-mono font-bold ${s.score > 80 ? 'text-game-neonGreen' : 'text-game-gold'}">${s.score}%</span>
                                </td>
                                <td class="py-4 text-center text-xs text-white">4 / 12</td>
                                <td class="py-4 text-right pr-2">
                                    <button class="text-xs font-bold text-game-neonBlue hover:underline">View Profile</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function loadProgressStats() {
    const container = document.getElementById('progress-stats-container');
    if (!container) return;
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="glass-panel p-6 rounded-3xl border border-white/5">
                <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Completion Rate</p>
                <h4 class="text-3xl font-black text-game-neonBlue">72%</h4>
            </div>
             <div class="glass-panel p-6 rounded-3xl border border-white/5">
                <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Avg Engagement</p>
                <h4 class="text-3xl font-black text-game-neonPurple">14m</h4>
            </div>
             <div class="glass-panel p-6 rounded-3xl border border-white/5">
                <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Struggling Students</p>
                <h4 class="text-3xl font-black text-game-neonPink">3</h4>
            </div>
             <div class="glass-panel p-6 rounded-3xl border border-white/5">
                <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Class Potential</p>
                <h4 class="text-3xl font-black text-game-gold">A-</h4>
            </div>
        </div>
        <div class="glass-panel p-6 rounded-3xl">
            <h3 class="text-xl font-bold mb-6">Module Mastery Heatmap</h3>
            <div class="h-64 bg-white/5 rounded-2xl flex items-center justify-center text-gray-600 font-bold italic">
                (Visual Analytics Loading...)
            </div>
        </div>
    `;
}

function startStream() {
    if (isDemoMode()) {
        allStudents = [
            { id: "st1", name: "Ella Rezzle", progress: 85, score: 92, lastActive: new Date().toISOString(), lastStep: "Photosynthesis", photoUrl: null },
            { id: "st2", name: "Andy", progress: 45, score: 78, lastActive: new Date(Date.now() - 120000).toISOString(), lastStep: "Cells", photoUrl: null }
        ];
        refreshDashboard();
        startMockFeed();
        renderSmoothGraph();
        return;
    }

    const q = query(collection(db, "stepResults"), where("classId", "==", currentClassId), where("moduleId", "==", currentModuleId));
    onSnapshot(q, (snapshot) => {
        const studentsMap = new Map();
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!studentsMap.has(data.studentId)) {
                studentsMap.set(data.studentId, {
                    id: data.studentId,
                    name: data.studentName || 'Unknown',
                    progress: data.progress || 0,
                    score: data.score || 0,
                    lastActive: data.timestamp ? data.timestamp.toDate() : new Date(),
                    lastStep: data.stepName || 'Unknown'
                });
            }
        });
        allStudents = Array.from(studentsMap.values());
        refreshDashboard();
    });
}

function refreshDashboard() {
    if (!grid) return;
    grid.innerHTML = '';
    allStudents.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));
    let countA = 0, countI = 0, countO = 0;
    const now = new Date();

    allStudents.forEach(s => {
        const diff = (now - new Date(s.lastActive)) / 1000;
        let type = 'offline';
        if (diff < 60) { type = 'active'; countA++; }
        else if (diff < 300) { type = 'idle'; countI++; }
        else { countO++; }

        grid.appendChild(createStudentCard(s, openStudentModal));
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
        const row = document.createElement('div');
        row.className = "flex items-center justify-between p-2 bg-black/20 rounded-lg border border-white/5";
        row.innerHTML = `<span class="font-bold text-sm text-gray-200">${s.name}</span><span class="text-game-neonYellow font-bold">${s.score}pts</span>`;
        leaderboardList.appendChild(row);
    });
}

function startMockFeed() {
    setInterval(() => {
        const student = allStudents[Math.floor(Math.random() * allStudents.length)];
        if (!student || !activityFeed) return;
        const item = document.createElement('div');
        item.className = "bg-white/5 px-3 py-1 rounded-full text-[10px] text-gray-300 border border-white/5";
        item.textContent = `${student.name} is engaging with ${student.lastStep}`;
        activityFeed.insertBefore(item, activityFeed.firstChild);
        if (activityFeed.children.length > 10) activityFeed.removeChild(activityFeed.lastChild);
    }, 3000);
}

function renderSmoothGraph() {
    if (graphContainer) graphContainer.innerHTML = '<div class="text-gray-500 text-xs italic">Graph analytics active</div>';
}

async function init() {
    const user = await requireTeacherAuth();
    if (!user && !isDemoMode()) return;

    try {
        const snap = await getDoc(doc(db, "classes", currentClassId));
        if (snap.exists()) {
            document.getElementById('class-title').textContent = snap.data().name;
        }
    } catch (e) { }

    initTabs();
    startStream();
}

function isDemoMode() { return new URLSearchParams(window.location.search).get('demo') === 'true'; }

init();
