// screens/dashboardScreen.js
import { renderDashboard, initStudentDashboard } from '../studentDashboard.js';

export function renderDashboardScreen(container) {
  container.innerHTML = `
    <div class="p-4 w-full max-w-md mx-auto">
      <h1 class="text-xl font-bold mb-4" data-i18n="dashboardTitle">Dashboard</h1>

      <div class="student-info flex items-center gap-4 mb-4">
        <img
          id="dashboard-avatar"
          src="assets/default-avatar.png"
          alt="Avatar"
          class="w-24 h-24 rounded-full border cursor-pointer"
        >
        <input type="file" id="avatarInput" accept="image/*" class="hidden" />
        <span id="student-name" class="text-lg font-semibold"></span>
      </div>

      <h2 class="text-lg font-medium mb-2" data-i18n="intentionPointsTitle">
        Intention Points
      </h2>

      <div class="intention-points grid grid-cols-2 gap-4 mb-6">
        <div>💪 <span data-i18n="physicalPoints">Physical</span>: <span id="physicalPoints">0</span></div>
        <div>🧠 <span data-i18n="cognitivePoints">Cognitive</span>: <span id="cognitivePoints">0</span></div>
        <div>🎨 <span data-i18n="creativePoints">Creative</span>: <span id="creativePoints">0</span></div>
        <div>🤝 <span data-i18n="socialPoints">Social</span>: <span id="socialPoints">0</span></div>
      </div>

      <div class="dashboard-buttons flex flex-col gap-4">
        <button id="earnQuickPointsBtn" class="bg-blue-500 text-white py-2 rounded">
          Earn Quick Points
        </button>
        <button id="goToCoursesBtn" class="bg-green-600 text-white py-2 rounded">
          Courses
        </button>
        <button id="logPhysicalActivityBtn" class="bg-yellow-500 text-white py-2 rounded">
          Log Activity
        </button>
        <button id="visitStoreBtn" class="bg-purple-500 text-white py-2 rounded">
          Visit Store
        </button>
      </div>
    </div>

    <!-- 🔥 GLOBAL OVERLAY -->
    <div id="avatarSavingOverlay"
      class="hidden fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
        <span class="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full"></span>
        <span class="font-medium">Saving avatar…</span>
      </div>
    </div>
  `;

  initStudentDashboard();

  // Let DOM paint first
  requestAnimationFrame(() => {
    renderDashboard();
  });

}
