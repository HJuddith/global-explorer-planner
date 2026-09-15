/**
 * planner.js
 * Fonctions pures : calcul de durée de séjour, budget prévisionnel
 * et formatage du compte à rebours (TP7 & TP8).
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Nombre de nuits/jours entre deux dates (chaînes ISO "YYYY-MM-DD").
 * Retourne null si les dates sont invalides ou incohérentes.
 */
export function computeDuration(startISO, endISO) {
  if (!startISO || !endISO) return null;
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const diffDays = Math.round((end - start) / MS_PER_DAY);
  if (diffDays <= 0) return null;
  return diffDays;
}

/**
 * Budget total = nombre de jours x budget journalier.
 */
export function computeBudget(days, dailyBudget) {
  if (!days || !Number.isFinite(dailyBudget)) return null;
  return Math.round(days * dailyBudget);
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    amount
  );
}

/**
 * Retourne le temps restant avant une date de départ sous forme
 * { days, hours, minutes, seconds, isPast }.
 */
export function getCountdownParts(targetISO) {
  const target = new Date(targetISO).getTime();
  const now = Date.now();
  const diff = target - now;

  if (Number.isNaN(target) || diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const days = Math.floor(diff / MS_PER_DAY);
  const hours = Math.floor((diff % MS_PER_DAY) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isPast: false };
}

export function formatCountdown(targetISO) {
  const { days, hours, minutes, isPast } = getCountdownParts(targetISO);
  if (isPast) return "Départ imminent ou déjà passé";
  return `Départ dans ${days}j ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
}
