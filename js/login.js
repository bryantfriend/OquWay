// login.js
import { db, app } from './firebase-init.js'; // Make sure 'app' is exported from your init file
import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
    getAuth,
    signInWithCustomToken,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
    getFunctions,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js";
import { FRUIT_EMOJIS } from './config.js';
import { showScreen } from './utilities.js';

// --- Firebase Services ---
const auth = getAuth(app);
const functions = getFunctions(app);
const studentLoginCallable = httpsCallable(functions, 'studentLogin');

// --- State Management ---
let selectedStudent = null;

// --- DOM References ---
const emojiInput = document.getElementById("emojiPasswordInput");
const loginBtn = document.getElementById("loginBtn");
const dashboardScreen = document.getElementById('dashboardScreen');


/**
 * Main initialization function. Runs when the page loads.
 * The main entry point (like main.js) is now responsible for the primary loading screen.
 */
async function initializeLogin() {
    // Check if a user is already signed in from a previous session
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is already signed in. Navigating to dashboard.", user.uid);
            showScreen(dashboardScreen);
            // You might want to initialize the dashboard here as well
            // initStudentDashboard(user); 
        } else {
            console.log("No user signed in. Starting login flow.");
            startLoginFlow();
        }
    });
}

/**
 * Starts the process by fetching and displaying locations.
 */
function startLoginFlow() {
    // These functions will now handle their own internal loading states.
    populateLocations();
    buildFruitGrid();
}


/**
 * Fetches ONLY the locations from Firestore and renders them, showing an inline loading message.
 */
async function populateLocations() {
    const container = document.getElementById("locationButtons");
    // Show a loading state inside the container immediately
    container.innerHTML = '<p class="text-gray-500 text-center">Loading locations...</p>';

    try {
        const locSnap = await getDocs(collection(db, 'locations'));
        const locations = locSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Clear the loading message
        container.innerHTML = ''; 

        if (locations.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center">No locations have been set up.</p>';
            return;
        }

        locations.forEach(loc => {
            const card = document.createElement("div");
            card.className = 'bg-white rounded-lg shadow p-4 text-center cursor-pointer hover:scale-105 transition transform duration-200';
            card.innerHTML = `
                <img src="${loc.imageUrl || 'assets/school-default.jpg'}" alt="${loc.name}" class="w-20 h-20 mx-auto mb-2 rounded-full object-cover">
                <div class="text-sm font-semibold">${loc.name}</div>
            `;
            card.addEventListener("click", () => {
                populateClasses(loc.id); // Fetch classes for THIS location
                document.getElementById("locationSection").classList.add("hidden");
                document.getElementById("classSection").classList.remove("hidden");
                document.getElementById("backToLocationBtn")?.classList.remove("hidden");
            });
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error fetching locations:", error);
        container.innerHTML = `<p class="text-red-500">Could not load locations.</p>`;
    }
}

/**
 * Fetches ONLY the classes for a specific location.
 * @param {string} locationId The ID of the selected location.
 */
async function populateClasses(locationId) {
    const container = document.getElementById("classButtons");
    container.innerHTML = '<p class="text-gray-500 text-center">Loading classes...</p>';

    try {
        const q = query(collection(db, 'classes'), where("locationId", "==", locationId), where("isArchived", "==", false));
        const classSnap = await getDocs(q);
        const classes = classSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        container.innerHTML = ''; // Clear "Loading..." text
        if (classes.length === 0) {
            container.innerHTML = `<p class="text-gray-500 text-center">No classes found for this location.</p>`;
            return;
        }

        classes.forEach(cls => {
            const btn = document.createElement("button");
            btn.className = 'btn flex flex-col items-center justify-center p-2';
            btn.innerHTML = `
                <img src="${cls.photoDataUrl || 'assets/class-default.png'}" alt="${cls.name}" class="w-20 h-20 rounded-full object-cover mb-2">
                <div class="text-sm font-semibold text-center">${cls.name}</div>
            `;
            btn.addEventListener("click", () => {
                renderStudentButtons(cls.id); // Fetch students for THIS class
                document.getElementById("selectStudentHeading").classList.remove("hidden");
            });
            container.appendChild(btn);
        });
    } catch (error) {
        console.error("Error fetching classes:", error);
        container.innerHTML = `<p class="text-red-500">Could not load classes.</p>`;
    }
}

/**
 * Fetches ONLY the students for a specific class.
 * @param {string} classId The ID of the selected class.
 */
async function renderStudentButtons(classId) {
    const container = document.getElementById("studentButtons");
    container.innerHTML = '<p class="text-gray-500 text-center">Loading students...</p>';

    try {
        const q = query(collection(db, 'users'), where("classId", "==", classId), where("role", "==", "student"));
        const userSnap = await getDocs(q);
        const students = userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        container.innerHTML = ''; // Clear "Loading..." text
        if (students.length === 0) {
            container.innerHTML = `<p class="text-gray-500 text-center">No students found in this class.</p>`;
            return;
        }

        students.forEach(s => {
            const btn = document.createElement("button");
            btn.className = 'student-photo-item';
            btn.innerHTML = `<img src="${s.photoUrl || 'assets/avatar-default.png'}" alt="${s.name}" title="${s.name}">`;
            btn.addEventListener("click", () => {
                selectedStudent = s; // Set the selected student object
                emojiInput.value = '';
                loginBtn.disabled = true;
                document.getElementById("selectedStudentName").textContent = s.name;
                document.getElementById("selectedStudentName").classList.remove("hidden");
            });
            container.appendChild(btn);
        });
    } catch (error) {
        console.error("Error fetching students:", error);
        container.innerHTML = `<p class="text-red-500">Could not load students.</p>`;
    }
}

/**
 * Handles the secure login process by calling the Cloud Function.
 */
async function handleLogin() {
    if (!selectedStudent) {
        alert('Please select your picture.');
        return;
    }

    const emojis = [...emojiInput.value.matchAll(/[\u{1F300}-\u{1FAFF}]/gu)].map(m => m[0]);
    if (emojis.length !== 4) {
        alert('Please enter your 4-emoji password.');
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    try {
        // 1. Call the secure Cloud Function to verify password and get a token
        const result = await studentLoginCallable({
            studentId: selectedStudent.id,
            fruitPassword: emojis
        });

        const customToken = result.data.token;
        if (!customToken) {
            throw new Error("Authentication failed: No token received.");
        }

        // 2. Sign into Firebase with the custom token
        await signInWithCustomToken(auth, customToken);

        // 3. Success! The onAuthStateChanged listener will handle navigation.
        // No need to do anything else here, as the listener will detect the new user.

    } catch (error) {
        console.error("Login failed:", error);
        alert('Incorrect password. Please try again.');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', initializeLogin);
loginBtn.addEventListener('click', handleLogin);

document.getElementById("backToLocationBtn").addEventListener("click", () => {
    selectedStudent = null;
    document.getElementById("locationSection").classList.remove("hidden");
    document.getElementById("classSection").classList.add("hidden");
    document.getElementById("backToLocationBtn").classList.add("hidden");
    document.getElementById("classButtons").innerHTML = '';
    document.getElementById("studentButtons").innerHTML = '';
    document.getElementById("selectStudentHeading").classList.add("hidden");
    document.getElementById("selectedStudentName").classList.add("hidden");
    emojiInput.value = '';
    loginBtn.disabled = true;
});

function buildFruitGrid() {
    const grid = document.getElementById('fruitGrid');
    grid.innerHTML = '';
    FRUIT_EMOJIS.forEach(fruit => {
        const btn = document.createElement('button');
        btn.className = 'fruit-button';
        btn.textContent = fruit;
        btn.addEventListener('click', () => {
            const current = [...emojiInput.value.matchAll(/[\u{1F300}-\u{1FAFF}]/gu)].map(m => m[0]);
            if (current.length < 4) {
                emojiInput.value += fruit;
                if (current.length + 1 === 4) {
                    loginBtn.disabled = false;
                }
            }
        });
        grid.appendChild(btn);
    });

    const clearBtn = document.createElement("button");
    clearBtn.className = "fruit-button";
    clearBtn.textContent = "🔙";
    clearBtn.addEventListener("click", () => {
        const current = [...emojiInput.value.matchAll(/[\u{1F300}-\u{1FAFF}]/gu)].map(m => m[0]);
        emojiInput.value = current.slice(0, -1).join('');
        loginBtn.disabled = true;
    });
    grid.appendChild(clearBtn);
}
