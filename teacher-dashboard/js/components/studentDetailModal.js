/**
 * Handles the logic for the Student Detail Modal (Dark Mode).
 */

const modal = document.getElementById('student-modal');
const modalContent = document.getElementById('student-modal-content');
const closeBtn = document.getElementById('close-modal-btn');
const closeBtn2 = document.getElementById('close-modal-btn-2');

// Elements
const modalAvatar = document.getElementById('modal-avatar');
const modalName = document.getElementById('modal-name');
const modalStatus = document.getElementById('modal-status');
const modalCurrentStep = document.getElementById('modal-current-step');
const modalScore = document.getElementById('modal-score');
const modalProgressBar = document.getElementById('modal-progress-bar');
const modalHistoryList = document.getElementById('modal-history-list');

// Close Logic
function closeModal() {
    modal.classList.add('opacity-0');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

// Events
closeBtn.addEventListener('click', closeModal);
closeBtn2.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
    }
});

/**
 * Opens and populates the modal.
 * @param {Object} student 
 */
export function openStudentModal(student) {
    // Populate
    modalName.textContent = student.name;
    const timeStr = new Date(student.lastActive).toLocaleTimeString();
    modalStatus.textContent = `Last seen: ${timeStr}`;
    modalCurrentStep.textContent = student.lastStep;
    modalScore.textContent = `${student.score}%`;

    // Avatar
    if (student.photoUrl) {
        modalAvatar.src = student.photoUrl;
    } else {
        modalAvatar.src = 'assets/default-avatar.png'; // Fallback
    }

    // Progress
    modalProgressBar.style.width = '0%';
    setTimeout(() => {
        modalProgressBar.style.width = `${student.progress}%`;
    }, 100);

    // History
    renderMockHistory(student);

    // Show
    modal.classList.remove('hidden');
    void modal.offsetWidth;
    modal.classList.remove('opacity-0');
    modalContent.classList.remove('scale-95');
    modalContent.classList.add('scale-100');
}

function renderMockHistory(student) {
    modalHistoryList.innerHTML = '';

    const steps = [
        { name: 'Introduction', score: 100, status: 'Completed', time: '10:00 AM' },
        { name: 'Vocabulary Drill', score: 95, status: 'Completed', time: '10:15 AM' },
        { name: 'Concept Video', score: 100, status: 'Completed', time: '10:20 AM' },
        { name: student.lastStep, score: student.score, status: 'In Progress', time: 'Just now' }
    ];

    steps.reverse().forEach(step => {
        const item = document.createElement('li');
        item.className = "flex justify-between items-center p-4 bg-dark-700/50 rounded-lg hover:bg-dark-700 transition-colors border border-transparent hover:border-dark-600";
        item.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-2 h-2 rounded-full ${step.status === 'Completed' ? 'bg-brand-green' : 'bg-brand-blue'} shadow-[0_0_5px_currentColor]"></div>
                <div>
                    <div class="font-medium text-gray-200">${step.name}</div>
                    <div class="text-xs text-gray-500">${step.time}</div>
                </div>
            </div>
            <div class="font-mono font-bold text-sm ${step.score >= 80 ? 'text-brand-green' : 'text-gray-400'}">
                ${step.score}%
            </div>
        `;
        modalHistoryList.appendChild(item);
    });
}
