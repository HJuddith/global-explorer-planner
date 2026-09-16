/**
 * exportImport.js
 * Export / Import complet des données de l'application au format JSON.
 * Aucun backend — tout se fait côté client via Blob et FileReader.
 */

import { loadData, saveData } from "./storage.js";

const APP_ID = "global-explorer-planner";
const APP_VERSION = 1;

/* -------------------------------------------------------------------- */
/* Initialisation                                                        */
/* -------------------------------------------------------------------- */

export function initExportImport() {
  document.getElementById("export-data")?.addEventListener("click", exportAllData);

  const importInput = document.getElementById("import-data");
  importInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) importAllData(file);
    // Reset pour pouvoir réimporter le même fichier
    e.target.value = "";
  });
}

/* -------------------------------------------------------------------- */
/* Export                                                                */
/* -------------------------------------------------------------------- */

export function exportAllData() {
  const payload = {
    app: APP_ID,
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      trips: loadData("trips", []),
      theme: loadData("theme", null),
      accent: loadData("accent", null),
      sidebarCollapsed: loadData("sidebarCollapsed", false),
      checklistActiveTrip: loadData("checklist-active-trip", null),
    },
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `global-explorer-${date}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

/* -------------------------------------------------------------------- */
/* Import                                                                */
/* -------------------------------------------------------------------- */

export function importAllData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);

        if (payload.app !== APP_ID) {
          throw new Error("Fichier non reconnu (format inattendu).");
        }

        const tripsCount = payload.data?.trips?.length ?? 0;
        const ok = confirm(
          `Restaurer ${tripsCount} voyage(s) ?\n\nCela remplacera vos données actuelles.`
        );
        if (!ok) return resolve(false);

        Object.entries(payload.data || {}).forEach(([key, value]) => {
          if (value != null) {
            saveData(key, value);
          }
        });

        // Recharge pour tout réinitialiser proprement
        location.reload();
        resolve(true);
      } catch (err) {
        console.error("[exportImport] Import échoué :", err);
        alert("❌ Erreur : " + err.message);
        reject(err);
      }
    };

    reader.onerror = (err) => {
      console.error("[exportImport] Lecture impossible :", err);
      reject(err);
    };

    reader.readAsText(file);
  });
}