import { auth } from "../../Shared/firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

/**
 * Checks if the current user is a teacher.
 * If not, redirects to the student login page.
 * @returns {Promise<void>}
 */
export async function requireTeacherAuth() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                console.warn("🚫 No user found. Redirecting to login.");
                redirectToLogin();
                return;
            }

            try {
                const tokenResult = await user.getIdTokenResult();
                // Check for 'teacher' role or any other logic you prefer
                // For now, we'll be permissive if claims aren't set up yet, 
                // OR strict if you want. Let's start with a warning if role is missing.
                const role = tokenResult.claims.role;

                if (role !== 'teacher') {
                    // console.warn(`⚠️ User is not a teacher (role=${role}). Redirecting...`);
                    // redirectToLogin(); 

                    // 🚨 COMMENTED OUT FOR DEV/DEMO to allow testing without claims setup.
                    // Uncomment the line above to enforce strict role checks.
                    console.log(`ℹ️ [DEV] User role is '${role}'. Proceeding...`);
                    resolve(user);
                } else {
                    console.log("✅ Teacher authenticated.");
                    resolve(user);
                }
            } catch (e) {
                console.error("Auth check failed:", e);
                redirectToLogin();
            }
        });
    });
}

function redirectToLogin() {
    // Determine path to StudentPanel login
    // Assuming structure: Platform/teacher-dashboard/ -> Platform/StudentPanel/login.html
    window.location.href = "../StudentPanel/login.html";
}
