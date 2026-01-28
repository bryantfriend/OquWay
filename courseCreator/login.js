import { auth } from "./firebase-init.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const errorMsg = document.getElementById("errorMsg");

// If already logged in → skip login (unless we just got an unauthorized error)
onAuthStateChanged(auth, (user) => {
  const urlParams = new URLSearchParams(window.location.search);
  const isUnauthorized = urlParams.get('error') === 'unauthorized';

  if (user && !isUnauthorized) {
    window.location.href = "CourseCreator.html";
  }

  if (isUnauthorized) {
    errorMsg.textContent = "Access Denied: You do not have permission to access the Course Creator.";
    errorMsg.classList.remove("hidden");
  }
});

loginBtn.addEventListener("click", async () => {
  errorMsg.classList.add("hidden");

  try {
    await signInWithEmailAndPassword(
      auth,
      emailInput.value.trim(),
      passwordInput.value
    );
    window.location.href = "CourseCreator.html";
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.classList.remove("hidden");
  }
});
