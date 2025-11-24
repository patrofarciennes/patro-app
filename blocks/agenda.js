import { db } from "../app.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

export const AgendaBloc = {
  async init() {
    const list = document.getElementById("agenda-list");
    list.innerHTML = "Chargement...";
    try {
      const q = query(collection(db, "events"), orderBy("date", "asc"));
      const snap = await getDocs(q);
      if (snap.empty) {
        list.textContent = "Aucun événement.";
        return;
      }
      list.innerHTML = "";
      snap.forEach(docu => {
        const ev = docu.data();
        const d = document.createElement("div");
        d.className = "event";
        d.innerHTML = `<strong>${ev.title || "Sans titre"}</strong><br>
                       ${ev.date || "Date ?"}<br>
                       <span class="hint">${ev.desc || ""}</span>`;
        list.appendChild(d);
      });
    } catch (e) {
      list.textContent = "Erreur de chargement des événements.";
    }
  }
};
