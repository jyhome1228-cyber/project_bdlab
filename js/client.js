const dataApi = window.BDLabClientData;
const requestForm = document.querySelector("#clientRequestForm");
const requestStatus = document.querySelector("#requestStatus");

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

requestForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = requestForm.querySelector("button[type='submit']");
  button.disabled = true;
  setStatus(requestStatus, "클라이언트 등록을 처리하고 있습니다.");

  const formData = new FormData(requestForm);
  const payload = {
    company: formData.get("company") || "",
    name: formData.get("name") || "",
    email: formData.get("email") || "",
    phone: formData.get("phone") || "",
    purpose: formData.get("purpose") || "",
    marketingConsent: formData.get("marketingConsent") === "yes"
  };

  try {
    const client = await dataApi.submitRequest(payload);
    dataApi.grantAccess(client);
    requestForm.reset();
    setStatus(requestStatus, "등록이 완료되었습니다. 포트폴리오로 이동합니다.", "success");
    setTimeout(() => {
      location.href = safeNextPath();
    }, 700);
  } catch (error) {
    console.error(error);
    setStatus(requestStatus, "등록을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.", "error");
    button.disabled = false;
  }
});
