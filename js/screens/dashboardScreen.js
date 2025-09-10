// screens/dashboardScreen.js

// 1. IMPORT the functions we need from studentDashboard.js
import { renderDashboard, initStudentDashboard } from '../studentDashboard.js';

export function renderDashboardScreen(container) {
  // 2. Create the HTML structure with placeholders.
  //    The data will be filled in by renderDashboard().
  container.innerHTML = `
    <div class="p-4 w-full max-w-md mx-auto">
      <h1 class="text-xl font-bold mb-4" data-i18n="dashboardTitle">Dashboard</h1>

      <div class="student-info flex items-center gap-4 mb-4">
        <label for="avatarInput" class="cursor-pointer">
          <img id="dashboard-avatar" src="assets/default-avatar.png" alt="Avatar" class="w-24 h-24 rounded-full border">
        </label>
        <input type="file" id="avatarInput" accept="image/*" class="hidden" />
        <span id="student-name" class="text-lg font-semibold"></span>
      </div>

      <h2 class="text-lg font-medium mb-2" data-i18n="intentionPointsTitle">Intention Points</h2>
      <div class="intention-points grid grid-cols-2 gap-4 mb-6">
        <div class="point-type point-physical">
          💪 <span class="label" data-i18n="physicalPoints">Physical</span>:
          <span class="value" id="physicalPoints">0</span>
        </div>
        <div class="point-type point-cognitive">
          🧠 <span class="label" data-i18n="cognitivePoints">Cognitive</span>:
          <span class="value" id="cognitivePoints">0</span>
        </div>
        <div class="point-type point-creative">
          🎨 <span class="label" data-i18n="creativePoints">Creative</span>:
          <span class="value" id="creativePoints">0</span>
        </div>
        <div class="point-type point-social">
          🤝 <span class="label" data-i18n="socialPoints">Social</span>:
          <span class="value" id="socialPoints">0</span>
        </div>
      </div>

      <div class="dashboard-buttons flex flex-col gap-4">
        <button id="earnQuickPointsBtn" class="dashboard-btn bg-blue-500 text-white py-2 px-4 rounded" data-i18n="earnQuickPointsBtn">Earn Quick Points</button>
        <button id="goToCoursesBtn" class="dashboard-btn bg-green-600 text-white py-2 px-4 rounded" data-i18n="goToActivitiesBtn">Courses</button>
        <button id="logPhysicalActivityBtn" class="dashboard-btn bg-yellow-500 text-white py-2 px-4 rounded" data-i18n="logPhysicalActivityBtn">Log Activity</button>
        <button id="visitStoreBtn" class="dashboard-btn bg-purple-500 text-white py-2 px-4 rounded" data-i18n="visitStoreBtn">Visit Store</button>
      </div>
    </div>
  `;

  // 3. NOW that the HTML exists, call the functions to populate data and add functionality.
  renderDashboard();
  initStudentDashboard();
}