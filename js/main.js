// BDLab Main Script

const menuButton = document.querySelector(".bd-menu-button");
const headerNav = document.querySelector(".bd-header-nav");

if (menuButton && headerNav) {
  menuButton.addEventListener("click", () => {
    headerNav.classList.toggle("is-open");
    menuButton.classList.toggle("is-active");
  });
}
