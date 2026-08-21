const dataApi = window.BDLabClientData;
const requestForm = document.querySelector("#clientRequestForm");
const loginForm = document.querySelector("#clientLoginForm");
const requestStatus = document.querySelector("#requestStatus");
const loginStatus = document.querySelector("#loginStatus");

function safeNextPath() {
  const next = new URLSearchParams(location.search).get("next") || "portfolio.html";
  if (/^(\.\/)?(portfolio\.html|project-[a-z0-9-]+\.html)$/i.test(next)) return next.replace(/^\.\//, "");
  return "portfolio.html";
}

function setStatus(element, message, type = "") {
  if (!element) return;
  element.textContent = message;
  element.className = `access-status${type ? ` is-${type}` : ""}`;
}

if (new URLSearchParams(location.search).get("reason") === "portfolio") {
  setStatus(loginStatus, "포트폴리오 상세 열람을 위해 먼저 로그인하거나 클라이언트 등록을 진행해주세요.");
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = loginForm.querySelector("button[type='submit']");
  const formData = new FormData(loginForm);
  button.disabled = true;
  setStatus(loginStatus, "로그인 정보를 확인하고 있습니다.");

  try {
    const client = await dataApi.loginClient(
      formData.get("clientId") || "",
      formData.get("password") || ""
    );
    dataApi.grantAccess(client);
    setStatus(loginStatus, "로그인되었습니다. 포트폴리오로 이동합니다.", "success");
    setTimeout(() => { location.href = safeNextPath(); }, 350);
  } catch (error) {
    console.error(error);
    setStatus(loginStatus, error?.message || "아이디 또는 비밀번호를 확인해주세요.", "error");
    button.disabled = false;
  }
});

requestForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = requestForm.querySelector("button[type='submit']");
  const formData = new FormData(requestForm);
  const password = String(formData.get("password") || "");
  const passwordConfirm = String(formData.get("passwordConfirm") || "");

  if (password !== passwordConfirm) {
    setStatus(requestStatus, "비밀번호 확인이 일치하지 않습니다.", "error");
    return;
  }

  button.disabled = true;
  setStatus(requestStatus, "클라이언트 계정을 등록하고 있습니다.");

  const payload = {
    clientId: formData.get("clientId") || "",
    password,
    company: formData.get("company") || "",
    name: formData.get("name") || "",
    email: formData.get("email") || "",
    phone: formData.get("phone") || "",
    purpose: formData.get("purpose") || "",
    marketingConsent: formData.get("marketingConsent") === "yes"
  };

  try {
    const client = await dataApi.registerClient(payload);
    dataApi.grantAccess(client);
    requestForm.reset();
    setStatus(requestStatus, "클라이언트 등록이 완료되었습니다. 포트폴리오로 이동합니다.", "success");
    setTimeout(() => {
      location.href = safeNextPath();
    }, 500);
  } catch (error) {
    console.error(error);
    setStatus(requestStatus, error?.message || "등록을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.", "error");
    button.disabled = false;
  }
});
