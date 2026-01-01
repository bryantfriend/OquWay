// router.js
import { renderLoginScreen }       from "./screens/loginScreen.js";
import { renderDashboardScreen }   from "./screens/dashboardScreen.js";
import { renderStoreScreen }       from "./screens/storeScreen.js";
import { renderCoursesScreen }     from "./screens/coursesScreen.js";
import { renderCoursePlayerScreen } from "./screens/coursePlayerScreen.js";
import { renderModuleScreen }       from "./screens/moduleScreen.js"; // 👈 Add this line

const routes = {
  login:       renderLoginScreen,
  dashboard:   renderDashboardScreen,
  store:       renderStoreScreen,
  courses:     renderCoursesScreen,
  coursePlayerScreen: renderCoursePlayerScreen, // 👈 Add this route
  moduleScreen:       renderModuleScreen         // 👈 Add this route
};

const screenContainer = document.getElementById("screenContainer");

export function navigateTo(screenName, data = {}) {
  const renderFn = routes[screenName];

  if (!renderFn) {
    console.error(`🚫 Unknown screen: "${screenName}"`);
    return;
  }

  // Clear container
  screenContainer.innerHTML = "";

  // Render the screen
  renderFn(screenContainer, data);
}
