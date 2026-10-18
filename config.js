
/*
 * Étudiant Mé Style — Configuration Firebase
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDCxU6Jo-7S-1EZLLeq38ttVV78dqP30QY",
  authDomain: "etudiant-me-style.firebaseapp.com",
  projectId: "etudiant-me-style",
  storageBucket: "etudiant-me-style.firebasestorage.app",
  messagingSenderId: "40686369187",
  appId: "1:40686369187:web:e423b2c4023ade7fec4216",
  measurementId: "G-W23T2YD677"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

// Adresse e-mail du compte administrateur Firebase.
// Remplace cette valeur par l'adresse utilisée pour créer ton compte.
const ADMIN_EMAIL = "TON_EMAIL_ADMIN";

export { app, auth, db, ADMIN_EMAIL };
