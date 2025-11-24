import { getAuth, verifyPasswordResetCode, confirmPasswordReset } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
const auth = getAuth();

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

async function initResetPage() {
  const oobCode = getQueryParam("oobCode");
  const infoEl = document.getElementById("reset-info");
  const msgEl = document.getElementById("reset-msg");
  if (!oobCode) {
    infoEl.textContent = "Lien invalide ou manquant. Assurez‑vous d'avoir cliqué sur le lien reçu par e‑mail.";
    return;
  }

  try {
    // Vérifier le code et récupérer l'email associé (optionnel)
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
    if (!p1 || !p2) { msgEl.textContent = "Veuillez remplir les deux champs."; msgEl.style.color = "red"; return; }
    if (p1 !== p2) { msgEl.textContent = "Les mots de passe ne correspondent pas."; msgEl.style.color = "red"; return; }
    if (p1.length < 6) { msgEl.textContent = "Le mot de passe doit contenir au moins 6 caractères."; msgEl.style.color = "red"; return; }

    try {
      await confirmPasswordReset(auth, oobCode, p1);
      msgEl.textContent = "Mot de passe modifié. Vous pouvez maintenant vous connecter.";
      msgEl.style.color = "green";
      // Optionnel : rediriger vers la page de connexion après quelques secondes
      setTimeout(() => window.location.href = "/login.html", 2500);
    } catch (err) {
      console.error("confirmPasswordReset:", err);
      msgEl.textContent = "Erreur lors de la réinitialisation : " + err.message;
      msgEl.style.color = "red";
    }
  });
}

window.addEventListener("DOMContentLoaded", initResetPage);
