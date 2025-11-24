// ================================
// BLOC: Firebase init (config + sdk)
// ================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJtxq8jASxxMrAs4a-_B8LJ2TUjoADYtU",
  authDomain: "patrofarcienes.firebaseapp.com",
  projectId: "patrofarcienes",
  storageBucket: "patrofarcienes.appspot.com",
  messagingSenderId: "659827925488",
  appId: "1:659827925488:web:6d609438248cc9c65f7d35"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ================================
// BLOC: Helpers (DOM + roles)
// ================================
const $ = (id) => document.getElementById(id);

function show(id) { $(id).classList.remove("hidden"); }
function hide(id) { $(id).classList.add("hidden"); }

async function getUserRole(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().role : null;
}

async function getUserProfile(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// ================================
// BLOC: Session (login/logout + routeur d’affichage)
// ================================
function wireSessionButtons() {
  $("btn-login").addEventListener("click", async () => {
    const email = $("login-email").value.trim();
    const pass = $("login-pass").value.trim();
    if (!email || !pass) return alert("Email et mot de passe requis.");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      alert("Erreur de connexion: " + e.message);
    }
  });

  $("btn-logout").addEventListener("click", async () => {
    await signOut(auth);
  });
}

async function routeDisplayForUser(user) {
  if (!user) {
    // déconnecté: montrer uniquement Connexion
    show("bloc-connexion");
    hide("bloc-session");
    hide("bloc-agenda");
    hide("bloc-events-admin");
    hide("bloc-comptes-admin");
    hide("bloc-parent");
    hide("bloc-enfant");
    return;
  }

  // connecté: session visible
  hide("bloc-connexion");
  show("bloc-session");
  $("user-email").textContent = user.email || "—";

  const profile = await getUserProfile(user.uid);
  const role = profile?.role || "parent";
  $("user-role").textContent = role;

  // blocs communs à tous les rôles
  show("bloc-agenda");
  await AgendaBloc.init(); // charger la liste des événements

  // visibilité par rôle
  if (role === "admin") {
    show("bloc-events-admin");
    show("bloc-comptes-admin");
    hide("bloc-parent");
    hide("bloc-enfant");
    EventsAdminBloc.init();
    AccountsAdminBloc.init();
  } else if (role === "animateur") {
    show("bloc-events-admin");
    hide("bloc-comptes-admin");
    hide("bloc-parent");
    hide("bloc-enfant");
    EventsAdminBloc.init();
  } else if (role === "parent") {
    show("bloc-parent");
    hide("bloc-events-admin");
    hide("bloc-comptes-admin");
    hide("bloc-enfant");
    ParentBloc.init(user.uid);
  } else if (role === "enfant") {
    show("bloc-enfant");
    hide("bloc-events-admin");
    hide("bloc-comptes-admin");
    hide("bloc-parent");
    EnfantBloc.init(user.uid);
  }
}

onAuthStateChanged(auth, (user) => {
  routeDisplayForUser(user);
});

wireSessionButtons();

// ================================
// BLOC: Agenda (lecture)
// ================================
const AgendaBloc = {
  async init() {
    const list = $("agenda-list");
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

// ================================
// BLOC: Création d’événements (admin/animateur)
// ================================
const EventsAdminBloc = {
  init() {
    $("btn-create-event").onclick = async () => {
      const title = $("ev-title").value.trim();
      const date = $("ev-date").value;
      const desc = $("ev-desc").value.trim();
      if (!title || !date) return alert("Titre et date sont requis.");
      try {
        await addDoc(collection(db, "events"), {
          title, date, desc,
          createdAt: new Date().toISOString()
        });
        $("ev-title").value = "";
        $("ev-date").value = "";
        $("ev-desc").value = "";
        alert("Événement publié.");
        AgendaBloc.init(); // rafraîchir la liste
      } catch (e) {
        alert("Erreur création événement: " + e.message);
      }
    };
  }
};

// ================================
// BLOC: Gestion des comptes (admin)
// ================================
const AccountsAdminBloc = {
  init() {
    $("btn-create-user").onclick = async () => {
      const name = $("new-name").value.trim();
      const email = $("new-email").value.trim();
      const role = $("new-role").value;
      const section = $("new-section").value;
      if (!name || !email) return alert("Nom et email requis.");

      // Note: la création authentification (email/password) nécessite un backend ou
      // l’admin crée le compte avec un mot de passe provisoire côté Auth Console.
      // Ici, on crée le profil Firestore lié à l’email (clé = email).
      try {
        await setDoc(doc(db, "profiles", email), {
          name, email, role, section,
          createdAt: new Date().toISOString()
        });
        alert("Profil créé dans Firestore pour " + email);
        $("new-name").value = "";
        $("new-email").value = "";
      } catch (e) {
        alert("Erreur création profil: " + e.message);
      }
    };
  }
};

// ================================
// BLOC: Espace Parent
// ================================
const ParentBloc = {
  async init(uid) {
    // Exemple: lier des enfants au parent par l’email
    const container = $("parent-children");
    container.textContent = "Chargement…";
    try {
      // Démo simple: on lit des documents enfants pour ce parent (email)
      // À adapter selon ta structure ("children" collection avec ownerEmail)
      const prof = await getUserProfile(uid);
      container.textContent = prof?.name
        ? `Bonjour ${prof.name}. Vos enfants s’afficheront ici.`
        : "Vos enfants s’afficheront ici.";
    } catch (e) {
      container.textContent = "Erreur chargement.";
    }
  }
};

// ================================
// BLOC: Espace Enfant
// ================================
const EnfantBloc = {
  async init(uid) {
    // Démo simple: message basique
    // Tu pourras y ajouter agenda filtré par section
    // Exemple: afficher les événements selon section stockée dans le profil
  }
};

// ================================
// BLOC: Ajouter un nouveau bloc (modèle)
// ================================
// 1) Crée une section dans index.html: <section id="bloc-nouveau" class="bloc hidden">…</section>
// 2) Ajoute le module ci-dessous et appelle NouveauBloc.init() là où tu veux.
// 3) Montre/masque via show('bloc-nouveau') / hide('bloc-nouveau').

const NouveauBloc = {
  init() {
    // ton code ici
  }
};
