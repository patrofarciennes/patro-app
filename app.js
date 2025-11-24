// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBJtxq8jASxxMrAs4a-_B8LJ2TUjoADYtU",
  authDomain: "patrofarcienes.firebaseapp.com",
  projectId: "patrofarcienes",
  storageBucket: "patrofarcienes.appspot.com",
  messagingSenderId: "659827925488",
  appId: "1:659827925488:web:6d609438248cc9c65f7d35"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔒 Récupérer rôle utilisateur
async function getUserRole(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data().role;
  } else {
    return null;
  }
}

// 🎯 Gestion connexion/déconnexion
onAuthStateChanged(auth, async (user) => {
  if (user) {
    document.getElementById("connexion").classList.add("hidden");
    document.getElementById("agenda").classList.remove("hidden");

    const role = await getUserRole(user.uid);
    if (role === "admin") {
      document.getElementById("adminPanel").classList.remove("hidden");
    } else if (role === "animateur") {
      document.getElementById("animateurPanel").classList.remove("hidden");
    } else if (role === "parent") {
      document.getElementById("parentPanel").classList.remove("hidden");
    } else if (role === "enfant") {
      document.getElementById("enfantPanel").classList.remove("hidden");
    }
  } else {
    document.getElementById("connexion").classList.remove("hidden");
    document.getElementById("agenda").classList.add("hidden");
    document.getElementById("adminPanel").classList.add("hidden");
    document.getElementById("animateurPanel").classList.add("hidden");
    document.getElementById("parentPanel").classList.add("hidden");
    document.getElementById("enfantPanel").classList.add("hidden");
  }
});

// 🔑 Connexion
window.login = async function() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Connexion réussie !");
  } catch (error) {
    alert("Erreur : " + error.message);
  }
};

// 🚪 Déconnexion
window.logout = async function() {
  await signOut(auth);
  alert("Déconnecté !");
};

// 📌 Exemple : créer un utilisateur avec rôle (par admin)
window.createUser = async function(uid, role, section) {
  await setDoc(doc(db, "users", uid), {
    role: role,
    section: section
  });
};
