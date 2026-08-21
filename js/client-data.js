const LOCAL_REQUESTS_KEY = "bdlab_client_requests_v1";
const LOCAL_ADMIN_PIN_KEY = "bdlab_admin_pin_hash_v1";
const ACCESS_SESSION_KEY = "bdlab_client_access_v1";

function readLocalRequests() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_REQUESTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocalRequests(items) {
  localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(items));
}

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const block = () => Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `BDL-${block()}-${block()}`;
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(String(value).trim().toUpperCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const firebaseConfig = window.BDLAB_FIREBASE_CONFIG;
const hasFirebaseConfig = Boolean(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId);
let firebaseApi = null;

async function getFirebase() {
  if (!hasFirebaseConfig) return null;
  if (firebaseApi) return firebaseApi;

  const [{ initializeApp }, authModule, storeModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js")
  ]);

  const app = initializeApp(firebaseConfig);
  const auth = authModule.getAuth(app);
  const db = storeModule.getFirestore(app);

  firebaseApi = { auth, db, authModule, storeModule };
  return firebaseApi;
}

async function submitRequest(payload) {
  const record = {
    company: payload.company.trim(),
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone.trim(),
    purpose: payload.purpose.trim(),
    marketingConsent: Boolean(payload.marketingConsent),
    status: "pending"
  };

  const fb = await getFirebase();
  if (fb) {
    const { addDoc, collection, serverTimestamp } = fb.storeModule;
    const ref = await addDoc(collection(fb.db, "bdlabClientRequests"), {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: ref.id, ...record };
  }

  const items = readLocalRequests();
  const localRecord = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    ...record,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accessCode: ""
  };
  items.unshift(localRecord);
  writeLocalRequests(items);
  return localRecord;
}

async function listRequests() {
  const fb = await getFirebase();
  if (fb) {
    const { collection, getDocs, query, orderBy } = fb.storeModule;
    const snap = await getDocs(query(collection(fb.db, "bdlabClientRequests"), orderBy("createdAt", "desc")));
    return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  }
  return readLocalRequests();
}

async function approveRequest(id) {
  const code = randomCode();
  const hash = await sha256(code);
  const fb = await getFirebase();

  if (fb) {
    const { doc, getDoc, setDoc, updateDoc, serverTimestamp } = fb.storeModule;
    const reqRef = doc(fb.db, "bdlabClientRequests", id);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) throw new Error("요청을 찾을 수 없습니다.");
    const requestData = reqSnap.data();

    await setDoc(doc(fb.db, "bdlabAccess", hash), {
      active: true,
      clientId: id,
      company: requestData.company || "",
      email: requestData.email || "",
      createdAt: serverTimestamp()
    });

    await updateDoc(reqRef, {
      status: "approved",
      accessCode: code,
      accessHash: hash,
      updatedAt: serverTimestamp()
    });
    return code;
  }

  const items = readLocalRequests();
  const target = items.find((item) => item.id === id);
  if (!target) throw new Error("요청을 찾을 수 없습니다.");
  target.status = "approved";
  target.accessCode = code;
  target.accessHash = hash;
  target.updatedAt = new Date().toISOString();
  writeLocalRequests(items);
  return code;
}

async function rejectRequest(id) {
  const fb = await getFirebase();
  if (fb) {
    const { doc, getDoc, deleteDoc, updateDoc, serverTimestamp } = fb.storeModule;
    const reqRef = doc(fb.db, "bdlabClientRequests", id);
    const snap = await getDoc(reqRef);
    if (snap.exists() && snap.data().accessHash) {
      await deleteDoc(doc(fb.db, "bdlabAccess", snap.data().accessHash));
    }
    await updateDoc(reqRef, { status: "rejected", accessCode: "", accessHash: "", updatedAt: serverTimestamp() });
    return;
  }

  const items = readLocalRequests();
  const target = items.find((item) => item.id === id);
  if (!target) return;
  target.status = "rejected";
  target.accessCode = "";
  target.accessHash = "";
  target.updatedAt = new Date().toISOString();
  writeLocalRequests(items);
}

async function validateCode(code) {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) return null;
  const hash = await sha256(normalized);
  const fb = await getFirebase();

  if (fb) {
    const { doc, getDoc } = fb.storeModule;
    const snap = await getDoc(doc(fb.db, "bdlabAccess", hash));
    if (!snap.exists() || snap.data().active !== true) return null;
    return { ...snap.data(), code: normalized };
  }

  const match = readLocalRequests().find((item) => item.status === "approved" && item.accessHash === hash);
  if (!match) return null;
  return { clientId: match.id, company: match.company, email: match.email, code: normalized };
}

function grantAccess(client) {
  const session = {
    clientId: client.clientId || client.id || "",
    company: client.company || "",
    email: client.email || "",
    expiresAt: Date.now() + 12 * 60 * 60 * 1000
  };
  localStorage.setItem(ACCESS_SESSION_KEY, JSON.stringify(session));
  return session;
}

function hasActiveAccess() {
  try {
    const session = JSON.parse(localStorage.getItem(ACCESS_SESSION_KEY) || "null");
    if (!session || !session.expiresAt || session.expiresAt < Date.now()) {
      localStorage.removeItem(ACCESS_SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function adminSignIn(email, password) {
  const fb = await getFirebase();
  if (!fb) return null;
  return fb.authModule.signInWithEmailAndPassword(fb.auth, email, password);
}

async function adminSignOut() {
  const fb = await getFirebase();
  if (!fb) return;
  return fb.authModule.signOut(fb.auth);
}

async function getAdminUser() {
  const fb = await getFirebase();
  if (!fb) return null;
  return new Promise((resolve) => {
    const unsub = fb.authModule.onAuthStateChanged(fb.auth, (user) => {
      unsub();
      resolve(user);
    });
  });
}

window.BDLabClientData = {
  mode: hasFirebaseConfig ? "firebase" : "local",
  submitRequest,
  listRequests,
  approveRequest,
  rejectRequest,
  validateCode,
  grantAccess,
  hasActiveAccess,
  adminSignIn,
  adminSignOut,
  getAdminUser,
  sha256,
  localAdminPinKey: LOCAL_ADMIN_PIN_KEY,
  accessSessionKey: ACCESS_SESSION_KEY
};
