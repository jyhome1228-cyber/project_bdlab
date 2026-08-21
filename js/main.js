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
  refinementStyle.href = "./css/ui-refinement.css?v=20260821-1";
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

/*
 * Production portfolio gate.
 * Keep disabled until the Firebase backend is connected, otherwise a static
 * GitHub Pages deployment would lock clients out without a shared approval DB.
 * When backend activation is complete, switch this to true and move protected
 * portfolio assets behind authenticated/authorized storage for real security.
 */
const CLIENT_GATE_ENABLED = false;

function hasActiveClientSession() {
  try {
    const session = JSON.parse(localStorage.getItem("bdlab_client_access_v1") || "null");
    return Boolean(session && session.expiresAt && session.expiresAt > Date.now());
  } catch {
    return false;
  }
}

if (CLIENT_GATE_ENABLED) {
  const currentFile = location.pathname.split("/").pop() || "index.html";
  const isProtectedPortfolio = currentFile === "portfolio.html" || /^project-[a-z0-9-]+\.html$/i.test(currentFile);
  if (isProtectedPortfolio && !hasActiveClientSession()) {
    location.replace(`./client.html?next=${encodeURIComponent(currentFile)}`);
  }
}
