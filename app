// === 1) Config Firebase (remplace par ta config) ===
const firebaseConfig = {
  apiKey: "REMPLACE",
  authDomain: "REMPLACE.firebaseapp.com",
  projectId: "REMPLACE",
  storageBucket: "REMPLACE.appspot.com",
  messagingSenderId: "REMPLACE",
  appId: "REMPLACE"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// === 2) Définir les admins (mets ton email ici) ===
const ADMINS = ["ton.email@exemple.com"];

// Utilitaires
const $ = (id) => document.getElementById(id);
const tabButtons = document.querySelectorAll("nav button");
const tabs = document.querySelectorAll(".tab");

function showTab(name) {
  tabs.forEach(t => t.style.display = (t.id === name ? "block" : "none"));
}
showTab("agenda"); // onglet par défaut

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => showTab(btn.dataset.tab));
});

// === 3) Auth ===
const authEmail = $("auth-email");
const authPass = $("auth-pass");
$("btn-login").onclick = async () => {
  try {
    await auth.signInWithEmailAndPassword(authEmail.value, authPass.value);
  } catch (e) { $("auth-status").textContent = e.message; }
};
$("btn-register").onclick = async () => {
  try {
    await auth.createUserWithEmailAndPassword(authEmail.value, authPass.value);
  } catch (e) { $("auth-status").textContent = e.message; }
};
$("btn-logout").onclick = async () => { await auth.signOut(); };

let currentUser = null;
auth.onAuthStateChanged(async (user) => {
  currentUser = user;
  $("user-info").textContent = user ? `Connecté: ${user.email}` : "Non connecté";
  $("btn-logout").style.display = user ? "inline-block" : "none";

  const isAdmin = user && ADMINS.includes(user.email);
  document.querySelectorAll("#event-form, #photo-form, #insc-admin, #med-admin")
    .forEach(el => el.classList.toggle("hidden", !isAdmin));

  loadEvents();
  loadAlbums();
  loadChildren();
  loadPublicChat();
  loadPrivateChat();
});

// === 4) Agenda ===
async function loadEvents() {
  const container = $("events-list");
  container.innerHTML = "";
  const snap = await db.collection("events").orderBy("date", "asc").get();
  snap.forEach(doc => {
    const ev = doc.data();
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${ev.title} – ${ev.date}</h3>
      ${ev.imageUrl ? `<img src="${ev.imageUrl}" alt="" style="max-width:100%;border-radius:8px;" />` : ""}
      <p>${ev.desc || ""}</p>
    `;
    container.appendChild(card);
  });
}

$("ev-save").onclick = async () => {
  const title = $("ev-title").value.trim();
  const date = $("ev-date").value;
  const desc = $("ev-desc").value.trim();
  const file = $("ev-image").files[0];
  let imageUrl = "";

  if (!title || !date) { alert("Titre et date requis"); return; }

  if (file) {
    const ref = storage.ref().child(`events/${Date.now()}_${file.name}`);
    await ref.put(file);
    imageUrl = await ref.getDownloadURL();
  }

  await db.collection("events").add({ title, date, desc, imageUrl, createdBy: currentUser.email });
  $("ev-title").value = ""; $("ev-date").value = ""; $("ev-desc").value = ""; $("ev-image").value = "";
  loadEvents();
};

// === 5) Photos ===
async function loadAlbums() {
  const container = $("album-list");
  container.innerHTML = "";
  const snap = await db.collection("photos").orderBy("createdAt", "desc").get();
  snap.forEach(doc => {
    const ph = doc.data();
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${ph.activity || "Activité"}</h3>
      ${ph.url ? `<img src="${ph.url}" alt="" style="max-width:100%;border-radius:8px;" />` : ""}
      <p>${ph.desc || ""}</p>
    `;
    container.appendChild(card);
  });
}

$("ph-upload").onclick = async () => {
  const activity = $("ph-activity").value.trim();
  const desc = $("ph-desc").value.trim();
  const file = $("ph-file").files[0];
  if (!file) { alert("Sélectionne une image"); return; }
  const ref = storage.ref().child(`photos/${Date.now()}_${file.name}`);
  await ref.put(file);
  const url = await ref.getDownloadURL();
  await db.collection("photos").add({ activity, desc, url, createdAt: Date.now(), by: currentUser.email });
  $("ph-activity").value = ""; $("ph-desc").value = ""; $("ph-file").value = "";
  loadAlbums();
};

// === 6) Inscriptions (enfants liés aux parents) ===
async function loadChildren() {
  const ul = $("children-list");
  ul.innerHTML = "";
  if (!currentUser) return;
  const snap = await db.collection("children").where("parentEmail", "==", currentUser.email).get();
  snap.forEach(doc => {
    const c = doc.data();
    const li = document.createElement("li");
    li.textContent = `${c.name}`;
    ul.appendChild(li);
  });
}

$("child-add").onclick = async () => {
  const name = $("child-name").value.trim();
  const parentEmail = $("child-parent-email").value.trim();
  if (!name || !parentEmail) { alert("Nom et email du parent requis"); return; }
  await db.collection("children").add({ name, parentEmail, createdBy: currentUser.email, createdAt: Date.now() });
  $("child-name").value = ""; $("child-parent-email").value = "";
  loadChildren();
};

// === 7) Chat public ===
async function loadPublicChat() {
  const box = $("pub-messages");
  box.innerHTML = "";
  db.collection("chat_public").orderBy("createdAt", "asc").onSnapshot(snap => {
    box.innerHTML = "";
    snap.forEach(doc => {
      const m = doc.data();
      const div = document.createElement("div");
      div.className = "message";
      div.textContent = `${m.sender}: ${m.text}`;
      box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
  });
}
$("pub-send").onclick = async () => {
  const text = $("pub-input").value.trim();
  if (!text || !currentUser) return;
  await db.collection("chat_public").add({ text, sender: currentUser.email, createdAt: Date.now() });
  $("pub-input").value = "";
};

// === 8) Chat privé (admin ↔ parent) ===
async function loadPrivateChat() {
  const box = $("priv-messages");
  box.innerHTML = "";
  if (!currentUser) return;
  // canal privé unique par utilisateur (admin et parent)
  const channelId = privateChannelId(currentUser.email);
  db.collection("chat_private").doc(channelId).collection("messages")
    .orderBy("createdAt", "asc").onSnapshot(snap => {
      box.innerHTML = "";
      snap.forEach(doc => {
        const m = doc.data();
        const div = document.createElement("div");
        div.className = "message";
        div.textContent = `${m.sender}: ${m.text}`;
        box.appendChild(div);
      });
      box.scrollTop = box.scrollHeight;
    });
}

function privateChannelId(userEmail) {
  // canal = adminEmail + userEmail triés pour cohérence
  const admin = ADMINS[0];
  const arr = [admin, userEmail].sort();
  return arr.join("__");
}

$("priv-send").onclick = async () => {
  if (!currentUser) return;
  const text = $("priv-input").value.trim();
  if (!text) return;
  const channelId = privateChannelId(currentUser.email);
  await db.collection("chat_private").doc(channelId).collection("messages")
    .add({ text, sender: currentUser.email, createdAt: Date.now() });
  $("priv-input").value = "";
};

// === 9) Fiche médicale (chiffrement côté client) ===
// Clé admin mémorisée en variable (pour prototype). Pour plus de sécurité, demande la clé à l'admin à chaque session.
const MEDICAL_SECRET = "change-moi-une-cle-solide";

async function getCryptoKey(secret) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "PBKDF2" }, false, ["deriveKey"]);
  const salt = enc.encode("patro-salt"); // fixe pour prototype
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptText(text, secret) {
  const key = await getCryptoKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return { iv: Array.from(iv), data: Array.from(new Uint8Array(cipher)) };
}

async function decryptText(payload, secret) {
  try {
    const key = await getCryptoKey(secret);
    const iv = new Uint8Array(payload.iv);
    const data = new Uint8Array(payload.data);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return new TextDecoder().decode(plain);
  } catch (e) {
    return "Impossible de déchiffrer (clé incorrecte).";
  }
}

$("med-save").onclick = async () => {
  const child = $("med-child").value.trim();
  const data = $("med-data").value.trim();
  if (!child || !data) { alert("Nom et données requises"); return; }
  const payload = await encryptText(data, MEDICAL_SECRET);
  await db.collection("medical").doc(child).set({
    child, payload, updatedAt: Date.now(), by: currentUser.email
  });
  $("med-child").value = ""; $("med-data").value = "";
  alert("Fiche médicale enregistrée (chiffrée).");
};

$("med-load").onclick = async () => {
  const child = $("med-view-child").value.trim();
  if (!child) return;
  const doc = await db.collection("medical").doc(child).get();
  if (!doc.exists) { $("med-output").textContent = "Aucune fiche."; return; }
  const payload = doc.data().payload;
  const text = await decryptText(payload, MEDICAL_SECRET);
  $("med-output").textContent = text;
};

// === 10) Sécurité côté interface ===
document.addEventListener("DOMContentLoaded", () => {
  // Affichage admin/parent géré par onAuthStateChanged
});
