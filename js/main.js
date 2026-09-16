/**
 * main.js
 * Point d'entrée de l'application — initialise chaque module fonctionnel.
 */

import { initTheme } from "./modules/theme.js";
import { initSidebar, showView } from "./modules/sidebar.js";
import { initNavbar } from "./modules/navbar.js";
import { initTrips } from "./modules/trips.js";
import { initCountries, searchFromExternalInput } from "./modules/countries.js";
import { initChecklist } from "./modules/checklist.js";
import { initPlannerForm } from "./modules/plannerForm.js";
import { initQuiz } from "./modules/quiz.js";
import { renderStats } from "./modules/statsView.js";
import { initMap, renderMap, invalidateMap } from "./modules/map.js";
import { initCommandPalette } from "./modules/commandPalette.js";
import { initExportImport } from "./modules/exportImport.js";
import { migrateChecklistToTrips } from "./modules/storage.js";

/* -------------------------------------------------------------------- */
/* Protection : exécute chaque init sans casser les autres              */
/* -------------------------------------------------------------------- */

function safe(label, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`[main] ❌ ${label} :`, err);
  }
}

/* -------------------------------------------------------------------- */
/* Bootstrap                                                            */
/* -------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  safe("migration checklist", () => migrateChecklistToTrips());
  safe("thème", () => initTheme());

  safe("navbar", () =>
    initNavbar({
      onSearch: (query) => {
        showView("countries");
        searchFromExternalInput(query);
      },
    })
  );

  safe("sidebar", () =>
    initSidebar({
      onChange: (viewId) => {
        switch (viewId) {
          case "stats":
            safe("stats", () => renderStats());
            break;

          case "quiz":
            safe("quiz", () => initQuiz());
            break;

          case "map":
            // Leaflet ne peut pas mesurer un conteneur caché.
            // On attend que le DOM peigne la vue avant de recalculer.
            requestAnimationFrame(() => {
              setTimeout(() => {
                safe("map invalidate", () => invalidateMap());
                safe("map render", () => renderMap());
              }, 150);
            });
            break;
        }
      },
    })
  );

  safe("trips", () => initTrips());
  safe("checklist", () => initChecklist());
  safe("countries", () => initCountries());
  safe("plannerForm", () => initPlannerForm());
  safe("quiz", () => initQuiz());

  // ⚠️ initMap() au démarrage : crée la carte (même si la vue est cachée,
  // elle sera recalculée via invalidateMap() à l'ouverture de la vue).
  safe("map", () => initMap());

  safe("commandPalette", () => initCommandPalette());
  safe("exportImport", () => initExportImport());

  registerServiceWorker();
});

/* -------------------------------------------------------------------- */
/* PWA                                                                  */
/* -------------------------------------------------------------------- */

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol === "file:") return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        // Optionnel : vérification des mises à jour du Service Worker
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker == null) return;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.info("[PWA] Une nouvelle version de l'application est disponible.");
            }
          };
        };
      })
      .catch((err) => {
        console.info("[PWA] Service Worker non enregistré :", err.message);
      });
  });
}