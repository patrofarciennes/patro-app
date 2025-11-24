import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
const auth = getAuth();

export async function requestPasswordReset(email, uiMsgEl) {
  if (!email) {
    uiMsgEl.textContent = "Veuillez saisir une adresse e‑mail.";
    uiMsgEl.style.color = "red";
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email, {
      // optionnel: url de redirection si tu veux forcer la page de ton app
      url: "https://ton-domaine.com/reset-password.html"
    });
    uiMsgEl.textContent = "E‑mail envoyé. Vérifiez votre boîte mail (spam inclus).";
    uiMsgEl.style.color = "green";
  } catch (err) {
    console.error(err);
    uiMsgEl.style.color = "red";
    if (err.code === "auth/user-not-found") uiMsgEl.textContent = "Aucun compte trouvé pour cet e‑mail.";
    else if (err.code === "auth/invalid-email") uiMsgEl.textContent = "Adresse e‑mail invalide.";
    else uiMsgEl.textContent = "Erreur lors de l'envoi : " + err.message;
  }
}

// wiring
document.getElementById("fp-send").addEventListener("click", async () => {
  const email = document.getElementById("fp-email").value.trim();
  const msg = document.getElementById("fp-msg");
  await requestPasswordReset(email, msg);
});
