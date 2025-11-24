// blocks/agenda.js
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
        // Si imageUrl existe, afficher en bannière (style inline simple)
        const bannerHtml = ev.imageUrl
          ? `<div style="width:100%;height:160px;overflow:hidden;border-radius:8px;margin-bottom:8px;">
               <img src="${ev.imageUrl}" alt="${ev.title || 'bannière'}" style="width:100%;height:100%;object-fit:cover;display:block;">
             </div>`
          : "";
        d.innerHTML = `${bannerHtml}
                       <strong style="font-size:16px">${ev.title || "Sans titre"}</strong><br>
                       <small style="color:#6b7280">${ev.date || "Date ?"}</small><br>
                       <div style="margin-top:6px;color:#374151">${ev.desc || ""}</div>`;
        list.appendChild(d);
      });
    } catch (e) {
      console.error("Erreur chargement événements:", e);
      list.textContent = "Erreur de chargement des événements.";
    }
  }
};

// rendre accessible globalement si EventsAdminBloc appelle AgendaBloc.init()
window.AgendaBloc = AgendaBloc;
