// blocks/contact.js
import { db } from "../app.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { show, hide } from "../app.js";

export const ContactBloc = {
  // currentUser doit être l'objet user Firebase (connu dans app.js)
  async init(currentUser) {
    // Afficher l'email cliquable
    const patroEmailEl = document.getElementById("patro-email");
    if (patroEmailEl) {
      patroEmailEl.href = "mailto:patrofarciennes@gmail.com";
      patroEmailEl.textContent = "patrofarciennes@gmail.com";
    }

    // Charger la liste des numéros depuis settings/phones
    const phonesRef = doc(db, "settings", "phones");
    try {
      const snap = await getDoc(phonesRef);
      const numbers = snap.exists() ? (snap.data().numbers || []) : [];
      this.renderPhoneList(numbers);
    } catch (e) {
      console.error("Erreur lecture phones:", e);
      this.renderPhoneList([]);
    }

    // Montrer les contrôles admin si l'utilisateur est admin
    let isAdmin = false;
    try {
      const profileSnap = await getDoc(doc(db, "users", currentUser.uid));
      const role = profileSnap.exists() ? profileSnap.data().role : null;
      isAdmin = role === "admin";
    } catch (e) {
      console.error("Erreur lecture profil:", e);
    }

    if (isAdmin) {
      show("phone-admin-controls");
      this.wireAdminControls(phonesRef);
    } else {
      hide("phone-admin-controls");
    }

    // Toujours afficher le bloc contact pour les connectés
    show("bloc-contact");
  },

  renderPhoneList(numbers) {
    const ul = document.getElementById("phone-list");
    if (!ul) return;
    ul.innerHTML = "";
    if (!numbers || numbers.length === 0) {
      ul.innerHTML = "<li>Aucun numéro enregistré.</li>";
      return;
    }
    numbers.forEach((num, idx) => {
      const li = document.createElement("li");
      li.style.marginBottom = "6px";
      li.dataset.index = idx;
      li.textContent = num;
      ul.appendChild(li);
    });
  },

  async wireAdminControls(phonesRef) {
    const btn = document.getElementById("btn-add-phone");
    const input = document.getElementById("new-phone");
    if (!btn || !input) return;

    btn.addEventListener("click", async () => {
      const val = input.value.trim();
      if (!val) return alert("Entrez un numéro.");
      try {
        const snap = await getDoc(phonesRef);
        const numbers = snap.exists() ? (snap.data().numbers || []) : [];
        if (numbers.length >= 10) return alert("Limite atteinte : 10 numéros maximum.");
        numbers.push(val);
        await setDoc(phonesRef, { numbers, updatedAt: new Date().toISOString() }, { merge: true });
        this.renderPhoneList(numbers);
        input.value = "";
        this.wireDeleteButtons(phonesRef);
      } catch (e) {
        console.error("Erreur ajout numéro:", e);
        alert("Erreur lors de l'ajout du numéro.");
      }
    });

    // initial wire delete
    this.wireDeleteButtons(phonesRef);
  },

  async wireDeleteButtons(phonesRef) {
    // Recharger la liste et ajouter boutons supprimer
    try {
      const snap = await getDoc(phonesRef);
      const numbers = snap.exists() ? (snap.data().numbers || []) : [];
      const ul = document.getElementById("phone-list");
      if (!ul) return;
      ul.innerHTML = "";
      numbers.forEach((num, idx) => {
        const li = document.createElement("li");
        li.style.marginBottom = "8px";
        li.dataset.index = idx;

        const span = document.createElement("span");
        span.textContent = num;
        li.appendChild(span);

        const del = document.createElement("button");
        del.textContent = "Supprimer";
        del.style.marginLeft = "10px";
        del.style.padding = "4px 8px";
        del.style.fontSize = "13px";
        del.addEventListener("click", async () => {
          const snap2 = await getDoc(phonesRef);
          const nums = snap2.exists() ? (snap2.data().numbers || []) : [];
          nums.splice(idx, 1);
          await setDoc(phonesRef, { numbers: nums, updatedAt: new Date().toISOString() }, { merge: true });
          this.renderPhoneList(nums);
          this.wireDeleteButtons(phonesRef);
        });

        li.appendChild(del);
        ul.appendChild(li);
      });

      if (numbers.length === 0) {
        ul.innerHTML = "<li>Aucun numéro enregistré.</li>";
      }
    } catch (e) {
      console.error("Erreur wireDeleteButtons:", e);
    }
  }
};
