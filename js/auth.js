import { auth, db } from './firebase-init.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';

// Hardcoded super admin login (temporary)
const superAdmin = {
  email: "fangbaian@gmail.com",
  password: "oquwayVineyard7"
};

function isSuperAdminLogin(email, password) {
  return (
    email.toLowerCase() === superAdmin.email &&
    password === superAdmin.password
  );
}



import {
  doc, setDoc, getDoc
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const loginForm    = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const showLoginBtn    = document.getElementById('show-login');
const showRegisterBtn = document.getElementById('show-register');
const authError       = document.getElementById('auth-error');

showLoginBtn.addEventListener('click', () => {
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
  authError.textContent = '';
});

showRegisterBtn.addEventListener('click', () => {
  loginForm.classList.add('hidden');
  registerForm.classList.remove('hidden');
  authError.textContent = '';
});

// 🔐 LOGIN
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    // 🔍 Fetch custom claims
    const tokenResult = await user.getIdTokenResult();
    const claims = tokenResult.claims;

    if (claims.role === 'platformAdmin') {
      localStorage.setItem("userRole", "platformAdmin");
      window.location.href = "adminPanel.html";
    } else if (claims.role === 'locationAdmin') {
      window.location.href = 'locationDashboard.html';
    } else if (claims.role === 'student') {
      window.location.href = 'studentDashboard.html';
    } else {
      throw new Error("Unknown or missing user role");
    }

  } catch (err) {
    console.error('Login error:', err);
    authError.textContent = err.message;
  }
});



// 🆕 REGISTER
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name     = document.getElementById('reg-name').value;
  const email    = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const role     = document.getElementById('reg-role').value;

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    await setDoc(doc(db, 'users', uid), {
      name,
      email,
      role,
      approved: false // Platform admin must approve
    });

    authError.textContent = 'Registration successful. Awaiting approval.';
    registerForm.reset();

  } catch (err) {
    console.error('Registration error:', err);
    authError.textContent = err.message;
  }
});
