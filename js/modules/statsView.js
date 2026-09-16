/**
 * statsView.js
 * Vue "Statistiques" : agrège les données des voyages et de leurs checklists.
 * Avec drapeaux et drag & drop entre destinations.
 * 100% DOM API — aucun innerHTML.
 */

import { getTrips, updateTrip } from "./trips.js";
import { computeDuration } from "./planner.js";
import { getChecklistStats, uid } from "./utils.js";
import { icons } from "./icons.js";

const grid = document.getElementById("stats-grid");

/* -------------------------------------------------------------------- */
/* Détection pays → drapeau                                              */
/* -------------------------------------------------------------------- */

const KEYWORDS = {
  japon: "JP", japan: "JP", tokyo: "JP", kyoto: "JP", osaka: "JP",
  thaïlande: "TH", thailande: "TH", bangkok: "TH",
  france: "FR", paris: "FR", nice: "FR", lyon: "FR",
  italie: "IT", rome: "IT", venise: "IT", milan: "IT",
  espagne: "ES", barcelone: "ES", madrid: "ES",
  portugal: "PT", lisbonne: "PT", porto: "PT",
  maroc: "MA", marrakech: "MA", casablanca: "MA",
  égypte: "EG", egypte: "EG", caire: "EG",
  tunisie: "TN", tunis: "TN",
  algérie: "DZ", algerie: "DZ", alger: "DZ",
  sénégal: "SN", senegal: "SN", dakar: "SN",
  "côte d'ivoire": "CI", "cote d'ivoire": "CI", abidjan: "CI",
  kenya: "KE", nairobi: "KE",
  madagascar: "MG", antananarivo: "MG",
  maurice: "MU", "port louis": "MU",
  seychelles: "SC", victoria: "SC",
  comores: "KM",
  "la réunion": "RE", "la reunion": "RE",
  mayotte: "YT",
  "afrique du sud": "ZA", "le cap": "ZA",
  "états-unis": "US", "etats-unis": "US", usa: "US", "new york": "US",
  canada: "CA", montréal: "CA", québec: "CA", toronto: "CA",
  brésil: "BR", bresil: "BR", "rio de janeiro": "BR",
  mexique: "MX", "mexico": "MX", cancún: "MX",
  pérou: "PE", perou: "PE", lima: "PE",
  chili: "CL", santiago: "CL",
  argentine: "AR", "buenos aires": "AR",
  cuba: "CU",
  "costa rica": "CR",
  allemagne: "DE", berlin: "DE",
  "pays-bas": "NL", amsterdam: "NL",
  belgique: "BE", bruxelles: "BE",
  suisse: "CH", genève: "CH",
  autriche: "AT", vienne: "AT",
  grèce: "GR", grece: "GR", athènes: "GR",
  turquie: "TR", istanbul: "TR",
  "royaume-uni": "GB", londres: "GB", london: "GB",
  irlande: "IE", dublin: "IE",
  islande: "IS", reykjavik: "IS",
  norvège: "NO", oslo: "NO",
  suède: "SE", stockholm: "SE",
  finlande: "FI", helsinki: "FI",
  danemark: "DK", copenhague: "DK",
  russie: "RU", moscou: "RU",
  chine: "CN", pékin: "CN", shanghai: "CN",
  inde: "IN", mumbai: "IN",
  vietnam: "VN", hanoï: "VN",
  corée: "KR", coree: "KR", séoul: "KR",
  indonésie: "ID", bali: "ID",
  australie: "AU", sydney: "AU",
  "nouvelle-zélande": "NZ", auckland: "NZ",
  "polynésie française": "PF", tahiti: "PF",
  "nouvelle-calédonie": "NC", nouméa: "NC",
  fidji: "FJ", fiji: "FJ",
};

function extractCountryCode(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const [keyword, code] of Object.entries(KEYWORDS)) {
    if (lower.includes(keyword)) return code;
  }
  return null;
}

/* -------------------------------------------------------------------- */
/* Point d'entrée                                                        */
/* -------------------------------------------------------------------- */

export function renderStats() {
  const trips = getTrips();

  while (grid.firstChild) grid.removeChild(grid.firstChild);

  if (trips.length === 0) {
    grid.appendChild(buildEmptyState());
    return;
  }

  /* ---------------------------------------------------------------- */
  /* Calculs globaux                                                   */
  /* ---------------------------------------------------------------- */

  const totalDays = trips.reduce(
    (sum, t) => sum + (computeDuration(t.start, t.end) || 0),
    0
  );

  const totalBudget = trips.reduce((sum, t) => {
    const days = computeDuration(t.start, t.end) || 0;
    return sum + days * (t.dailyBudget || 0);
  }, 0);

  const totalItems = trips.reduce(
    (sum, t) => sum + (t.checklist?.length ?? 0),
    0
  );
  const doneItems = trips.reduce(
    (sum, t) => sum + (t.checklist?.filter((i) => i.done).length ?? 0),
    0
  );
  const checklistPercent = totalItems
    ? Math.round((doneItems / totalItems) * 100)
    : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = trips.filter((t) => new Date(t.start) > today).length;
  const ongoing = trips.filter(
    (t) => new Date(t.start) <= today && new Date(t.end) >= today
  ).length;
  const past = trips.length - upcoming - ongoing;

  const nextTrip = [...trips]
    .filter((t) => new Date(t.start) > today)
    .sort((a, b) => new Date(a.start) - new Date(b.start))[0];

  /* ---------------------------------------------------------------- */
  /* Cartes principales                                                */
  /* ---------------------------------------------------------------- */

  const mainCards = [
    { value: String(trips.length),         label: "Voyages enregistrés" },
    { value: `${totalDays} j`,             label: "Jours de voyage cumulés" },
    { value: formatEuro(totalBudget),      label: "Budget total estimé" },
    { value: `${doneItems}/${totalItems}`, label: `Checklist (${checklistPercent}\u00A0%)` },
  ];

  mainCards.forEach(({ value, label }) => {
    grid.appendChild(buildStatCard(value, label));
  });

  /* ---------------------------------------------------------------- */
  /* Répartition                                                       */
  /* ---------------------------------------------------------------- */

  grid.appendChild(buildSectionTitle("Répartition des voyages"));

  const distribution = [
    { value: String(upcoming), label: "À venir",  color: "var(--color-accent)" },
    { value: String(ongoing),  label: "En cours", color: "var(--color-gold)" },
    { value: String(past),     label: "Terminés", color: "var(--text-tertiary)" },
  ];

  distribution.forEach(({ value, label, color }) => {
    grid.appendChild(buildStatCard(value, label, color));
  });

  /* ---------------------------------------------------------------- */
  /* Prochaine destination                                             */
  /* ---------------------------------------------------------------- */

  if (nextTrip) {
    grid.appendChild(buildSectionTitle("Prochaine destination"));
    grid.appendChild(buildNextTripCard(nextTrip));
  }

  /* ---------------------------------------------------------------- */
  /* Top 3 voyages les plus longs                                      */
  /* ---------------------------------------------------------------- */

  const topTrips = [...trips]
    .map((t) => ({ ...t, days: computeDuration(t.start, t.end) || 0 }))
    .sort((a, b) => b.days - a.days)
    .slice(0, 3);

  if (topTrips.length > 0) {
    grid.appendChild(buildSectionTitle("Vos voyages les plus longs"));
    topTrips.forEach((trip) => grid.appendChild(buildTopTripCard(trip)));
  }
}

/* -------------------------------------------------------------------- */
/* Constructeurs DOM                                                     */
/* -------------------------------------------------------------------- */

function buildStatCard(value, label, accent) {
  const card = document.createElement("div");
  card.className = "stat-card";
  if (accent) card.style.setProperty("--card-accent", accent);

  const valueEl = document.createElement("p");
  valueEl.className = "stat-card__value";
  valueEl.textContent = value;

  const labelEl = document.createElement("p");
  labelEl.className = "stat-card__label";
  labelEl.textContent = label;

  card.append(valueEl, labelEl);
  return card;
}

function buildSectionTitle(text) {
  const el = document.createElement("h3");
  el.className = "stats-section-title";
  el.textContent = text;
  el.style.gridColumn = "1 / -1";
  el.style.marginTop = "var(--space-md)";
  el.style.marginBottom = "var(--space-2xs)";
  return el;
}

/* -------------------------------------------------------------------- */
/* Carte : Prochaine destination (avec checklist draggable)              */
/* -------------------------------------------------------------------- */

function buildNextTripCard(trip) {
  const days = computeDuration(trip.start, trip.end);
  const { done, total, percent } = getChecklistStats(trip);

  const card = document.createElement("article");
  card.className = "card card--stats";
  card.style.gridColumn = "1 / -1";
  card.style.setProperty("--card-accent", trip.color);
  card.dataset.tripId = trip.id;

  const body = document.createElement("div");
  body.className = "card__body";

  /* --- Titre + drapeau --- */
  const titleRow = document.createElement("div");
  titleRow.className = "card__title-row";

  const countryCode = extractCountryCode(trip.name);
  if (countryCode) {
    const flag = document.createElement("img");
    flag.src = `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
    flag.alt = "";
    flag.loading = "lazy";
    flag.decoding = "async";
    flag.className = "card__flag";
    flag.addEventListener("error", () => flag.remove());
    titleRow.appendChild(flag);
  }

  const title = document.createElement("h4");
  title.className = "card__title";
  title.style.marginTop = "0";
  title.textContent = trip.name;
  titleRow.appendChild(title);

  const badge = document.createElement("span");
  badge.className = "badge badge--accent";
  badge.textContent = "Prochain départ";

  const meta = document.createElement("div");
  meta.className = "card__meta";
  meta.appendChild(buildMetaItem("calendar", formatLongDate(trip.start)));
  meta.appendChild(buildMetaItem("clock", `${days} jour${days > 1 ? "s" : ""}`));

  body.append(badge, titleRow, meta);

  if (total > 0) {
    body.appendChild(buildChecklistBar(done, total, percent));
    body.appendChild(buildChecklistPanel(trip));
  } else {
    const empty = document.createElement("p");
    empty.className = "card__checklist-empty";
    empty.textContent = "Aucune checklist associée";
    body.appendChild(empty);

    // Zone de drop vide pour permettre le drag
    body.appendChild(buildEmptyDropZone(trip));
  }

  card.appendChild(body);
  return card;
}

/* -------------------------------------------------------------------- */
/* Carte : Top voyage (avec checklist draggable)                         */
/* -------------------------------------------------------------------- */

function buildTopTripCard(trip) {
  const { done, total, percent } = getChecklistStats(trip);

  const card = document.createElement("article");
  card.className = "card card--stats";
  card.style.setProperty("--card-accent", trip.color);
  card.dataset.tripId = trip.id;

  const body = document.createElement("div");
  body.className = "card__body";

  /* --- Titre + drapeau --- */
  const titleRow = document.createElement("div");
  titleRow.className = "card__title-row";

  const countryCode = extractCountryCode(trip.name);
  if (countryCode) {
    const flag = document.createElement("img");
    flag.src = `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
    flag.alt = "";
    flag.loading = "lazy";
    flag.decoding = "async";
    flag.className = "card__flag";
    flag.addEventListener("error", () => flag.remove());
    titleRow.appendChild(flag);
  }

  const title = document.createElement("h4");
  title.className = "card__title";
  title.textContent = trip.name;
  titleRow.appendChild(title);

  const countdown = document.createElement("p");
  countdown.className = "card__countdown";
  countdown.textContent = `${trip.days} jour${trip.days > 1 ? "s" : ""}`;

  body.append(titleRow, countdown);

  if (total > 0) {
    body.appendChild(buildChecklistBar(done, total, percent));
    body.appendChild(buildChecklistPanel(trip));
  } else {
    body.appendChild(buildEmptyDropZone(trip));
  }

  card.appendChild(body);
  return card;
}

/* -------------------------------------------------------------------- */
/* Panneau checklist draggable (dans les cartes stats)                   */
/* -------------------------------------------------------------------- */

function buildChecklistPanel(trip) {
  const panel = document.createElement("div");
  panel.className = "card__checklist-panel";
  panel.dataset.dropZone = trip.id;

  const hint = document.createElement("p");
  hint.className = "card__drop-hint";
  hint.textContent = "Glissez une affaire ici pour la transférer";
  panel.appendChild(hint);

  const list = document.createElement("ul");
  list.className = "card__items-list";

  (trip.checklist ?? []).forEach((item) => {
    list.appendChild(buildChecklistItem(trip.id, item));
  });

  panel.appendChild(list);
  return panel;
}

function buildEmptyDropZone(trip) {
  const panel = document.createElement("div");
  panel.className = "card__checklist-panel card__checklist-panel--empty";
  panel.dataset.dropZone = trip.id;

  const hint = document.createElement("p");
  hint.className = "card__drop-hint";
  hint.textContent = "Déposez une affaire ici";
  panel.appendChild(hint);

  return panel;
}

function buildChecklistItem(tripId, item) {
  const li = document.createElement("li");
  li.className = "card__item";
  if (item.done) li.classList.add("is-done");
  li.dataset.itemId = item.id;
  li.dataset.tripId = tripId;
  li.dataset.draggable = "item";
  li.draggable = true;

  const handle = document.createElement("span");
  handle.className = "card__drag-handle";
  handle.setAttribute("aria-hidden", "true");
  handle.textContent = "⋮⋮";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "card__item-checkbox";
  checkbox.dataset.action = "toggle-item";
  checkbox.dataset.tripId = tripId;
  checkbox.dataset.itemId = item.id;
  if (item.done) checkbox.checked = true;

  const label = document.createElement("span");
  label.className = "card__item-text";
  label.textContent = item.text;

  li.append(handle, checkbox, label);
  return li;
}

/* -------------------------------------------------------------------- */
/* Barres et méta                                                        */
/* -------------------------------------------------------------------- */

function buildEmptyState() {
  const card = document.createElement("div");
  card.className = "card card--empty";
  card.style.gridColumn = "1 / -1";

  const p1 = document.createElement("p");
  p1.textContent = "Aucune statistique disponible pour l'instant.";

  const p2 = document.createElement("p");
  p2.className = "field__hint";
  p2.textContent = "Ajoutez un premier voyage pour voir vos données.";

  card.append(p1, p2);
  return card;
}

function buildMetaItem(iconName, text) {
  const span = document.createElement("span");
  span.className = "card__meta-item";
  span.appendChild(icons[iconName]());
  span.appendChild(document.createTextNode(" " + text));
  return span;
}

function buildChecklistBar(done, total, percent) {
  const wrap = document.createElement("div");
  wrap.className = "card__checklist";
  wrap.title = `${done}/${total} éléments prêts`;

  const bar = document.createElement("div");
  bar.className = "card__checklist-bar";

  const fill = document.createElement("div");
  fill.className = "card__checklist-fill";
  fill.style.width = `${percent}%`;
  bar.appendChild(fill);

  const label = document.createElement("span");
  label.className = "card__checklist-label";
  label.appendChild(icons.suitcase());
  label.appendChild(document.createTextNode(` ${done}/${total} · ${percent}%`));

  wrap.append(bar, label);
  return wrap;
}

/* -------------------------------------------------------------------- */
/* Drag & drop dans la vue Statistiques                                  */
/* -------------------------------------------------------------------- */

let draggedItem = null;

document.addEventListener("dragstart", (e) => {
  const item = e.target.closest("[data-draggable='item']");
  if (!item) return;

  draggedItem = {
    tripId: item.dataset.tripId,
    itemId: item.dataset.itemId,
  };

  item.classList.add("is-dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", JSON.stringify(draggedItem));
});

document.addEventListener("dragover", (e) => {
  const dropZone = e.target.closest("[data-drop-zone]");
  if (!dropZone) return;

  const targetTripId = dropZone.dataset.dropZone;
  if (targetTripId === draggedItem?.tripId) return;

  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  dropZone.classList.add("is-drag-over");
});

document.addEventListener("dragleave", (e) => {
  const dropZone = e.target.closest("[data-drop-zone]");
  if (dropZone) dropZone.classList.remove("is-drag-over");
});

document.addEventListener("drop", (e) => {
  const dropZone = e.target.closest("[data-drop-zone]");
  if (!dropZone) return;
  e.preventDefault();

  const targetTripId = dropZone.dataset.dropZone;
  dropZone.classList.remove("is-drag-over");

  if (!draggedItem || draggedItem.tripId === targetTripId) return;

  const trips = getTrips();
  const sourceTrip = trips.find((t) => t.id === draggedItem.tripId);
  const targetTrip = trips.find((t) => t.id === targetTripId);
  if (!sourceTrip?.checklist || !targetTrip) return;

  const itemIndex = sourceTrip.checklist.findIndex((i) => i.id === draggedItem.itemId);
  if (itemIndex === -1) return;

  const [movedItem] = sourceTrip.checklist.splice(itemIndex, 1);
  targetTrip.checklist ??= [];
  targetTrip.checklist.push(movedItem);

  // Persiste les 2 voyages
  updateTrip(sourceTrip);
  updateTrip(targetTrip);

  // Re-render la vue stats
  renderStats();

  showToast(`"${movedItem.text}" déplacé vers ${targetTrip.name}`);
});

document.addEventListener("dragend", () => {
  document.querySelectorAll(".is-dragging").forEach((el) => el.classList.remove("is-dragging"));
  document.querySelectorAll(".is-drag-over").forEach((el) => el.classList.remove("is-drag-over"));
  draggedItem = null;
});

/* -------------------------------------------------------------------- */
/* Toast                                                                 */
/* -------------------------------------------------------------------- */

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("toast--visible");

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove("toast--visible");
  }, 2500);
}

/* -------------------------------------------------------------------- */
/* Utilitaires                                                           */
/* -------------------------------------------------------------------- */

function formatEuro(amount) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatLongDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}