import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
const auth = getAuth();

export async function envoyerResetPassword(email) {
  if (!email) { alert("Veuillez saisir une adresse e‑mail."); return; }
  try {
    await sendPasswordResetEmail(auth, email);
    alert("E‑mail de réinitialisation envoyé. Vérifiez votre boîte mail.");
  } catch (err) {
    console.error(err);
    if (err.code === "auth/user-not-found") alert("Aucun compte trouvé pour cet e‑mail.");
    else if (err.code === "auth/invalid-email") alert("Adresse e‑mail invalide.");
    else alert("Erreur lors de l'envoi : " + err.message);
  }
}
