// js/app.js
import { auth } from '../firebase-init.js';
import { signOut, onAuthStateChanged, getIdTokenResult } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { setApiLocation, getAuthorizedLocations } from './api.js';
import { LocationPickerModal } from './modals/LocationPickerModal.js';

import * as ui from './ui.js';

// Import all module initializers
import { init as initOverview } from './modules/overview.js';
import { init as initStudents } from './modules/students.js';
import { init as initPayments } from './modules/payments.js';
import { init as initExpenses } from './modules/expenses.js';
import { init as initTeachers } from './modules/teachers.js';
import { init as initClasses } from './modules/classes.js';
import { renderSettings } from './modules/settings.js';
import { init as initMigration } from './modules/migration.js';

/**
 * Main application class.
 * Orchestrates the dashboard, handling global state, auth, and tab routing.
 */
class AccountingApp {
  constructor() {
    this.tabButtons = document.querySelectorAll('.tab-btn');
    this.contentAreas = document.querySelectorAll('.tab-content');
    this.logoutButton = document.getElementById('logoutBtn');
    this.currentTab = 'overview';
    this.loadedTabs = new Set();

    // NEW LOCATION STATE
    this.allLocations = [];
    this.currentLocationId = localStorage.getItem('activeLocationId') || 'default';
    this.userRole = 'none';
  }

  /**
   * Kicks off the application.
   * Sets up the authentication guard.
   */
  init() {
    // ----------------------------------------------------
    // ✨ FIX: Show Loader and Initial Text IMMEDIATELY
    // ----------------------------------------------------
    document.getElementById('loading-text').textContent = 'Authenticating and preparing system...';
    document.getElementById('global-loading-overlay').classList.remove('hidden');
    // ----------------------------------------------------

    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = './login.html'; // Not logged in
        return;
      }

      try {
        const tokenResult = await getIdTokenResult(user);
        const role = tokenResult.claims.role || 'none';
        const userLocationId = tokenResult.claims.locationId;

        this.userRole = role;

        // 🔐 PRIMARY SECURITY GUARD 🔐
        if (this.userRole !== 'admin' && this.userRole !== 'accountant' && this.userRole !== 'superAdmin') {
          this.showAccessDenied();
          return;
        }

        // --- NEW LOCATION SETUP ---
        this.allLocations = await getAuthorizedLocations(this.userRole, userLocationId);

        // Use user's claim location as the highest priority default
        let defaultLocation = userLocationId || this.currentLocationId || 'default';

        // Ensure the selected location is in the list of authorized locations
        const activeLoc = this.allLocations.find(loc => loc.id === defaultLocation) || this.allLocations[0];
        this.currentLocationId = activeLoc.id;

        setApiLocation(this.currentLocationId);

        const initialLocationName = activeLoc.name || 'Default';

        // FIX: Set the switcher up once using the finalized active location name
        this.setupLocationSwitcher(initialLocationName);
        // --- END LOCATION SETUP ---

        this.setupEventListeners();

        // 3. Update the header location display (This must happen after setupLocationSwitcher)
        const headerLocationDisplay = document.getElementById('header-location-display');
        if (headerLocationDisplay) {
          headerLocationDisplay.textContent = initialLocationName;
        }

        // The first content load (initOverview) will handle hiding the loader.
        this.loadTabContent(this.currentTab, true);

        // 1. Init the floating button listener
        document.getElementById('floating-bug-btn')?.addEventListener('click', () => {
          this.checkAndShowWelcome(true);
        });

        // 2. Auto-show welcome (only if not seen)
        this.checkAndShowWelcome(false);

      } catch (error) {
        document.getElementById('loading-text').textContent = 'Error: Check console.';
        console.error('Error during startup:', error);
        this.showAccessDenied("Error checking permissions.");
        await signOut(auth);
      }
    });
  }

  /**
     * --- NEW: Renders the Location Switcher UI ---
     */
  setupLocationSwitcher(initialLocationName) {
    const locationBtn = document.getElementById('location-selector-btn');
    const locationText = document.getElementById('current-location-text');
    const locationNameDisplay = document.getElementById('current-location-display');

    // Helper to update text
    const updateDisplay = (name) => {
      if (locationText) locationText.textContent = name;
      if (locationNameDisplay) locationNameDisplay.textContent = name;
    };

    updateDisplay(initialLocationName);

    // Attach click listener
    locationBtn?.addEventListener('click', () => {
      const picker = new LocationPickerModal({
        mode: 'global',
        currentLocationId: this.currentLocationId,
        onConfirm: async (newId) => {
          if (newId === this.currentLocationId) return;

          this.currentLocationId = newId;
          setApiLocation(newId);

          // Find new name
          let newName = 'Unknown';
          if (newId === 'all') {
            newName = '🌍 All Locations';
          } else {
            const loc = this.allLocations.find(l => l.id === newId);
            newName = loc ? loc.name : 'Unknown';
          }

          updateDisplay(newName);

          ui.showGlobalLoader(`Switching to ${newName}...`);

          // Force reload
          this.loadedTabs.clear();
          await this.loadTabContent(this.currentTab, true);

          ui.hideGlobalLoader();
        }
      });
      picker.show();
    });
  }



  /**
     * --- UPDATED: Shows the Beta Welcome Screen ---
     * This function is now set to always display upon load.
     * @param {boolean} force - If true, show modal even if already seen.
     */
  /**
    * --- UPDATED: Shows the Beta Welcome Screen ---
    * This function is now set to always display upon load.
    * @param {boolean} force - If true, show modal even if already seen.
    */
  checkAndShowWelcome(force = false) {
    // Prevent duplicate modals (still needed if the bug button is double-clicked)
    if (document.getElementById('welcome-modal')) return;

    const welcomeModal = document.createElement('div');
    welcomeModal.id = 'welcome-modal';
    welcomeModal.className = "fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm transition-opacity duration-300";

    // Slightly different text if they clicked the bug button vs auto-welcome
    const titleText = force ? "Support & Bug Report" : "Welcome to OquWay Beta";
    const btnText = force ? "Close" : "I Understand – Let's Start!";

    welcomeModal.innerHTML = `
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden transform scale-100 transition-transform duration-300 flex flex-col max-h-[90vh]">
        <div class="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white text-center flex-shrink-0">
          <div class="text-5xl mb-2">${force ? '🛠️' : '🚀'}</div>
          <h2 class="text-2xl font-bold">${titleText}</h2>
          <p class="text-blue-100 text-sm mt-1">System Version 1.3 (Multi-Location Ready)</p>
        </div>

        <div class="p-6 space-y-4 overflow-y-auto flex-grow custom-scrollbar">
          <p class="text-gray-600 leading-relaxed">
            ${force
        ? "Need help? Found a bug? Use the direct line below to contact the developer."
        : "You are one of the first users to access the new accounting system! Please check the latest changes below."}
          </p>

          <div class="bg-gray-50 border-l-4 border-gray-200 p-4 rounded-r-md">
            <h3 class="font-bold text-lg text-gray-700 cursor-pointer flex items-center justify-between" id="updates-toggle">
                <span>Latest Updates (V1.4/V1.3)</span>
                <span class="transform transition-transform duration-200 rotate-0">▶</span>
            </h3>
            <div id="updates-content" class="mt-2 hidden">
                
                <h4 class="font-semibold text-gray-700 mb-1">V1.4: Multi-Location & Stability</h4>
                <ul class="list-disc list-inside text-sm text-gray-600 space-y-1 pl-4">
                    <li><strong>Full Location Access:</strong> SuperAdmins/PlatformAdmins now see all available locations.</li>
                    <li><strong>Data Integrity:</strong> Implemented conditional filtering to stabilize dashboard views (Students, Payments, Expenses) in the 'Default' location.</li>
                    <li><strong>Migration Tools:</strong> Added the Admin-only 'Migration' tab to audit and assign location IDs to legacy data.</li>
                    <li><strong>UI Context:</strong> Location name is now persistently visible in the main header.</li>
                </ul>

                <h4 class="font-semibold text-gray-700 mt-4 mb-1 border-t pt-2">V1.2/V1.1: Scheduling & Payroll Overhaul</h4>
                <ul class="list-disc list-inside text-sm text-gray-600 space-y-1 pl-4">
                    <li><strong>Scheduling:</strong> Added Language, Mode, and Teacher Search filters to the finding tool.</li>
                    <li><strong>Class Assignment:</strong> New split-pane modal to instantly create new classes or join existing groups.</li>
                    <li><strong>Payroll:</strong> Implemented custom 26th-to-25th pay periods and detailed print reports.</li>
                    <li><strong>Stability:</strong> Fixed payment recalculation on edit and resolved date parsing bugs.</li>
                </ul>
            </div>
          </div>
          
          <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
            <h3 class="font-bold text-red-700 flex items-center gap-2">
              <span>🚨 Urgent Issues</span>
            </h3>
            <p class="text-sm text-red-600 mt-1">
              If something is broken (e.g., cannot save payment, page crashes), please contact me immediately:
            </p>
            <a href="https://wa.me/996550346970" target="_blank" 
               class="mt-3 flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition">
               <span>💬 WhatsApp Bryant</span>
               <span class="font-normal text-xs">(+996 550 346 970)</span>
            </a>
          </div>

          <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md">
            <h3 class="font-bold text-blue-700">📝 Feedback</h3>
            <p class="text-sm text-blue-600 mt-1">
              Notice a typo? Have an idea for a feature? Please let me know!
            </p>
          </div>
        </div>

        <div class="bg-gray-50 px-6 py-4 text-center flex-shrink-0">
          <button id="close-welcome-btn" class="w-full btn-primary py-3 text-lg shadow-lg">
            ${btnText}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(welcomeModal);

    // Attach event listener for the updates toggle
    const updatesToggle = welcomeModal.querySelector('#updates-toggle');
    const updatesContent = welcomeModal.querySelector('#updates-content');
    const toggleIcon = updatesToggle.querySelector('span:last-child');

    updatesToggle.addEventListener('click', () => {
      updatesContent.classList.toggle('hidden');
      // Rotate 90 degrees when open (not hidden)
      toggleIcon.classList.toggle('rotate-90', !updatesContent.classList.contains('hidden'));
    });

    // Handle Close button
    welcomeModal.querySelector('#close-welcome-btn').addEventListener('click', () => {
      welcomeModal.classList.add('opacity-0');
      setTimeout(() => welcomeModal.remove(), 300);
    });
  }

  /**
   * Binds all global event listeners.
   */
  setupEventListeners() {
    this.tabButtons.forEach(tab => {
      tab.addEventListener('click', () => this.handleTabClick(tab));
    });

    this.logoutButton?.addEventListener('click', () => this.logout());
  }

  /**
   * Handles the logic when a user clicks on a tab.
   */
  handleTabClick(clickedTab) {
    const tabName = clickedTab.dataset.tab;
    if (this.currentTab === tabName) return;

    this.currentTab = tabName;

    // Update UI
    this.tabButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.tab === tabName);
    });
    this.contentAreas.forEach(content => {
      content.classList.toggle('hidden', content.id !== `tab-${tabName}`);
    });

    this.loadTabContent(tabName);
  }

  /**
   * Acts as a router, calling the correct module to populate the tab's content.
   */
  loadTabContent(tabName) {
    if (this.loadedTabs.has(tabName) && tabName !== 'overview') {
      return;
    }

    // We get the user role from the instance variable (this.userRole)
    const userRole = this.userRole;

    // 2. UPDATE THE SWITCH STATEMENT
    switch (tabName) {
      case 'overview': initOverview(); break;
      case 'payments': initPayments(); break;
      case 'expenses': initExpenses(); break;
      case 'students': initStudents(); break;
      case 'teachers': initTeachers(); break;
      case 'classes': initClasses(); break;
      case 'migration': initMigration(userRole); break;
      case 'settings': renderSettings(); break;

      default:
        console.warn(`No module found for tab: ${tabName}`);
    }
    this.loadedTabs.add(tabName);
  }

  /**
   * Displays an "Access Denied" message and hides the main UI.
   */
  showAccessDenied(message = "Accounting system is for administrative staff only.") {
    const main = document.querySelector('main');
    if (main) {
      main.innerHTML = `
        <div class="max-w-xl mx-auto mt-20 text-center bg-white p-10 rounded-lg shadow-xl">
          <h1 class="text-3xl font-bold text-red-600">🚫 Access Denied</h1>
          <p class="text-lg text-gray-700 mt-4">${message}</p>
          <button id="logoutBtnDenied" class="mt-6 text-sm font-medium text-blue-600 hover:text-blue-800 transition">Logout</button>
        </div>
      `;
      // Hide tab navigation
      document.querySelector('.bg-white.border-b')?.classList.add('hidden');
      document.getElementById('logoutBtnDenied')?.addEventListener('click', () => this.logout());
    }
  }

  /**
   * Signs the user out.
   */
  async logout() {
    try {
      await signOut(auth);
      console.log('User signed out.');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }
}

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  const app = new AccountingApp();
  app.init();
});

window.addEventListener('error', (e) => {
  console.error('❌ Global JS Error:', e.message, e.filename);
});