// blocks/events_admin.js
import { db } from "../app.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

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
        const fileInput = document.getElementById("ev-image");
        if (!title || !date) return alert("Titre et date sont requis.");

        try {
          // Si un fichier est sélectionné, on l'upload d'abord
          let imageUrl = "";
          if (fileInput && fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const storage = getStorage();
            // Générer un chemin unique : events/{timestamp}_{nomfichier}
            const path = `events/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
            const ref = storageRef(storage, path);
            // uploadBytes renvoie un snapshot
            await uploadBytes(ref, file);
            // récupérer l'URL publique
            imageUrl = await getDownloadURL(ref);
          }

          // Créer le document événement avec imageUrl (vide si pas d'image)
          await addDoc(collection(db, "events"), {
            title,
            date,
            desc,
            imageUrl,
            createdAt: new Date().toISOString()
          });

          // reset form
          document.getElementById("ev-title").value = "";
          document.getElementById("ev-date").value = "";
          document.getElementById("ev-desc").value = "";
          if (fileInput) fileInput.value = "";

          alert("Événement publié.");
          // Optionnel : rafraîchir l'agenda si tu appelles AgendaBloc.init() ailleurs
          if (window.AgendaBloc && typeof window.AgendaBloc.init === "function") {
            window.AgendaBloc.init();
          }
        } catch (e) {
          console.error("Erreur création événement:", e);
          alert("Erreur création événement: " + (e.message || e));
        }
      });
    }
  }
};
