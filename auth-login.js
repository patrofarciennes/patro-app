// auth-login.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

const firebaseConfig = {
  apiKey: "TON_API_KEY",
  authDomain: "TON_PROJET.firebaseapp.com",
  projectId: "TON_PROJET",
  // ... autres champs de config
};
initializeApp(firebaseConfig);
const auth = getAuth();

window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("login-btn");
  const msg = document.getElementById("login-msg");
  btn.addEventListener("click", async () => {
    msg.textContent = "";
    const email = document.getElementById("login-email").value.trim();
    const pass = document.getElementById("login-pass").value;
    if (!email || !pass) { msg.style.color = "red"; msg.textContent = "Email et mot de passe requis."; return; }
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      msg.style.color = "green";
      msg.textContent = "Connecté. Redirection...";
      // window.location.href = "/"; // décommente pour rediriger
    } catch (e) {
      console.error(e);
      msg.style.color = "red";
      if (e.code === "auth/user-not-found") msg.textContent = "Aucun compte pour cet e‑mail.";
      else if (e.code === "auth/wrong-password") msg.textContent = "Mot de passe incorrect.";
      else msg.textContent = "Erreur connexion : " + (e.message || e.code);
    }
  });

  // Afficher le bloc mot de passe oublié si tu veux
  const showForgot = document.getElementById("show-forgot");
  if (showForgot) {
    showForgot.addEventListener("click", (ev) => {
      ev.preventDefault();
      const el = document.getElementById("forgot-block");
      if (el) el.style.display = el.style.display === "none" ? "block" : "none";
    });
  }
});
