const dataApi = window.BDLabClientData;
const root = document.querySelector("#adminApp");
let currentFilter = "all";
let currentSearch = "";
let cachedRequests = [];

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "-";
  const raw = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(raw.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(raw);
}

async function hashPin(pin) {
  return dataApi.sha256(`admin:${pin}`);
}

function renderLock(mode = "login", message = "") {
  const isSetup = mode === "setup";
  root.innerHTML = `
    <section class="admin-lock">
      <p class="access-kicker">BDLab Admin</p>
      <h1>${isSetup ? "관리자 PIN 설정" : dataApi.mode === "firebase" ? "관리자 로그인" : "관리자 PIN"}</h1>
      <p class="access-note">${dataApi.mode === "firebase" ? "Firebase 관리자 계정으로 로그인합니다." : isSetup ? "이 브라우저에서 프로토타입 Admin을 보호할 PIN을 설정합니다." : "설정한 로컬 관리자 PIN을 입력해주세요."}</p>
      <form id="adminLockForm" class="access-form" style="margin-top:24px;">
        ${dataApi.mode === "firebase" ? `
          <div class="field"><label for="adminEmail">Email</label><input id="adminEmail" name="email" type="email" autocomplete="username" required></div>
          <div class="field"><label for="adminPassword">Password</label><input id="adminPassword" name="password" type="password" autocomplete="current-password" required></div>
        ` : `
          <div class="field"><label for="adminPin">PIN</label><input id="adminPin" name="pin" type="password" minlength="4" autocomplete="current-password" required></div>
          ${isSetup ? `<div class="field"><label for="adminPinConfirm">Confirm PIN</label><input id="adminPinConfirm" name="confirm" type="password" minlength="4" required></div>` : ""}
        `}
        <button class="access-submit" type="submit">${isSetup ? "PIN 저장" : "Admin 열기"}</button>
        <div id="adminLockStatus" class="access-status ${message ? "is-error" : ""}">${escapeHtml(message)}</div>
      </form>
      <p class="access-note" style="margin-top:20px;"><a href="index.html">← 사이트로 돌아가기</a></p>
    </section>`;

  root.querySelector("#adminLockForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = root.querySelector("#adminLockStatus");
    const button = event.currentTarget.querySelector("button");
    button.disabled = true;
    status.textContent = "확인 중입니다.";
    status.className = "access-status";

    try {
      if (dataApi.mode === "firebase") {
        const fd = new FormData(event.currentTarget);
        await dataApi.adminSignIn(fd.get("email"), fd.get("password"));
        await renderAdmin();
        return;
      }

      const fd = new FormData(event.currentTarget);
      const pin = String(fd.get("pin") || "");
      if (isSetup) {
        const confirm = String(fd.get("confirm") || "");
        if (pin.length < 4 || pin !== confirm) throw new Error("PIN 확인값이 일치하지 않습니다.");
        localStorage.setItem(dataApi.localAdminPinKey, await hashPin(pin));
        sessionStorage.setItem("bdlab_admin_unlocked", "1");
        await renderAdmin();
      } else {
        const saved = localStorage.getItem(dataApi.localAdminPinKey);
        if (!saved || saved !== await hashPin(pin)) throw new Error("PIN이 올바르지 않습니다.");
        sessionStorage.setItem("bdlab_admin_unlocked", "1");
        await renderAdmin();
      }
    } catch (error) {
      status.textContent = error?.message || "로그인하지 못했습니다.";
      status.className = "access-status is-error";
    } finally {
      button.disabled = false;
    }
  });
}

function requestMatches(item) {
  if (currentFilter !== "all" && item.status !== currentFilter) return false;
  const haystack = [item.company, item.name, item.email, item.phone, item.purpose].join(" ").toLowerCase();
  return !currentSearch || haystack.includes(currentSearch.toLowerCase());
}

function renderTable() {
  const tbody = root.querySelector("#clientRows");
  if (!tbody) return;
  const rows = cachedRequests.filter(requestMatches);
  tbody.innerHTML = rows.length ? rows.map((item) => `
    <tr>
      <td>${escapeHtml(item.company)}</td>
      <td><strong>${escapeHtml(item.name)}</strong><br>${escapeHtml(item.email)}<br>${escapeHtml(item.phone || "")}</td>
      <td>${escapeHtml(item.purpose || "-")}</td>
      <td><span class="status-chip ${escapeHtml(item.status || "pending")}">${escapeHtml(item.status || "pending")}</span></td>
      <td>${escapeHtml(item.accessCode || "-")}</td>
      <td>${formatDate(item.createdAt)}</td>
      <td>
        <div class="admin-actions">
          ${item.status !== "approved" ? `<button data-action="approve" data-id="${escapeHtml(item.id)}">승인</button>` : `<button data-action="copy" data-code="${escapeHtml(item.accessCode || "")}">코드 복사</button>`}
          ${item.status !== "rejected" ? `<button data-action="reject" data-id="${escapeHtml(item.id)}">거절/해제</button>` : ""}
        </div>
      </td>
    </tr>`).join("") : `<tr><td colspan="7" style="padding:34px; text-align:center; color:#777;">표시할 클라이언트 요청이 없습니다.</td></tr>`;
}

async function refreshRequests() {
  cachedRequests = await dataApi.listRequests();
  renderTable();
  const count = root.querySelector("#requestCount");
  if (count) count.textContent = `${cachedRequests.length} requests`;
}

async function renderAdmin() {
  root.innerHTML = `
    <div class="admin-topbar">
      <div>
        <p class="access-kicker">BDLab / Client Access</p>
        <h1>Client Administration</h1>
        <div class="admin-meta" id="requestCount">Loading requests...</div>
      </div>
      <div><button id="adminLogout" class="admin-action secondary" type="button">Admin 잠금</button></div>
    </div>
    ${dataApi.mode === "local" ? `<div class="admin-demo-notice"><strong>Prototype mode.</strong> 현재 등록/승인 데이터는 이 브라우저의 로컬 저장소에만 저장됩니다. 실제 클라이언트와 공유되는 운영 환경은 Firebase 설정 후 활성화됩니다.</div>` : ""}
    <div class="admin-toolbar">
      <input id="adminSearch" type="search" placeholder="회사명, 담당자, 이메일 검색">
      <select id="adminFilter"><option value="all">전체 상태</option><option value="pending">승인대기</option><option value="approved">승인</option><option value="rejected">거절/해제</option></select>
      <button id="adminRefresh" class="admin-action secondary" type="button">새로고침</button>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Company</th><th>Contact</th><th>Purpose</th><th>Status</th><th>Access Code</th><th>Requested</th><th>Actions</th></tr></thead>
        <tbody id="clientRows"></tbody>
      </table>
    </div>`;

  root.querySelector("#adminSearch")?.addEventListener("input", (event) => { currentSearch = event.target.value; renderTable(); });
  root.querySelector("#adminFilter")?.addEventListener("change", (event) => { currentFilter = event.target.value; renderTable(); });
  root.querySelector("#adminRefresh")?.addEventListener("click", refreshRequests);
  root.querySelector("#adminLogout")?.addEventListener("click", async () => {
    sessionStorage.removeItem("bdlab_admin_unlocked");
    await dataApi.adminSignOut();
    renderLock("login");
  });

  root.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    try {
      button.disabled = true;
      if (action === "approve") {
        const code = await dataApi.approveRequest(button.dataset.id);
        await navigator.clipboard?.writeText(code).catch(() => {});
        alert(`승인되었습니다. Access Code: ${code}\n복사 가능한 환경에서는 클립보드에도 저장됩니다.`);
        await refreshRequests();
      } else if (action === "reject") {
        await dataApi.rejectRequest(button.dataset.id);
        await refreshRequests();
      } else if (action === "copy") {
        await navigator.clipboard.writeText(button.dataset.code || "");
        button.textContent = "복사됨";
        setTimeout(() => { button.textContent = "코드 복사"; }, 1200);
      }
    } catch (error) {
      alert(error?.message || "처리하지 못했습니다.");
    } finally {
      button.disabled = false;
    }
  });

  await refreshRequests();
}

(async function initAdmin() {
  if (dataApi.mode === "firebase") {
    const user = await dataApi.getAdminUser();
    if (user) await renderAdmin();
    else renderLock("login");
    return;
  }

  const pinExists = Boolean(localStorage.getItem(dataApi.localAdminPinKey));
  const unlocked = sessionStorage.getItem("bdlab_admin_unlocked") === "1";
  if (!pinExists) renderLock("setup");
  else if (!unlocked) renderLock("login");
  else await renderAdmin();
})();
