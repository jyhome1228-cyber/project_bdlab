const LOCAL_REQUESTS_KEY = "bdlab_client_requests_v1";
const LOCAL_ACCOUNTS_KEY = "bdlab_client_accounts_v2";
const LOCAL_ADMIN_PIN_KEY = "bdlab_admin_pin_hash_v1";
const ACCESS_SESSION_KEY = "bdlab_client_access_v2";
const LEGACY_ACCESS_SESSION_KEY = "bdlab_client_access_v1";

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

function readLocalAccounts() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocalAccounts(items) {
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(items));
}

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const block = () => Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `BDL-${block()}-${block()}`;
}

async function digestSha256(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(value) {
  return digestSha256(String(value).trim().toUpperCase());
}

async function sha256Exact(value) {
  return digestSha256(String(value));
}

function normalizeClientId(value) {
  return String(value || "").trim().toLowerCase();
}

function validateClientId(value) {
  const normalized = normalizeClientId(value);
  if (normalized.length < 4 || normalized.length > 30) {
    throw new Error("클라이언트 아이디는 4~30자로 입력해주세요.");
  }
  if (!/^[a-z0-9._-]+$/.test(normalized)) {
    throw new Error("클라이언트 아이디는 영문, 숫자, 점(.), 밑줄(_), 하이픈(-)만 사용할 수 있습니다.");
  }
  return normalized;
}

function validatePassword(value) {
  const password = String(value || "");
  if (password.length < 8) throw new Error("비밀번호는 8자 이상으로 설정해주세요.");
  return password;
}

const firebaseConfig = window.BDLAB_FIREBASE_CONFIG;
const hasFirebaseConfig = Boolean(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId);
let firebaseApi = null;

async function getFirebase() {
  if (!hasFirebaseConfig) return null;
  if (firebaseApi) return firebaseApi;

  const [{ initializeApp, getApps, getApp }, authModule, storeModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js")
  ]);

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = authModule.getAuth(app);
  const db = storeModule.getFirestore(app);

  firebaseApi = { auth, db, authModule, storeModule };
  return firebaseApi;
}

async function clientAuthEmail(clientId) {
  const hash = await sha256Exact(normalizeClientId(clientId));
  return `bdlab-${hash.slice(0, 32)}@client.bdlab.kr`;
}

function publicClientProfile(record) {
  return {
    id: record.id || record.uid || record.clientId || "",
    uid: record.uid || "",
    clientId: record.clientId || "",
    company: record.company || "",
    name: record.name || "",
    email: record.email || "",
    phone: record.phone || "",
    purpose: record.purpose || "",
    marketingConsent: Boolean(record.marketingConsent)
  };
}

async function registerClient(payload) {
  const clientId = validateClientId(payload.clientId);
  const password = validatePassword(payload.password);
  const record = {
    clientId,
    company: String(payload.company || "").trim(),
    name: String(payload.name || "").trim(),
    email: String(payload.email || "").trim().toLowerCase(),
    phone: String(payload.phone || "").trim(),
    purpose: String(payload.purpose || "").trim(),
    marketingConsent: Boolean(payload.marketingConsent),
    status: "registered"
  };

  const fb = await getFirebase();
  if (fb) {
    const authEmail = await clientAuthEmail(clientId);
    try {
      const credential = await fb.authModule.createUserWithEmailAndPassword(fb.auth, authEmail, password);
      const uid = credential.user.uid;
      const { doc, setDoc, addDoc, collection, serverTimestamp } = fb.storeModule;

      await setDoc(doc(fb.db, "bdlabClientProfiles", uid), {
        ...record,
        uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(fb.db, "bdlabClientRequests"), {
        ...record,
        uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return publicClientProfile({ ...record, uid, id: uid });
    } catch (error) {
      if (error?.code === "auth/email-already-in-use") {
        throw new Error("이미 사용 중인 클라이언트 아이디입니다.");
      }
      if (error?.code === "auth/operation-not-allowed") {
        throw new Error("클라이언트 계정 기능이 아직 활성화되지 않았습니다. 관리자에게 문의해주세요.");
      }
      throw error;
    }
  }

  const accounts = readLocalAccounts();
  if (accounts.some((account) => account.clientId === clientId)) {
    throw new Error("이미 사용 중인 클라이언트 아이디입니다.");
  }

  const passwordHash = await sha256Exact(password);
  const localRecord = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    ...record,
    passwordHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  accounts.unshift(localRecord);
  writeLocalAccounts(accounts);

  const requests = readLocalRequests();
  requests.unshift({
    id: localRecord.id,
    ...record,
    createdAt: localRecord.createdAt,
    updatedAt: localRecord.updatedAt
  });
  writeLocalRequests(requests);

  return publicClientProfile(localRecord);
}

async function loginClient(clientIdValue, passwordValue) {
  const clientId = validateClientId(clientIdValue);
  const password = validatePassword(passwordValue);
  const fb = await getFirebase();

  if (fb) {
    const authEmail = await clientAuthEmail(clientId);
    try {
      const credential = await fb.authModule.signInWithEmailAndPassword(fb.auth, authEmail, password);
      const { doc, getDoc } = fb.storeModule;
      const snap = await getDoc(doc(fb.db, "bdlabClientProfiles", credential.user.uid));
      if (!snap.exists()) throw new Error("클라이언트 등록 정보를 찾을 수 없습니다.");
      return publicClientProfile({ id: credential.user.uid, ...snap.data() });
    } catch (error) {
      if (["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password", "auth/invalid-login-credentials"].includes(error?.code)) {
        throw new Error("클라이언트 아이디 또는 비밀번호를 확인해주세요.");
      }
      throw error;
    }
  }

  const account = readLocalAccounts().find((item) => item.clientId === clientId);
  if (!account) throw new Error("클라이언트 아이디 또는 비밀번호를 확인해주세요.");
  const passwordHash = await sha256Exact(password);
  if (account.passwordHash !== passwordHash) {
    throw new Error("클라이언트 아이디 또는 비밀번호를 확인해주세요.");
  }
  return publicClientProfile(account);
}

/* Legacy request API retained for the existing admin page. */
async function submitRequest(payload) {
  const record = {
    company: String(payload.company || "").trim(),
    name: String(payload.name || "").trim(),
    email: String(payload.email || "").trim().toLowerCase(),
    phone: String(payload.phone || "").trim(),
    purpose: String(payload.purpose || "").trim(),
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
    id: client.id || client.uid || "",
    uid: client.uid || "",
    clientId: client.clientId || "",
    company: client.company || "",
    email: client.email || "",
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  };
  localStorage.setItem(ACCESS_SESSION_KEY, JSON.stringify(session));
  localStorage.removeItem(LEGACY_ACCESS_SESSION_KEY);
  return session;
}

function getClientSession() {
  try {
    const session = JSON.parse(localStorage.getItem(ACCESS_SESSION_KEY) || "null");
    if (!session || !session.expiresAt || session.expiresAt < Date.now()) {
      localStorage.removeItem(ACCESS_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function hasActiveAccess() {
  return Boolean(getClientSession());
}

async function logoutClient() {
  localStorage.removeItem(ACCESS_SESSION_KEY);
  const fb = await getFirebase();
  if (fb?.auth?.currentUser) await fb.authModule.signOut(fb.auth);
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
  registerClient,
  loginClient,
  logoutClient,
  getClientSession,
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
