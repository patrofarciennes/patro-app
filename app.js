// ================================
// BLOC: Firebase init (config + sdk)
// ================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { ContactBloc } from "./blocks/contact.js";

// Modules blocs
import { AgendaBloc } from "./blocks/agenda.js";
import { EventsAdminBloc } from "./blocks/events_admin.js";
import { AccountsAdminBloc } from "./blocks/accounts_admin.js";
import { ParentBloc } from "./blocks/parent.js";
import { EnfantBloc } from "./blocks/enfant.js";

// Configuration Firebase (déjà fournie)
const firebaseConfig = {
  apiKey: "AIzaSyBJtxq8jASxxMrAs4a-_B8LJ2TUjoADYtU",
  authDomain: "patrofarcienes.firebaseapp.com",
  projectId: "patrofarcienes",
  storageBucket: "patrofarcienes.appspot.com",
  messagingSenderId: "659827925488",
  appId: "1:659827925488:web:6d609438248cc9c65f7d35"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ================================
// BLOC: Helpers (DOM + roles)
// ================================
const $ = (id) => document.getElementById(id);
export function show(id) { $(id).classList.remove("hidden"); }
export function hide(id) { $(id).classList.add("hidden"); }

export async function getUserProfile(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

import { envoyerResetPassword } from "./auth-reset.js";

document.getElementById("forgot-password-link").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = prompt("Saisissez votre adresse e‑mail pour recevoir le lien de réinitialisation");
  if (email) await envoyerResetPassword(email.trim());
});

// ================================
// BLOC: Session (login/logout + routeur d’affichage)
// ================================
function wireSessionButtons() {
  const btnLogin = $("btn-login");
  const btnLogout = $("btn-logout");

  if (btnLogin) {
    btnLogin.addEventListener("click", async () => {
      const email = $("login-email").value.trim();
      const pass = $("login-pass").value.trim();
      if (!email || !pass) return alert("Email et mot de passe requis.");
      try {
        await signInWithEmailAndPassword(auth, email, pass);
      } catch (e) {
        alert("Erreur de connexion: " + e.message);
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      try {
        await signOut(auth);
      } catch (e) {
        console.error(e);
      }
    });
  }
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

  // afficher bloc contact pour tous les connectés
show("bloc-contact");
await ContactBloc.init(user);

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

// Attacher les boutons après chargement DOM
document.addEventListener("DOMContentLoaded", () => {
  wireSessionButtons();
});

// Écouter l'état d'authentification
onAuthStateChanged(auth, (user) => {
  routeDisplayForUser(user);
});
