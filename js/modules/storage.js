/**
 * storage.js
 * Petite couche d'abstraction autour de localStorage,
 * avec sérialisation JSON et gestion d'erreurs (quota dépassé, mode privé…).
 */

const PREFIX = "gep:"; // Global Explorer & Planner

export function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.error(`[storage] Lecture impossible pour "${key}" :`, error);
    return fallback;
  }
}

export function saveData(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[storage] Écriture impossible pour "${key}" :`, error);
    return false;
  }
}

export function removeData(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch (error) {
    console.error(`[storage] Suppression impossible pour "${key}" :`, error);
  }
}

/* -------------------------------------------------------------------- */
/* checklists par voyage        */
/* -------------------------------------------------------------------- */

export function migrateChecklistToTrips() {
  const oldChecklist = loadData("checklist", null);
  if (!Array.isArray(oldChecklist) || oldChecklist.length === 0) return;

  const trips = loadData("trips", []);
  if (trips.length === 0) {
    removeData("checklist");
    return;
  }

  let migrated = false;
  trips.forEach((trip) => {
    if (!trip.checklist) {
      trip.checklist = oldChecklist.map((item) => ({
        id: crypto.randomUUID(),
        text: item.text,
        done: Boolean(item.done),
      }));
      migrated = true;
    }
  });

  if (migrated) {
    saveData("trips", trips);
    console.info(`✅ Checklist migrée vers ${trips.length} voyage(s).`);
  }
  removeData("checklist");
}
