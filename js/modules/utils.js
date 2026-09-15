/**
 * utils.js
 * Fonctions utilitaires pures, sans dépendance aux autres modules.
 * Centralise : escapeHtml, uid, progression checklist, formatage de dates.
 */

/* -------------------------------------------------------------------- */
/* Échappement HTML                                                      */
/* -------------------------------------------------------------------- */

export function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
}

/* -------------------------------------------------------------------- */
/* Générateur d'ID unique                                                */
/* -------------------------------------------------------------------- */

export function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/* -------------------------------------------------------------------- */
/* Checklist — calculs                                                   */
/* -------------------------------------------------------------------- */

/**
 * Statistiques complètes d'une checklist de voyage.
 * @param {object} trip
 * @returns {{done: number, total: number, percent: number}}
 */
export function getChecklistStats(trip) {
  const total = trip?.checklist?.length ?? 0;
  const done = trip?.checklist?.filter((i) => i.done).length ?? 0;
  const percent = total ? Math.round((done / total) * 100) : 0;
  return { done, total, percent };
}

/* -------------------------------------------------------------------- */
/* Formatage de date                                                   */
/* -------------------------------------------------------------------- */

export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatLongDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}


/* -------------------------------------------------------------------- */
/* Drapeau emoji depuis code ISO                                         */
/* -------------------------------------------------------------------- */

/**
 * Retourne l'emoji drapeau depuis un code ISO 2 lettres
 * Note : ne s'affiche pas sur Windows (limitation système)
 * @param {string} countryCode — ex: "JP"
 * @returns {string} — emoji ou chaîne vide
 */
export function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((c) => 127397 + c.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return "";
  }
}