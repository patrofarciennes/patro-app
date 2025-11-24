import { db } from "../app.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

export const EventsAdminBloc = {
  init() {
    const btn = document.getElementById("btn-create-event");
    if (!btn) return;
    if (!btn.dataset.wired) {
      btn.dataset.wired = "1";
      btn.addEventListener("click", async () => {
        const title = document.getElementById("ev-title").value.trim();
        const date = document.getElementById("ev-date").value;
        const desc = document.getElementById("ev-desc").value.trim();
        if (!title || !date) return alert("Titre et date sont requis.");
        try {
          await addDoc(collection(db, "events"), {
            title, date, desc,
            createdAt: new Date().toISOString()
          });
          document.getElementById("ev-title").value = "";
          document.getElementById("ev-date").value = "";
          document.getElementById("ev-desc").value = "";
          alert("Événement publié.");
        } catch (e) {
          alert("Erreur création événement: " + e.message);
        }
      });
    }
  }
};
