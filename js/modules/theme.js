/**
 * theme.js
 * Bascule Dark/Light (persistée) + générateur de couleur d'accent (TP5).
 */

import { loadData, saveData } from "./storage.js";

const ROOT = document.documentElement;

// Palette curatée pour garantir un contraste WCAG AA suffisant sur fond clair/sombre.
const ACCENT_PALETTE = [
  { accent: "#1f7a6c", dark: "#155c51" }, // teal boussole (défaut)
  { accent: "#b25f28", dark: "#8f4b1f" }, // ambre timbre
  { accent: "#4a5fae", dark: "#38478a" }, // indigo carte marine
  { accent: "#9c4f78", dark: "#7a3c5e" }, // prune vintage
  { accent: "#3c7a3e", dark: "#2c5c2e" }, // vert jungle
  { accent: "#b6402f", dark: "#8f3125" }, // brique timbre postal
];

export function initTheme() {
  const savedTheme = loadData("theme", getPreferredScheme());
  applyTheme(savedTheme);

  const savedAccent = loadData("accent", null);
  if (savedAccent) applyAccent(savedAccent);

  const toggleBtn = document.getElementById("theme-toggle");
  toggleBtn?.addEventListener("click", () => {
    const next = ROOT.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    saveData("theme", next);
  });

  const colorBtn = document.getElementById("color-generator-btn");
  colorBtn?.addEventListener("click", () => {
    const random = ACCENT_PALETTE[Math.floor(Math.random() * ACCENT_PALETTE.length)];
    applyAccent(random);
    saveData("accent", random);
  });
}

function getPreferredScheme() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  ROOT.setAttribute("data-theme", theme);
  const toggleBtn = document.getElementById("theme-toggle");
  if (toggleBtn) {
    const isDark = theme === "dark";
    toggleBtn.setAttribute("aria-pressed", String(isDark));
    toggleBtn.setAttribute("aria-label", isDark ? "Activer le mode clair" : "Activer le mode sombre");
  }
}

function applyAccent({ accent, dark }) {
  ROOT.style.setProperty("--color-accent", accent);
  ROOT.style.setProperty("--color-accent-dark", dark);
}

export function getAccentPalette() {
  return ACCENT_PALETTE;
}
