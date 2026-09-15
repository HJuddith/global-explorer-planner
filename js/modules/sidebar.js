/**
 * sidebar.js
 * Sidebar responsive (TP4) : tiroir coulissant sur mobile, barre fixe réductible
 * sur desktop, et gestion de la navigation entre les vues (sections) du dashboard.
 */

import { saveData, loadData } from "./storage.js";

const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("sidebar-backdrop");
const toggleBtn = document.getElementById("sidebar-toggle");
const collapseBtn = document.getElementById("sidebar-collapse");
const links = Array.from(document.querySelectorAll(".sidebar__link"));
const views = Array.from(document.querySelectorAll(".view"));

let onViewChange = null;

export function initSidebar({ onChange } = {}) {
  onViewChange = onChange;

  toggleBtn?.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("is-open");
    backdrop.classList.toggle("is-visible", isOpen);
    toggleBtn.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) links[0]?.focus();
  });

  backdrop?.addEventListener("click", () => closeMobileDrawer());

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMobileDrawer();
  });

  collapseBtn?.addEventListener("click", () => {
    const collapsed = sidebar.classList.toggle("is-collapsed");
    collapseBtn.setAttribute("aria-expanded", String(!collapsed));
    saveData("sidebarCollapsed", collapsed);
  });

  if (loadData("sidebarCollapsed", false)) {
    sidebar.classList.add("is-collapsed");
    collapseBtn?.setAttribute("aria-expanded", "false");
  }

  links.forEach((link) => {
    link.addEventListener("click", () => {
      showView(link.dataset.view);
      closeMobileDrawer();
    });
  });

  // Liens secondaires ailleurs dans la page (ex : bouton "Explorer un pays" du hero)
  document.querySelectorAll("[data-view-link]").forEach((el) => {
    el.addEventListener("click", () => showView(el.dataset.viewLink));
  });
}

function closeMobileDrawer() {
  sidebar.classList.remove("is-open");
  backdrop.classList.remove("is-visible");
  toggleBtn?.setAttribute("aria-expanded", "false");
}

export function showView(viewId) {
  views.forEach((view) => {
    view.hidden = view.id !== viewId;
  });
  links.forEach((link) => {
    if (link.dataset.view === viewId) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
  if (typeof onViewChange === "function") onViewChange(viewId);
}
