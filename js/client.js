const dataApi = window.BDLabClientData;
const requestForm = document.querySelector("#clientRequestForm");
const accessForm = document.querySelector("#clientAccessForm");
const requestStatus = document.querySelector("#requestStatus");
const accessStatus = document.querySelector("#accessStatus");
const modeNotice = document.querySelector("#dataModeNotice");

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

if (modeNotice && dataApi.mode === "local") {
  modeNotice.hidden = false;
}

if (dataApi.hasActiveAccess()) {
  setStatus(accessStatus, "이 기기에는 유효한 열람 권한이 있습니다.", "success");
  const accessButton = accessForm?.querySelector("button[type='submit']");
  if (accessButton) accessButton.textContent = "포트폴리오 바로 보기";
}

requestForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = requestForm.querySelector("button[type='submit']");
  button.disabled = true;
  setStatus(requestStatus, "등록 요청을 처리하고 있습니다.");

  const formData = new FormData(requestForm);
  const payload = {
    company: formData.get("company") || "",
    name: formData.get("name") || "",
    email: formData.get("email") || "",
    phone: formData.get("phone") || "",
    purpose: formData.get("purpose") || ""
  };

  try {
    await dataApi.submitRequest(payload);
    requestForm.reset();
    setStatus(
      requestStatus,
      dataApi.mode === "firebase"
        ? "클라이언트 등록 요청이 접수되었습니다. 승인 후 전달받은 Access Code로 포트폴리오를 확인할 수 있습니다."
        : "프로토타입 등록이 완료되었습니다. 현재는 같은 브라우저의 Admin 페이지에서 승인 흐름을 테스트할 수 있습니다.",
      "success"
    );
  } catch (error) {
    console.error(error);
    setStatus(requestStatus, "등록 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.", "error");
  } finally {
    button.disabled = false;
  }
});

accessForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (dataApi.hasActiveAccess()) {
    location.href = safeNextPath();
    return;
  }

  const input = accessForm.querySelector("#accessCode");
  const button = accessForm.querySelector("button[type='submit']");
  button.disabled = true;
  setStatus(accessStatus, "승인 정보를 확인하고 있습니다.");

  try {
    const client = await dataApi.validateCode(input.value);
    if (!client) {
      setStatus(accessStatus, "유효하지 않거나 승인되지 않은 Access Code입니다.", "error");
      return;
    }
    dataApi.grantAccess(client);
    setStatus(accessStatus, "승인되었습니다. 포트폴리오로 이동합니다.", "success");
    setTimeout(() => { location.href = safeNextPath(); }, 350);
  } catch (error) {
    console.error(error);
    setStatus(accessStatus, "승인 정보를 확인하지 못했습니다.", "error");
  } finally {
    button.disabled = false;
  }
});
