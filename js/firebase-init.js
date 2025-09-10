// js/firebase-init.js
import { initializeApp }    from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore }     from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getAuth }          from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { 
    initializeFirestore, 
    memoryLocalCache // Import the in-memory cache
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getStorage }       from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBaMBZpawyx2uUc-0_ImZtG7Ast8t2PjvM",
  authDomain: "oquway-c1160.firebaseapp.com",
  projectId: "oquway-c1160",
  storageBucket: "oquway-c1160.appspot.com",  // ← note the “.appspot.com” suffix
  messagingSenderId: "54166550685",
  appId: "1:54166550685:web:8cd6c5e8a77b8a5558fc74",
  measurementId: "G-GKX81PPMKD"
};



const app     = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  localCache: memoryLocalCache()
});

export const auth    = getAuth(app);
export const storage = getStorage(app);       // ← newly exported
export const firebaseApp = app;               // optional
export { app, db};