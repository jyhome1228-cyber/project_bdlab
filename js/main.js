const faviconUrl = "https://cdn.imweb.me/upload/S20251008dcc1c9d70e3ac/e3736b2d58706.png";

if (!document.querySelector('link[rel="icon"]')) {
  const faviconLink = document.createElement("link");
  faviconLink.rel = "icon";
  faviconLink.type = "image/png";
  faviconLink.href = faviconUrl;
  document.head.appendChild(faviconLink);
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

if (menuButton && headerNav) {
  menuButton.addEventListener("click", () => {
    headerNav.classList.toggle("is-open");
    menuButton.classList.toggle("is-active");
  });

  const navLinks = headerNav.querySelectorAll("a");

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      headerNav.classList.remove("is-open");
      menuButton.classList.remove("is-active");
    });
  });
}
