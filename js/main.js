const faviconUrl = "https://cdn.imweb.me/upload/S20251008dcc1c9d70e3ac/e3736b2d58706.png";

if (!document.querySelector('link[rel="icon"]')) {
  const faviconLink = document.createElement("link");
  faviconLink.rel = "icon";
  faviconLink.type = "image/png";
  faviconLink.href = faviconUrl;
  document.head.appendChild(faviconLink);
}

if (!document.querySelector('link[data-bdlab-style="altos"]')) {
  const altosStyle = document.createElement("link");
  altosStyle.rel = "stylesheet";
  altosStyle.href = "./css/altos.css?v=20260821-1";
  altosStyle.dataset.bdlabStyle = "altos";
  document.head.appendChild(altosStyle);
}

if (!document.querySelector('link[data-bdlab-style="ui-refinement"]')) {
  const refinementStyle = document.createElement("link");
  refinementStyle.rel = "stylesheet";
  refinementStyle.href = "./css/ui-refinement.css?v=20260821-3";
  refinementStyle.dataset.bdlabStyle = "ui-refinement";
  document.head.appendChild(refinementStyle);
}

const blackAccentStyle = document.createElement("style");
blackAccentStyle.setAttribute("data-bdlab-accent", "black");
blackAccentStyle.textContent = `
  :root {
    --bd-red: #0b0b0b !important;
  }

  [style*="color:#f2180b" i],
  [style*="color: #f2180b" i],
  [style*="color:#ff0000" i],
  [style*="color: #ff0000" i],
  [style*="color:red" i],
  [style*="color: red" i] {
    color: #0b0b0b !important;
  }

  .bd-button.red {
    background: #0b0b0b !important;
    border-color: #0b0b0b !important;
  }
`;
document.head.appendChild(blackAccentStyle);

const menuButton = document.querySelector(".bd-menu-button");
const headerNav = document.querySelector(".bd-header-nav");
const headerRight = document.querySelector(".bd-header-right");

/* Home remains accessible through the logo, so remove it from the main menu. */
headerNav?.querySelectorAll('a[href$="index.html"]').forEach((link) => link.remove());

/* Client belongs in the right utility area as a CTA, not in the main menu. */
headerNav?.querySelectorAll('a[href$="client.html"]').forEach((link) => link.remove());

if (headerRight) {
  Array.from(headerRight.children)
    .filter((child) => child.tagName === "SPAN")
    .forEach((label) => label.remove());

  let clientCta = headerRight.querySelector(".bd-client-cta");
  if (!clientCta) {
    clientCta = document.createElement("a");
    clientCta.href = "./client.html";
    clientCta.textContent = "Client";
    clientCta.className = "bd-client-cta";
    headerRight.insertBefore(clientCta, menuButton || null);
  }

  const currentFile = location.pathname.split("/").pop() || "index.html";
  if (currentFile === "client.html") clientCta.classList.add("is-active");
}

function closeMobileMenu() {
  headerNav?.classList.remove("is-open");
  menuButton?.classList.remove("is-active");
  menuButton?.setAttribute("aria-expanded", "false");
}

if (menuButton && headerNav) {
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.addEventListener("click", () => {
    const willOpen = !headerNav.classList.contains("is-open");
    headerNav.classList.toggle("is-open", willOpen);
    menuButton.classList.toggle("is-active", willOpen);
    menuButton.setAttribute("aria-expanded", String(willOpen));
  });

  headerNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMobileMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) closeMobileMenu();
  });
}

/* ================================
   Editorial image refresh
================================ */
const BDLAB_EDITORIAL_IMAGES = [
  "https://cdn.imweb.me/upload/S20251008dcc1c9d70e3ac/927fb68a65baf.png",
  "https://cdn.imweb.me/upload/S20251008dcc1c9d70e3ac/36b0ab8b2f076.png",
  "https://cdn.imweb.me/upload/S20251008dcc1c9d70e3ac/8a53a0f084c02.png",
  "https://cdn.imweb.me/upload/S20251008dcc1c9d70e3ac/0423129b134a8.png",
  "https://cdn.imweb.me/upload/S20251008dcc1c9d70e3ac/e3d9d73b68aab.png",
  "https://cdn.imweb.me/upload/S20251008dcc1c9d70e3ac/45603bc5f2ff4.png",
  "https://cdn.imweb.me/upload/S20251008dcc1c9d70e3ac/7a33df2ffe5fe.png",
  "https://cdn.imweb.me/upload/S20251008dcc1c9d70e3ac/2ece43d17d334.png",
  "https://cdn.imweb.me/upload/S20251008dcc1c9d70e3ac/efa3168c99c98.png",
  "https://cdn.imweb.me/upload/S20251008dcc1c9d70e3ac/d93a1c79c10ca.png",
  "https://cdn.imweb.me/upload/S20251008dcc1c9d70e3ac/59191f44392aa.png",
  "https://cdn.imweb.me/upload/S20251008dcc1c9d70e3ac/af2bb8af0e691.jpeg"
];

function setEditorialImage(selector, src, alt) {
  const image = document.querySelector(selector);
  if (!image) return;
  image.src = src;
  image.removeAttribute("srcset");
  image.removeAttribute("sizes");
  if (alt) image.alt = alt;
}

const currentPage = location.pathname.split("/").pop() || "index.html";
const isPortfolioPage = currentPage === "portfolio.html" || /^project-[a-z0-9-]+\.html$/i.test(currentPage);

if (!isPortfolioPage) {
  const pageImageMap = {
    "index.html": [
      [".bd-page-hero .bd-page-visual img", BDLAB_EDITORIAL_IMAGES[0], "BDLab Editorial Visual 01"],
      ['img[alt="BDLab Glocal Visual"]', BDLAB_EDITORIAL_IMAGES[1], "BDLab Editorial Visual 02"],
      ['img[alt="Portfolio Preview 01"]', BDLAB_EDITORIAL_IMAGES[8], "BDLab Portfolio Preview 01"],
      ['img[alt="Portfolio Preview 02"]', BDLAB_EDITORIAL_IMAGES[9], "BDLab Portfolio Preview 02"]
    ],
    "about.html": [
      [".bd-page-hero .bd-page-visual img", BDLAB_EDITORIAL_IMAGES[2], "BDLab About Visual"],
      ['img[alt="BDLab Brand System"]', BDLAB_EDITORIAL_IMAGES[3], "BDLab Brand System Visual"],
      ['img[alt="BDLab Identity Application"]', BDLAB_EDITORIAL_IMAGES[4], "BDLab Identity Application Visual"]
    ],
    "research.html": [
      [".bd-page-hero .bd-page-visual img", BDLAB_EDITORIAL_IMAGES[5], "BDLab Research Visual"],
      ['img[alt="BDLab Design Research Visual"]', BDLAB_EDITORIAL_IMAGES[6], "BDLab Design Research Visual"]
    ],
    "contact.html": [
      [".bd-page-hero .bd-page-visual img", BDLAB_EDITORIAL_IMAGES[7], "BDLab Contact Visual"]
    ]
  };

  (pageImageMap[currentPage] || []).forEach(([selector, src, alt]) => {
    setEditorialImage(selector, src, alt);
  });
}

/* Keep the footer identity synchronized with the current header identity. */
const footerLogo = document.querySelector(".bd-footer-brand img");
if (footerLogo) {
  footerLogo.src = "./assets/bdlab-logo.svg";
  footerLogo.classList.add("bd-footer-current-logo");
  footerLogo.alt = "BDLab Branding Design Lab";
}

/* ================================
   Client portfolio gate
================================ */
const CLIENT_SESSION_KEY = "bdlab_client_access_v2";
const LEGACY_SESSION_KEY = "bdlab_client_access_v1";
let pendingPortfolioTarget = "portfolio.html";

function readClientSession() {
  const keys = [CLIENT_SESSION_KEY, LEGACY_SESSION_KEY];
  for (const key of keys) {
    try {
      const session = JSON.parse(localStorage.getItem(key) || "null");
      if (session && session.expiresAt && session.expiresAt > Date.now()) return session;
      if (session) localStorage.removeItem(key);
    } catch {
      localStorage.removeItem(key);
    }
  }
  return null;
}

function hasActiveClientSession() {
  return Boolean(readClientSession());
}

function portfolioFileFromUrl(href) {
  try {
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) return null;
    const file = url.pathname.split("/").pop() || "index.html";
    if (file === "portfolio.html" || /^project-[a-z0-9-]+\.html$/i.test(file)) return file;
  } catch {
    return null;
  }
  return null;
}

function loadScriptOnce(src, key) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-bdlab-loader="${key}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") resolve();
      else existing.addEventListener("load", resolve, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.dataset.bdlabLoader = key;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.head.appendChild(script);
  });
}

async function ensureClientDataApi() {
  if (window.BDLabClientData) return window.BDLabClientData;
  await loadScriptOnce("./js/firebase-config.js", "firebase-config");
  if (!window.BDLabClientData) {
    await loadScriptOnce("./js/client-data.js", "client-data");
  }
  return window.BDLabClientData;
}

function ensurePortfolioModal() {
  let modal = document.querySelector("#portfolioClientModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "portfolioClientModal";
  modal.className = "client-gate-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="client-gate-backdrop" data-client-modal-close></div>
    <section class="client-gate-dialog" role="dialog" aria-modal="true" aria-labelledby="clientGateTitle">
      <button class="client-gate-close" type="button" aria-label="닫기" data-client-modal-close>×</button>
      <p class="client-gate-kicker">Client Portfolio</p>
      <h2 id="clientGateTitle">포트폴리오 상세 열람은<br>클라이언트 등록 후 가능합니다.</h2>
      <p class="client-gate-copy">등록된 클라이언트는 아이디와 비밀번호로 로그인해 BDLab의 포트폴리오를 자세히 확인할 수 있습니다.</p>

      <form id="quickClientLoginForm" class="client-gate-login">
        <label>
          <span>Client ID</span>
          <input name="clientId" autocomplete="username" required placeholder="클라이언트 아이디" />
        </label>
        <label>
          <span>Password</span>
          <input name="password" type="password" autocomplete="current-password" required placeholder="비밀번호" />
        </label>
        <button type="submit">로그인 후 포트폴리오 보기</button>
        <p class="client-gate-status" aria-live="polite"></p>
      </form>

      <div class="client-gate-divider"><span>OR</span></div>
      <a class="client-gate-register" href="./client.html">클라이언트 등록하기</a>
    </section>
  `;

  document.body.appendChild(modal);

  modal.querySelectorAll("[data-client-modal-close]").forEach((button) => {
    button.addEventListener("click", () => closePortfolioModal());
  });

  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePortfolioModal();
  });

  const loginForm = modal.querySelector("#quickClientLoginForm");
  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = loginForm.querySelector("button[type='submit']");
    const status = loginForm.querySelector(".client-gate-status");
    const formData = new FormData(loginForm);

    button.disabled = true;
    status.textContent = "로그인 정보를 확인하고 있습니다.";
    status.className = "client-gate-status";

    try {
      const api = await ensureClientDataApi();
      if (!api?.loginClient) throw new Error("클라이언트 로그인 기능을 불러오지 못했습니다.");
      const client = await api.loginClient(formData.get("clientId") || "", formData.get("password") || "");
      api.grantAccess(client);
      status.textContent = "로그인되었습니다. 포트폴리오로 이동합니다.";
      status.className = "client-gate-status is-success";
      setTimeout(() => {
        location.href = pendingPortfolioTarget || "portfolio.html";
      }, 300);
    } catch (error) {
      console.error(error);
      status.textContent = error?.message || "아이디 또는 비밀번호를 확인해주세요.";
      status.className = "client-gate-status is-error";
      button.disabled = false;
    }
  });

  return modal;
}

function openPortfolioModal(target = "portfolio.html") {
  pendingPortfolioTarget = target;
  const modal = ensurePortfolioModal();
  const registerLink = modal.querySelector(".client-gate-register");
  if (registerLink) registerLink.href = `./client.html?next=${encodeURIComponent(target)}`;
  modal.hidden = false;
  document.body.classList.add("client-modal-open");
  requestAnimationFrame(() => modal.classList.add("is-open"));
  setTimeout(() => modal.querySelector('input[name="clientId"]')?.focus(), 80);
}

function closePortfolioModal() {
  const modal = document.querySelector("#portfolioClientModal");
  if (!modal) return;
  modal.classList.remove("is-open");
  document.body.classList.remove("client-modal-open");
  setTimeout(() => { modal.hidden = true; }, 180);
}

/* Clicking any Portfolio or project link asks for client login/registration first. */
document.addEventListener("click", (event) => {
  const anchor = event.target.closest("a[href]");
  if (!anchor || anchor.hasAttribute("download") || anchor.target === "_blank") return;

  const portfolioTarget = portfolioFileFromUrl(anchor.getAttribute("href"));
  if (!portfolioTarget || hasActiveClientSession()) return;

  event.preventDefault();
  closeMobileMenu();
  openPortfolioModal(portfolioTarget);
}, true);

/* Direct URL access still routes through client registration/login. */
if (isPortfolioPage && !hasActiveClientSession()) {
  location.replace(`./client.html?next=${encodeURIComponent(currentPage)}&reason=portfolio`);
}
