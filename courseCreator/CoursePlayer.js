import { courseService } from "./services/courseService.js";
import { stepClasses } from "./StepTypes.js";

// State
let courseId = null;
let currentLanguage = 'en';
let allModules = [];
let allSteps = [];
let currentIndex = 0;
let currentStepInstance = null;

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
    const params = new URLSearchParams(window.location.search);
    courseId = params.get('courseId');

    if (!courseId) {
        contentArea.innerHTML = `<p class="text-red-500">No course ID provided.</p>`;
        return;
    }

    // Load Data
    try {
        const course = await courseService.getCourse(courseId);
        courseTitle.textContent = course.title || 'Untitled Course';

        // Populate languages
        if (course.languages && course.languages.length > 0) {
            langSelect.innerHTML = course.languages.map(l => `<option value="${l}">${l.toUpperCase()}</option>`).join('');
            currentLanguage = course.languages[0];
        }

        // Load modules & flatten steps
        const modules = await courseService.getModules(courseId);
        allModules = modules;

        // Flatten: specific structure [ {stepData, moduleId, moduleTitle}, ... ]
        allSteps = [];
        modules.forEach(mod => {
            if (mod.steps && mod.steps.length > 0) {
                // Add a "Chapter Title" step if you want, or just the content
                // For simplicity, let's just add the content steps
                mod.steps.forEach(step => {
                    allSteps.push({ ...step, _moduleTitle: mod.title });
                });
            }
        });

        if (allSteps.length === 0) {
            contentArea.innerHTML = `<div class="text-center text-gray-500">This course has no content yet.</div>`;
            updateNav();
            return;
        }

        totalSteps.textContent = allSteps.length;
        const stepIndex = Number(params.get('step')) || 0;
        renderStep(stepIndex);


    } catch (err) {
        console.error(err);
        contentArea.innerHTML = `<p class="text-red-500">Error loading course data.</p>`;
    }
}

function renderStep(index) {
    if (index < 0 || index >= allSteps.length) return;
    currentIndex = index;
    currentStepNum.textContent = currentIndex + 1;

    const stepData = allSteps[index];
    const StepClass = stepClasses[stepData.type];

    if (!StepClass) {
        contentArea.innerHTML = `<div class="text-red-500">Unknown step type: ${stepData.type}</div>`;
        return;
    }

    // --- LIFECYCLE: Unmount previous step ---
    if (currentStepInstance && typeof currentStepInstance.unmount === 'function') {
        try { currentStepInstance.unmount(); } catch (e) { console.error("Unmount error:", e); }
    }

    // We instantiate the step class just like in the editor
    const stepInstance = new StepClass(stepData, [currentLanguage]);
    currentStepInstance = stepInstance; // Keep reference

    // Safety check if renderPlayer exists (it's new)
    let infoHtml = '';
    if (typeof stepInstance.renderPlayer === 'function') {
        infoHtml = stepInstance.renderPlayer(currentLanguage);
    } else {
        infoHtml = `
            <div class="p-4 bg-yellow-50 text-center">
                <h3 class="font-bold mb-2">Preview Not Available</h3>
                <p>The step type <code>${stepData.type}</code> does not support preview yet.</p>
            </div>
        `;
    }

    contentArea.innerHTML = `
        <div class="w-full slide-enter relative">
            <div class="text-xs text-gray-400 uppercase tracking-widest text-center mb-4">
                ${stepData._moduleTitle || 'Module'}
            </div>
            <div id="step-container">
                ${infoHtml}
            </div>
        </div>
    `;

    // --- LIFECYCLE: Mount new step ---
    if (typeof stepInstance.mount === 'function') {
        // Find the container we just rendered
        const container = contentArea.querySelector('.step-player-container') || contentArea.querySelector('#step-container');
        try {
            stepInstance.mount(container);
        } catch (e) {
            console.error("Mount error:", e);
            container.innerHTML += `<div class="text-red-500 p-2 border border-red-200 bg-red-50 mt-2">Error starting game: ${e.message}</div>`;
        }
    }

    updateNav();
}

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
