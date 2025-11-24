import { db } from "../app.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

export const ParentBloc = {
  async init(uid) {
    const container = document.getElementById("parent-children");
    container.textContent = "Chargement…";
    try {
      // Exemple minimal: afficher le nom depuis "users/{uid}" si présent
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      const name = snap.exists() ? (snap.data().name || "Parent") : "Parent";
      container.textContent = `Bonjour ${name}. Vos enfants s’afficheront ici.`;
    } catch (e) {
      container.textContent = "Erreur chargement.";
    }
  }
};
