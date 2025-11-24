import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, verifyPasswordResetCode, confirmPasswordReset } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

// initialise avec la même config que ton app
const firebaseConfig = {
  apiKey: "TON_API_KEY",
  authDomain: "TON_PROJET.firebaseapp.com",
  projectId: "TON_PROJET",
  // ...
};
initializeApp(firebaseConfig);
const auth = getAuth();

function getQueryParam(name) {
  return new URL(window.location.href).searchParams.get(name);
}

async function initResetPage() {
  const oobCode = getQueryParam("oobCode");
  const infoEl = document.getElementById("reset-info");
  const msgEl = document.getElementById("reset-msg");
  if (!oobCode) {
    infoEl.textContent = "Lien invalide. Demandez un nouveau lien depuis la page de connexion.";
    return;
  }

  try {
    const email = await verifyPasswordResetCode(auth, oobCode);
    infoEl.textContent = `Réinitialisation pour : ${email}`;
  } catch (err) {
    console.error("verifyPasswordResetCode:", err);
    infoEl.textContent = "Le lien est invalide ou expiré. Demandez un nouveau lien.";
    return;
  }

  document.getElementById("reset-submit").addEventListener("click", async () => {
    const p1 = document.getElementById("new-pass").value;
    const p2 = document.getElementById("new-pass2").value;
    if (!p1 || !p2) { msgEl.style.color = "red"; msgEl.textContent = "Remplissez les deux champs."; return; }
    if (p1 !== p2) { msgEl.style.color = "red"; msgEl.textContent = "Les mots de passe ne correspondent pas."; return; }
    if (p1.length < 6) { msgEl.style.color = "red"; msgEl.textContent = "Le mot de passe doit contenir au moins 6 caractères."; return; }

    try {
      await confirmPasswordReset(auth, oobCode, p1);
      msgEl.style.color = "green";
      msgEl.textContent = "Mot de passe modifié. Vous pouvez maintenant vous connecter.";
      setTimeout(() => window.location.href = "/login.html", 2000);
    } catch (err) {
      console.error("confirmPasswordReset:", err);
      msgEl.style.color = "red";
      msgEl.textContent = "Erreur lors de la réinitialisation : " + err.message;
    }
  });
}

window.addEventListener("DOMContentLoaded", initResetPage);
