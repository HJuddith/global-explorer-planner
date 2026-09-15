/**
 * navbar.js
 * Navbar qui réagit au défilement (TP2) : ombre + opacité de fond au scroll.
 */

const navbar = document.getElementById("navbar");
const SCROLL_THRESHOLD = 12;

export function initNavbar({ onSearch } = {}) {
  const update = () => {
    navbar.classList.toggle("navbar--scrolled", window.scrollY > SCROLL_THRESHOLD);
  };
  update();
  window.addEventListener("scroll", update, { passive: true });

  const form = document.getElementById("navbar-search-form");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = document.getElementById("navbar-search-input").value.trim();
    if (value && typeof onSearch === "function") onSearch(value);
  });
}
