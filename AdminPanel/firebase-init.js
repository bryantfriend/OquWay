// js/firebase-init.js
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  initializeFirestore,
  memoryLocalCache,
  setLogLevel,
  getFirestore
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

// 🔧 Enable Firestore debug logging
setLogLevel("debug");

const firebaseConfig = {
  apiKey: "AIzaSyBaMBZpawyx2uUc-0_ImZtG7Ast8t2PjvM",
  authDomain: "oquway-c1160.firebaseapp.com",
  projectId: "oquway-c1160",
  // ✅ FIXED: Correct bucket name to match Firebase Console
  storageBucket: "oquway-c1160.firebasestorage.app",
  messagingSenderId: "54166550685",
  appId: "1:54166550685:web:8cd6c5e8a77b8a5558fc74",
  measurementId: "G-GKX81PPMKD"
};

// --- START ROBUST INITIALIZATION ---
let app;
let db;

// Check if Firebase app is already initialized
if (getApps().length === 0) {
    // Initialize for the first time
    app = initializeApp(firebaseConfig);
    db = initializeFirestore(app, { localCache: memoryLocalCache() });
} else {
    // Use the already initialized app instance
    app = getApp();
    // Retrieve the existing Firestore instance
    db = getFirestore(app); // Revert to passing 'app' for clarity
}
// --- END ROBUST INITIALIZATION ---

// ✅ Auth & Storage
const auth = getAuth(app);
const storage = getStorage(app);

// Exports
export { app, auth, db, storage };

// 🧠 Optional: Debug helper (AFTER exports)
export async function dumpAuthClaims(tag = "Auth") {
  try {
    const u = auth.currentUser;
    if (!u) {
      console.warn(`🔐 [${tag}] No currentUser`);
      return;
    }
    const t = await u.getIdTokenResult(true);
    console.log(`🔐 [${tag}] uid=`, u.uid);
    console.log(`🔐 [${tag}] claims=`, t.claims);
  } catch (e) {
    console.error(`🔐 [${tag}] Failed to load claims:`, e);
  }
}
