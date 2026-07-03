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
