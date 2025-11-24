import { db } from "../app.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

export const AccountsAdminBloc = {
  init() {
    const btn = document.getElementById("btn-create-user");
    if (!btn.dataset.wired) {
      btn.dataset.wired = "1";
      btn.addEventListener("click", async () => {
        const name = document.getElementById("new-name").value.trim();
        const email = document.getElementById("new-email").value.trim();
        const role = document.getElementById("new-role").value;
        const section = document.getElementById("new-section").value;
        if (!name || !email) return alert("Nom et email requis.");

        try {
          // Profil Firestore indexé par email (simple). Pour indexer par uid, lie après inscription.
          await setDoc(doc(db, "profiles", email), {
            name, email, role, section,
            createdAt: new Date().toISOString()
          });
          alert("Profil créé pour " + email);
          document.getElementById("new-name").value = "";
          document.getElementById("new-email").value = "";
        } catch (e) {
          alert("Erreur création profil: " + e.message);
        }
      });
    }
  }
};
