import { db, auth } from "../../Shared/firebase-init.js";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// --- State ---
let currentClassId = new URLSearchParams(window.location.search).get('classId') || 'class_7a';
let assignedModuleId = 'photosynthesis'; // Primary session module
let assignedStepCount = 5; // Total steps in assigned module
let allStudents = [];
let sessionStartTime = Date.now();
let sessionDurationMinutes = 45;
let isSetupComplete = false;
let studentFilterIds = null; // null means show all

// --- DOM Elements ---
const elTimer = document.getElementById('session-timer');
const elRosterList = document.getElementById('student-roster-list');
const elStepGrid = document.getElementById('step-distribution-grid');
const elSignals = document.getElementById('intervention-signals');
const elDrillDown = document.getElementById('student-drill-down');
const elDrillDownContent = document.getElementById('drill-down-content');
const elBackdrop = document.getElementById('modal-backdrop');
const elRosterFilterBadge = document.getElementById('roster-filter-badge');
const elResetRosterBtn = document.getElementById('reset-roster-btn');

// Summary Stats
const elStatPresent = document.getElementById('stat-present');
const elStatAligned = document.getElementById('stat-aligned');
const elStatProgress = document.getElementById('stat-progress');
const elStatIntervention = document.getElementById('stat-intervention');

// --- Initialization ---
async function init() {
    setupSetupMode();
    setupTimer();
    startStream();
    setupEventListeners();
}

function setupSetupMode() {
    const elBanner = document.getElementById('setup-banner');
    const elMain = document.getElementById('analytics-overview');
    const elStatsHeader = document.getElementById('analytics-overview-header');

    if (!isSetupComplete) {
        elBanner.classList.add('setup-active');
        elMain.classList.add('setup-dim');
        elStatsHeader.classList.add('setup-dim');
    }

    document.getElementById('start-session-btn').onclick = () => {
        isSetupComplete = true;
        elBanner.classList.remove('setup-active');
        elMain.classList.remove('setup-dim');
        elStatsHeader.classList.remove('setup-dim');
        refreshUI();
    };
}

function setupTimer() {
    const updateTimer = () => {
        const elapsed = (Date.now() - sessionStartTime) / 1000;
        const remaining = Math.max(0, (sessionDurationMinutes * 60) - elapsed);
        const mins = Math.floor(remaining / 60);
        const secs = Math.floor(remaining % 60);
        elTimer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        if (remaining <= 300) { // 5 mins left
            document.getElementById('session-status-badge').className = "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-accent-amber/20 text-accent-amber border border-accent-amber/30";
            document.getElementById('session-status-badge').textContent = "Ending Soon";
        }
    };
    setInterval(updateTimer, 1000);
    updateTimer();
}

function setupEventListeners() {
    elBackdrop.onclick = closeDrillDown;
    elResetRosterBtn.onclick = resetRosterFilter;
    document.getElementById('end-session-btn').onclick = () => {
        if (confirm("End this live session? All student progress will be saved in the report.")) {
            window.location.href = 'splash.html';
        }
    };
}

// --- Data Streaming ---
function startStream() {
    if (new URLSearchParams(window.location.search).get('demo') === 'true') {
        mockLiveStream();
        return;
    }

    const q = query(collection(db, "stepResults"), where("classId", "==", currentClassId));
    onSnapshot(q, (snapshot) => {
        const studentData = new Map();
        snapshot.forEach(doc => {
            const data = doc.data();
            const sId = data.studentId;
            if (!studentData.has(sId)) {
                studentData.set(sId, {
                    id: sId,
                    name: data.studentName || 'Student',
                    currentModule: data.moduleId,
                    currentStep: data.stepIndex || 0,
                    stepName: data.stepName || 'Introduction',
                    retries: data.retries || 0,
                    hints: data.hintsUsed || 0,
                    timeOnTask: data.timeSpent || 0, // seconds
                    lastActive: data.timestamp ? data.timestamp.toDate() : new Date(),
                    attendance: 'present' // Default if they are streaming data
                });
            } else {
                // Keep the most recent data (if multiple modules, we might need more logic)
                const s = studentData.get(sId);
                if (data.timestamp && data.timestamp.toDate() > s.lastActive) {
                    s.currentModule = data.moduleId;
                    s.currentStep = data.stepIndex;
                    s.stepName = data.stepName;
                    s.lastActive = data.timestamp.toDate();
                }
                s.retries += (data.retries || 0);
                s.hints += (data.hintsUsed || 0);
                s.timeOnTask += (data.timeSpent || 0);
            }
        });
        allStudents = Array.from(studentData.values());
        refreshUI();
    });
}

// --- UI Refresh Logic ---
function refreshUI() {
    renderRoster();
    renderStepDistribution();
    renderSignals();
    updateSummaryStats();
}

function renderRoster() {
    elRosterList.innerHTML = '';

    // Filtering logic
    const studentsToRender = studentFilterIds
        ? allStudents.filter(s => studentFilterIds.includes(s.id))
        : allStudents;

    // Badge visibility
    if (studentFilterIds) {
        elRosterFilterBadge.classList.remove('hidden');
        elResetRosterBtn.classList.remove('hidden');
    } else {
        elRosterFilterBadge.classList.add('hidden');
        elResetRosterBtn.classList.add('hidden');
    }

    studentsToRender.sort((a, b) => a.name.localeCompare(b.name)).forEach(student => {
        const isAligned = student.currentModule === assignedModuleId;
        const isLate = (Date.now() - student.lastActive) > 300000; // 5 mins idle

        const item = document.createElement('div');
        item.className = "group flex items-center justify-between p-3 rounded hover:bg-white/5 cursor-pointer transition-colors border border-transparent";
        if (!isAligned) item.className += " border-accent-amber/20";
        if (studentFilterIds) item.className += " bg-accent-blue/5 border-accent-blue/20 shadow-sm";

        item.innerHTML = `
            <div class="flex-1 flex items-center gap-3 overflow-hidden" onclick="openDrillDown('${student.id}')">
                <div class="shrink-0 w-8 h-8 rounded-full bg-panel-800 flex items-center justify-center text-xs font-medium border border-white/10 ${student.attendance === 'absent' ? 'opacity-30' : ''}">
                    ${student.name.charAt(0)}
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                        <h4 class="text-xs font-semibold truncate ${student.attendance === 'absent' ? 'text-white/20' : 'text-white/80'}">${student.name}</h4>
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-mono scale-90 origin-left">${student.currentModule.substring(0, 4)}...</span>
                    </div>
                    <p class="text-[10px] text-white/40 truncate">${student.attendance === 'absent' ? 'Marked Absent' : student.stepName}</p>
                </div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
                <select class="bg-transparent text-[10px] border-none focus:ring-0 text-white/40 hover:text-white transition-colors p-0" 
                    onclick="event.stopPropagation()" 
                    onchange="updateAttendance('${student.id}', this.value)">
                    <option value="present" ${student.attendance === 'present' ? 'selected' : ''} class="bg-panel-900">Present</option>
                    <option value="late" ${student.attendance === 'late' ? 'selected' : ''} class="bg-panel-900">Late</option>
                    <option value="absent" ${student.attendance === 'absent' ? 'selected' : ''} class="bg-panel-900">Absent</option>
                </select>
                <span class="w-2 h-2 rounded-full ${student.attendance === 'absent' ? 'bg-panel-950 border border-white/10' : (isAligned ? 'bg-accent-emerald' : 'bg-accent-amber')}" 
                    title="${isAligned ? 'On Assigned Module' : 'Different Module'}"></span>
            </div>
        `;
        elRosterList.appendChild(item);
    });

    if (studentFilterIds && studentsToRender.length === 0) {
        elRosterList.innerHTML = `<div class="p-8 text-center text-white/20 text-xs italic">No students match this signal in current roster.</div>`;
    }
}

window.updateAttendance = async (studentId, status) => {
    const student = allStudents.find(s => s.id === studentId);
    if (student) {
        student.attendance = status;
        refreshUI();
        // Here we would typically sync to Firestore
        // await updateDoc(doc(db, "attendance", studentId), { status });
    }
}

window.resetRosterFilter = () => {
    studentFilterIds = null;
    refreshUI();
}

window.resolveSignal = (idListJson) => {
    studentFilterIds = JSON.parse(decodeURIComponent(idListJson));
    refreshUI();
    // Scroll roster to top
    elRosterList.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderStepDistribution() {
    elStepGrid.innerHTML = '';
    const distribution = Array(assignedStepCount).fill(0).map(() => []);

    allStudents.forEach(s => {
        if (s.currentModule === assignedModuleId && s.currentStep < assignedStepCount) {
            distribution[s.currentStep].push(s);
        }
    });

    distribution.forEach((students, index) => {
        const count = students.length;
        const percentage = allStudents.length ? (count / allStudents.length) * 100 : 0;

        const row = document.createElement('div');
        row.className = "bg-panel-900/40 p-4 rounded border border-white/5 flex items-center gap-6";
        row.innerHTML = `
            <div class="w-24 shrink-0">
                <p class="text-[10px] uppercase text-white/40 font-bold">Step ${index + 1}</p>
                <p class="text-sm font-medium">Concept ${index + 1}</p>
            </div>
            <div class="flex-1 bg-panel-800/40 h-8 rounded-full overflow-hidden relative">
                <div class="h-full bg-accent-blue/30 border-r border-accent-blue/50 transition-all duration-1000" style="width: ${percentage}%"></div>
                <div class="absolute inset-0 flex items-center px-4">
                    <span class="text-xs font-bold text-white/60">${count} Student${count !== 1 ? 's' : ''}</span>
                </div>
            </div>
            <div class="w-32 flex -space-x-2 overflow-hidden justify-end">
                ${students.slice(0, 5).map(s => `
                    <div class="w-7 h-7 rounded-full bg-panel-700 border-2 border-panel-900 flex items-center justify-center text-[10px] font-bold" title="${s.name}">
                        ${s.name.charAt(0)}
                    </div>
                `).join('')}
                ${count > 5 ? `<div class="w-7 h-7 rounded-full bg-panel-800 border-2 border-panel-900 flex items-center justify-center text-[8px] font-bold text-white/40">+${count - 5}</div>` : ''}
            </div>
        `;
        elStepGrid.appendChild(row);
    });
}

function renderSignals() {
    elSignals.innerHTML = '';
    const signals = { 1: [], 2: [], 3: [] };

    // Tier 1 Logic
    const stepsWithIssues = new Map(); // stepIdx -> [studentIds]
    allStudents.forEach(s => {
        if (s.retries > 3 || s.hints > 2) {
            if (!stepsWithIssues.has(s.currentStep)) stepsWithIssues.set(s.currentStep, []);
            stepsWithIssues.get(s.currentStep).push(s.id);
        }
    });

    stepsWithIssues.forEach((studentIds, stepIdx) => {
        signals[1].push({
            text: `Step ${stepIdx + 1} may benefit from a brief explanation. Several students are taking longer here.`,
            icon: 'ℹ️',
            title: 'Live Suggestion',
            studentIds: studentIds,
            origin: 'interaction anomalies'
        });
    });

    // Tier 2 Logic (Persistent patterns)
    const strugglingStudents = allStudents.filter(s => s.retries > 5);
    if (strugglingStudents.length > 2) {
        signals[2].push({
            text: `Persistent retry patterns detected across ${strugglingStudents.length} students. Consider a group check-in.`,
            icon: '🟠',
            title: 'Patterns Emerging',
            studentIds: strugglingStudents.map(s => s.id),
            origin: 'repeated retry loops'
        });
    }

    // Tier 3 Logic (Confirmed support needs - Retention)
    const retentionNeeds = allStudents.filter(s => s.isRetention && s.retries > 3);
    if (retentionNeeds.length > 0) {
        signals[3].push({
            text: `${retentionNeeds.length} student${retentionNeeds.length > 1 ? 's are' : ' is'} struggling with retention concepts. Targeted intervention recommended.`,
            icon: '🎯',
            title: 'Targeted Support',
            studentIds: retentionNeeds.map(s => s.id),
            origin: 'retention check failures'
        });
    }

    // Render grouped
    [3, 2, 1].forEach(tier => {
        if (signals[tier].length === 0) return;

        const groupHeader = document.createElement('div');
        groupHeader.className = "mb-4";
        const groupTitle = tier === 1 ? 'ℹ️ Live Suggestions' : (tier === 2 ? '🟠 Patterns Emerging' : '🎯 Targeted Support');
        groupHeader.innerHTML = `<h4 class="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-3">${groupTitle}</h4>`;

        signals[tier].forEach(sig => {
            const item = document.createElement('div');
            let colors = 'bg-accent-blue/5 border-white/5 text-white/80';
            if (tier === 2) colors = 'bg-accent-amber/5 border-accent-amber/10 text-accent-amber/90';
            if (tier === 3) colors = 'bg-white/5 border-white/10 text-white';

            const idListEncoded = encodeURIComponent(JSON.stringify(sig.studentIds));

            item.className = `p-4 rounded-xl border ${colors} flex flex-col gap-3 mb-2 transition-all`;
            item.innerHTML = `
                <div class="flex items-start gap-4 text-sm">
                    <span>${sig.text}</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-[9px] text-white/20 italic">Derived from ${sig.origin} across recent steps.</span>
                    <button onclick="resolveSignal('${idListEncoded}')" class="text-[10px] font-bold uppercase tracking-tighter text-accent-blue hover:underline">View student(s)</button>
                </div>
            `;
            groupHeader.appendChild(item);
        });
        elSignals.appendChild(groupHeader);
    });
}

function updateSummaryStats() {
    const present = allStudents.length; // Simplified
    const aligned = allStudents.filter(s => s.currentModule === assignedModuleId).length;
    const avgStep = allStudents.length ? (allStudents.reduce((acc, s) => acc + s.currentStep, 0) / allStudents.length).toFixed(1) : '0.0';
    const interventionCount = allStudents.filter(s => s.retries > 5).length;

    elStatPresent.textContent = `${present} / 32`;
    elStatAligned.textContent = aligned;
    elStatProgress.textContent = `Step ${avgStep}`;
    elStatIntervention.textContent = `${interventionCount} High`;
}

// --- Student Drill Down ---
window.openDrillDown = function (studentId) {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return;

    elDrillDownContent.innerHTML = `
        <header class="flex items-center justify-between mb-8">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded bg-panel-800 flex items-center justify-center text-xl font-bold border border-white/10">
                    ${student.name.charAt(0)}
                </div>
                <div>
                    <h2 class="text-xl font-semibold">${student.name}</h2>
                    <p class="text-sm text-white/40">Current Session Activity</p>
                </div>
            </div>
            <button onclick="closeDrillDown()" class="p-2 hover:bg-white/5 rounded">✕</button>
        </header>

        <div class="space-y-8">
            <section class="grid grid-cols-2 gap-4">
                <div class="bg-panel-800/20 p-4 rounded border border-white/5">
                    <p class="text-[10px] uppercase text-white/40 font-bold mb-1">Module</p>
                    <p class="text-sm font-medium truncate">${student.currentModule}</p>
                </div>
                <div class="bg-panel-800/20 p-4 rounded border border-white/5">
                    <p class="text-[10px] uppercase text-white/40 font-bold mb-1">Step</p>
                    <p class="text-sm font-medium truncate">${student.stepName}</p>
                </div>
            </section>

            <section class="space-y-4">
                <h3 class="text-xs font-bold uppercase tracking-widest text-white/40">Cognitive Load Indicators</h3>
                <div class="bg-panel-900/40 p-6 rounded border border-white/5 space-y-6">
                    <div class="flex justify-between items-center group/tip relative">
                        <span class="text-sm text-white/60 flex items-center gap-2">
                            Step Retries
                            <span class="text-[10px] opacity-40 hover:opacity-100 cursor-help" title="Multiple retries can indicate exploration, trial-and-error, or procedural uncertainty.">ℹ️</span>
                        </span>
                        <span class="font-mono ${student.retries > 3 ? 'text-accent-amber' : 'text-white'}">${student.retries}</span>
                    </div>
                    <div class="flex justify-between items-center group/tip relative">
                        <span class="text-sm text-white/60 flex items-center gap-2">
                            Hints Accessed
                            <span class="text-[10px] opacity-40 hover:opacity-100 cursor-help" title="Hints often represent a student seeking context or clarifying prerequisites.">ℹ️</span>
                        </span>
                        <span class="font-mono ${student.hints > 2 ? 'text-accent-amber' : 'text-white'}">${student.hints}</span>
                    </div>
                </div>
            </section>

            <section class="space-y-4">
                <h3 class="text-xs font-bold uppercase tracking-widest text-white/40">Drill Down Actions</h3>
                <div class="space-y-3">
                    <div class="p-4 bg-panel-900/40 rounded border border-white/5 space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-white/60">Module Alignment</span>
                            <select class="bg-panel-800 text-xs border-none rounded focus:ring-accent-blue" 
                                onchange="reassignModule('${student.id}', this.value)">
                                <option value="photosynthesis" ${student.currentModule === 'photosynthesis' ? 'selected' : ''}>Photosynthesis (Main)</option>
                                <option value="cell-division" ${student.currentModule === 'cell-division' ? 'selected' : ''}>Cell Division</option>
                                <option value="genetics" ${student.currentModule === 'genetics' ? 'selected' : ''}>Genetics</option>
                            </select>
                        </div>
                        <p class="text-[9px] text-white/30 italic">Adjust only if intentionally reassigning this student to a different path.</p>
                    </div>
                </div>
            </section>

            <section class="p-6 bg-panel-800/10 rounded-2xl border border-white/5">
                <header class="mb-4">
                    <h3 class="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                        Understanding State
                    </h3>
                    <p class="text-[9px] text-white/30 truncate">Based on session interaction patterns.</p>
                </header>
                <div class="flex gap-4">
                    <div class="flex-1 p-3 bg-panel-950/40 rounded border border-white/5 flex flex-col items-center gap-1">
                        <span class="text-xl">${student.retries > 3 ? '🧩' : '💡'}</span>
                        <span class="text-[10px] text-white/40 uppercase font-bold text-center">${student.retries > 3 ? 'Deep Processing' : 'Steady Flow'}</span>
                    </div>
                    <div class="flex-1 p-3 bg-panel-950/40 rounded border border-white/5 flex flex-col items-center gap-1">
                        <span class="text-xl">${student.hints > 2 ? '🔍' : '⚡'}</span>
                        <span class="text-[10px] text-white/40 uppercase font-bold text-center">${student.hints > 2 ? 'Seeking Context' : 'High Focus'}</span>
                    </div>
                </div>
            </section>

            <section class="p-6 bg-accent-blue/5 rounded border border-accent-blue/20">
                <h3 class="text-xs font-bold uppercase tracking-widest text-accent-blue mb-4">Support Proxy Signal</h3>
                <p class="text-sm leading-relaxed text-white/80">
                    ${student.retries > 3 ?
            `This student is engaging thoughtfully with ${student.stepName}. A subtle acknowledgment of their focus may be beneficial.` :
            `This student is demonstrating consistent progress on their current learning path.`}
                </p>
            </section>

            <footer class="pt-4 border-t border-white/5">
                <p class="text-[10px] text-white/20 italic text-center">
                    Note: Understanding states are session-specific and may change as learning progresses. No fixed labels are derived.
                </p>
            </footer>
        </div>
    `;

    elDrillDown.classList.remove('translate-x-full');
    elBackdrop.classList.remove('hidden');
    setTimeout(() => elBackdrop.classList.remove('opacity-0'), 10);
}

window.reassignModule = async (studentId, moduleId) => {
    const student = allStudents.find(s => s.id === studentId);
    if (student) {
        student.currentModule = moduleId;
        student.currentStep = 0; // Reset to intro of new module
        student.stepName = 'Introduction';
        refreshUI();
        // Sync to backend...
    }
}

window.closeDrillDown = function () {
    elDrillDown.classList.add('translate-x-full');
    elBackdrop.classList.add('opacity-0');
    setTimeout(() => elBackdrop.classList.add('hidden'), 300);
}

// --- Demo Mode ---
function mockLiveStream() {
    allStudents = [
        { id: '1', name: 'Ella Rezzle', currentModule: 'photosynthesis', currentStep: 2, stepName: 'Chloroplasts', retries: 4, hints: 1, timeOnTask: 120, lastActive: new Date(), attendance: 'present' },
        { id: '2', name: 'Andy Miller', currentModule: 'photosynthesis', currentStep: 3, stepName: 'Dark Reactions', retries: 1, hints: 0, timeOnTask: 450, lastActive: new Date(), attendance: 'present' },
        { id: '3', name: 'Lisa Vance', currentModule: 'cell-division', currentStep: 1, stepName: 'Introduction', retries: 0, hints: 0, timeOnTask: 60, lastActive: new Date(), attendance: 'present' },
        { id: '4', name: 'Sam Hunt', currentModule: 'photosynthesis', currentStep: 0, stepName: 'Photosynthesis Intro', retries: 6, hints: 4, timeOnTask: 300, lastActive: new Date(), attendance: 'present', isRetention: true }
    ];
    refreshUI();
}

init();
