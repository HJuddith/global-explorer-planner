/**
 * commandPalette.js
 * Palette de commandes universelle (⌘K / Ctrl+K).
 * Permet de tout faire au clavier : navigation, création, thème, etc.
 */

import { showView } from "./sidebar.js";
import { initQuiz } from "./quiz.js";
import { renderStats } from "./statsView.js";
import { escapeHtml } from "./utils.js";

/* -------------------------------------------------------------------- */
/* Définition des commandes                                              */
/* -------------------------------------------------------------------- */

function getCommands() {
  return [
    {
      id: "new-trip",
      label: "Nouveau voyage",
      keywords: "créer ajouter destination",
      run: () => document.getElementById("open-trip-modal")?.click(),
    },
    {
      id: "goto-dashboard",
      label: "Tableau de bord",
      keywords: "accueil dashboard",
      run: () => showView("dashboard"),
    },
    {
      id: "goto-trips",
      label: "Mes voyages",
      keywords: "liste destinations voyages",
      run: () => showView("trips"),
    },
    {
      id: "goto-map",
      label: "Carte du monde",
      keywords: "carte globe map",
      run: () => showView("map"),
    },
    {
      id: "goto-countries",
      label: "Recherche de pays",
      keywords: "pays api recherche",
      run: () => showView("countries"),
    },
    {
      id: "goto-checklist",
      label: "Checklist",
      keywords: "affaires bagages liste",
      run: () => showView("checklist"),
    },
    {
      id: "goto-quiz",
      label: "Quiz destination",
      keywords: "quiz test",
      run: () => {
        showView("quiz");
        initQuiz();
      },
    },
    {
      id: "goto-stats",
      label: "Statistiques",
      keywords: "stats graphiques",
      run: () => {
        showView("stats");
        renderStats();
      },
    },
    {
      id: "toggle-theme",
      label: "Basculer le thème",
      keywords: "dark light sombre clair",
      run: () => document.getElementById("theme-toggle")?.click(),
    },
    {
      id: "color-accent",
      label: "Nouvelle couleur d'accent",
      keywords: "couleur palette thème",
      run: () => document.getElementById("color-generator-btn")?.click(),
    },
    {
      id: "export-data",
      label: "Exporter mes données",
      keywords: "sauvegarde backup json",
      run: () => document.getElementById("export-data")?.click(),
    },
  ];
}

/* -------------------------------------------------------------------- */
/* État                                                                  */
/* -------------------------------------------------------------------- */

let isOpen = false;

/* -------------------------------------------------------------------- */
/* Initialisation                                                        */
/* -------------------------------------------------------------------- */

export function initCommandPalette() {
  const dialog = document.getElementById("command-palette");
  const input = document.getElementById("command-search");
  const list = document.getElementById("command-list");

  if (!dialog || !input || !list) {
    console.warn("[commandPalette] éléments HTML manquants");
    return;
  }

  // Raccourci ⌘K / Ctrl+K
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openPalette();
    }
  });

  // Bouton navbar
  document.getElementById("command-palette-btn")?.addEventListener("click", openPalette);

  // Fermer en cliquant sur le backdrop
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closePalette();
  });

  dialog.addEventListener("close", () => {
    isOpen = false;
  });

  // Filtrage en direct
  input.addEventListener("input", () => renderCommands(input.value));

  // Navigation clavier
  input.addEventListener("keydown", handleKeys);

  /* ---------------- Fonctions internes ---------------- */

  function openPalette() {
    if (isOpen) return;
    dialog.showModal();
    isOpen = true;
    input.value = "";
    renderCommands("");
    setTimeout(() => input.focus(), 30);
  }

  function closePalette() {
    if (isOpen) dialog.close();
  }

  function renderCommands(query) {
    const q = query.toLowerCase().trim();
    const all = getCommands();
    const filtered = !q
      ? all
      : all.filter(
          (c) =>
            c.label.toLowerCase().includes(q) ||
            c.keywords.includes(q)
        );

    // Reset DOM
    while (list.firstChild) list.removeChild(list.firstChild);

    if (filtered.length === 0) {
      const empty = document.createElement("li");
      empty.className = "command-palette__empty";
      empty.textContent = "Aucun résultat";
      list.appendChild(empty);
      return;
    }

    filtered.forEach((cmd, i) => {
      const li = document.createElement("li");
      li.className = "command-palette__item";
      if (i === 0) li.classList.add("is-active");
      li.dataset.id = cmd.id;
      li.textContent = cmd.label;

      li.addEventListener("click", () => execute(cmd.id));
      li.addEventListener("mouseenter", () => setActive(li));

      list.appendChild(li);
    });
  }

  function setActive(li) {
    list.querySelectorAll(".command-palette__item").forEach((x) =>
      x.classList.remove("is-active")
    );
    li.classList.add("is-active");
  }

  function handleKeys(e) {
    const items = [...list.querySelectorAll(".command-palette__item")];
    const active = list.querySelector(".is-active");
    const index = items.indexOf(active);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = items[index + 1];
      if (next) {
        setActive(next);
        next.scrollIntoView({ block: "nearest" });
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = items[index - 1];
      if (prev) {
        setActive(prev);
        prev.scrollIntoView({ block: "nearest" });
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active) execute(active.dataset.id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closePalette();
    }
  }

  function execute(id) {
    const cmd = getCommands().find((c) => c.id === id);
    closePalette();
    if (cmd) {
      // Laisse le dialog se fermer avant d'exécuter
      setTimeout(() => cmd.run(), 50);
    }
  }
}