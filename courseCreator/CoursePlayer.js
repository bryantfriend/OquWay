//
// ========== CoursePlayer.js ==========
//

import { courseService } from "./services/courseService.js";
import { renderStep } from "../Shared/steps/renderStep.js"; // NEW: Modular Renderer

// State
let courseId = null;
let currentLanguage = 'en';
let allModules = [];
let allSteps = [];
let currentIndex = 0;

// DOM
const courseTitle = document.getElementById('courseTitle');
const contentArea = document.getElementById('playerContent');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const currentStepNum = document.getElementById('currentStepNum');
const totalSteps = document.getElementById('totalSteps');
const langSelect = document.getElementById('langSelect');
const closeBtn = document.getElementById('closeBtn');

// Init
async function init() {
    // 1. Get Params
    const params = new URLSearchParams(window.location.search);
    courseId = params.get('courseId');

    if (!courseId) {
        contentArea.innerHTML = `<p class="text-red-500">No course ID provided.</p>`;
        return;
    }

    // 2. Load Course Data
    try {
        const course = await courseService.getCourse(courseId);
        courseTitle.textContent = course.title || 'Untitled Course';

        // Setup Languages
        if (course.languages && course.languages.length > 0) {
            langSelect.innerHTML = course.languages.map(l => `<option value="${l}">${l.toUpperCase()}</option>`).join('');
            currentLanguage = course.languages[0];
            // Store lang preference
            localStorage.setItem("language", currentLanguage);
        }

        // Listen for language change
        langSelect.addEventListener('change', (e) => {
            currentLanguage = e.target.value;
            localStorage.setItem("language", currentLanguage);
            loadStep(currentIndex); // Re-render current step
        });


        // 3. Load Modules & Flatten Content
        const modules = await courseService.getModules(courseId);
        allModules = modules;
        allSteps = [];

        modules.forEach(mod => {
            // Support NEW Structure: Tracks -> Steps
            if (mod.tracks && mod.tracks.length > 0) {
                mod.tracks.forEach(track => {
                    // 1. Direct Steps (New Standard)
                    if (track.steps && track.steps.length > 0) {
                        track.steps.forEach(step => {
                            allSteps.push({
                                ...step,
                                _context: { moduleTitle: mod.title, trackTitle: track.title }
                            });
                        });
                    }
                    // 2. Legacy Page Support (Migration Fallback)
                    else if (track.pages) {
                        track.pages.forEach(page => {
                            if (page.blocks) {
                                page.blocks.forEach(block => {
                                    allSteps.push({
                                        ...block,
                                        _context: { moduleTitle: mod.title, pageTitle: page.title }
                                    });
                                });
                            }
                        });
                    }
                });
            }
            // Support LEGACY Structure: Steps array
            else if (mod.steps && mod.steps.length > 0) {
                mod.steps.forEach(step => {
                    allSteps.push({ ...step, _context: { moduleTitle: mod.title } });
                });
            }
        });

        if (allSteps.length === 0) {
            contentArea.innerHTML = `<div class="text-center text-gray-500 mt-20">This course has no content yet.</div>`;
            return;
        }

        totalSteps.textContent = allSteps.length;

        // Load initial step
        const stepIndex = Number(params.get('step')) || 0;
        loadStep(stepIndex);

    } catch (err) {
        console.error(err);
        contentArea.innerHTML = `<p class="text-red-500">Error loading course data.</p>`;
    }
}

async function loadStep(index) {
    if (index < 0 || index >= allSteps.length) return;
    currentIndex = index;
    currentStepNum.textContent = currentIndex + 1;

    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set('step', currentIndex);
    window.history.replaceState({}, '', url);

    // Update Nav Buttons
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === allSteps.length - 1;

    // Render
    const stepData = allSteps[index];
    await renderStep(contentArea, stepData);
}

// Navigation Listeners
prevBtn.addEventListener('click', () => loadStep(currentIndex - 1));
nextBtn.addEventListener('click', () => loadStep(currentIndex + 1));
closeBtn.addEventListener('click', () => window.history.back());

init();

function updateNav() {
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === allSteps.length - 1;
}

// Events
prevBtn.onclick = () => {
    renderStep(currentIndex - 1);
};
nextBtn.onclick = () => {
    renderStep(currentIndex + 1);
};
langSelect.onchange = (e) => {
    currentLanguage = e.target.value;
    renderStep(currentIndex);
};
closeBtn.onclick = () => {
    window.close(); // Only works if opened by script
    // Fallback
    window.location.href = `CourseCreatorModules.html`; // Go back to editor
};

init();
