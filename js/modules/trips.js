/**
 * trips.js
 * Gestion des voyages : CRUD, cartes avec drapeaux, checklists dépliables,
 * drag & drop d'items entre voyages.
 * 100% DOM API — aucun innerHTML.
 */

import { loadData, saveData } from "./storage.js";
import { openModal, closeModal } from "./modal.js";
import { computeDuration, computeBudget, formatCurrency, formatCountdown } from "./planner.js";
import { getAccentPalette } from "./theme.js";
import { icons } from "./icons.js";
import { getChecklistStats, formatDate, uid } from "./utils.js";

const STORAGE_KEY = "trips";
const EXPANDED_KEY = "trips-expanded";

const grid = document.getElementById("trips-grid");
const dashboardPreview = document.getElementById("dashboard-trip-preview");
const modal = document.getElementById("trip-modal");
const form = document.getElementById("trip-form");
const colorGroup = document.getElementById("trip-color-group");

const statTripCount = document.getElementById("stat-trip-count");
const statNextTrip = document.getElementById("stat-next-trip");
const statChecklist = document.getElementById("stat-checklist");

let trips = loadData(STORAGE_KEY, []);
let expandedTrips = new Set(loadData(EXPANDED_KEY, []));
let selectedColor = getAccentPalette()[0].accent;
let countdownInterval = null;
let draggedItem = null;

/* -------------------------------------------------------------------- */
/* Détection pays → drapeau                                              */
/* -------------------------------------------------------------------- */

const KEYWORDS = {
  japon: "JP", japan: "JP", tokyo: "JP", kyoto: "JP", osaka: "JP",
  thaïlande: "TH", thailande: "TH", bangkok: "TH",
  france: "FR", paris: "FR", nice: "FR", lyon: "FR", marseille: "FR",
  italie: "IT", rome: "IT", venise: "IT", milan: "IT", florence: "IT",
  espagne: "ES", barcelone: "ES", madrid: "ES", séville: "ES",
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
  comores: "KM", moroni: "KM",
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
  cuba: "CU", havane: "CU",
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
  norvège: "NO", norvege: "NO", oslo: "NO",
  suède: "SE", suede: "SE", stockholm: "SE",
  finlande: "FI", helsinki: "FI",
  danemark: "DK", copenhague: "DK",
  russie: "RU", moscou: "RU",
  chine: "CN", pékin: "CN", shanghai: "CN",
  inde: "IN", mumbai: "IN",
  vietnam: "VN", hanoï: "VN",
  corée: "KR", coree: "KR", séoul: "KR",
  indonésie: "ID", bali: "ID",
  australie: "AU", sydney: "AU",
  "nouvelle-zélande": "NZ", "nouvelle-zelande": "NZ", auckland: "NZ",
  "polynésie française": "PF", "polynesie francaise": "PF", tahiti: "PF",
  "nouvelle-calédonie": "NC", "nouvelle-caledonie": "NC", nouméa: "NC",
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
/* API publique                                                          */
/* -------------------------------------------------------------------- */

export function initTrips() {
  buildColorSwatches();
  render();

  document.getElementById("open-trip-modal")?.addEventListener("click", (e) => openCreateModal(e.currentTarget));
  document.getElementById("hero-add-trip")?.addEventListener("click", (e) => openCreateModal(e.currentTarget));
  document.getElementById("trip-modal-close")?.addEventListener("click", () => closeModal(modal));
  document.getElementById("trip-modal-cancel")?.addEventListener("click", () => closeModal(modal));

  form.addEventListener("submit", handleSubmit);

  // trips + dashboard
  const grids = [grid, dashboardPreview].filter(Boolean);

  grids.forEach((g) => {
    g.addEventListener("click", handleGridClick);
    g.addEventListener("input", handleGridInput);
    g.addEventListener("keydown", handleGridKeydown);

    g.addEventListener("mousemove", handleTiltMove);
    g.addEventListener("mouseleave", handleTiltLeave, true);

    g.addEventListener("dragstart", handleDragStart);
    g.addEventListener("dragover", handleDragOver);
    g.addEventListener("dragleave", handleDragLeave);
    g.addEventListener("drop", handleDrop);
    g.addEventListener("dragend", handleDragEnd);
  });

  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(updateCountdowns, 1000 * 30);
}

export function getTrips() {
  return trips;
}

export function getTripById(id) {
  return trips.find((t) => t.id === id);
}

export function updateTrip(updatedTrip) {
  const index = trips.findIndex((t) => t.id === updatedTrip.id);
  if (index === -1) return;
  trips[index] = updatedTrip;
  persist();
  render();
}

/* -------------------------------------------------------------------- */
/* Swatches                                                              */
/* -------------------------------------------------------------------- */

function buildColorSwatches() {
  while (colorGroup.firstChild) colorGroup.removeChild(colorGroup.firstChild);

  getAccentPalette().forEach(({ accent }, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "color-swatch";
    btn.style.background = accent;
    btn.dataset.color = accent;
    btn.setAttribute("aria-pressed", index === 0 ? "true" : "false");
    btn.setAttribute("aria-label", `Couleur ${index + 1}`);

    btn.addEventListener("click", () => {
      selectedColor = accent;
      colorGroup.querySelectorAll(".color-swatch").forEach((s) =>
        s.setAttribute("aria-pressed", "false")
      );
      btn.setAttribute("aria-pressed", "true");
    });

    colorGroup.appendChild(btn);
  });
}

/* -------------------------------------------------------------------- */
/* Modale                                                                */
/* -------------------------------------------------------------------- */

function openCreateModal(trigger) {
  form.reset();
  document.getElementById("trip-id").value = "";
  document.getElementById("trip-modal-title").textContent = "Ajouter une destination";

  selectedColor = getAccentPalette()[0].accent;
  colorGroup.querySelectorAll(".color-swatch").forEach((s, i) =>
    s.setAttribute("aria-pressed", i === 0 ? "true" : "false")
  );

  openModal(modal, trigger);
}

function openEditModal(trip, trigger) {
  document.getElementById("trip-id").value = trip.id;
  document.getElementById("trip-name").value = trip.name;
  document.getElementById("trip-start").value = trip.start;
  document.getElementById("trip-end").value = trip.end;
  document.getElementById("trip-budget").value = trip.dailyBudget;
  document.getElementById("trip-modal-title").textContent = "Modifier la destination";

  selectedColor = trip.color;
  colorGroup.querySelectorAll(".color-swatch").forEach((s) => {
    s.setAttribute("aria-pressed", String(s.dataset.color === trip.color));
  });

  openModal(modal, trigger);
}

function handleSubmit(event) {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const id = document.getElementById("trip-id").value || uid();
  const name = document.getElementById("trip-name").value.trim();
  const start = document.getElementById("trip-start").value;
  const end = document.getElementById("trip-end").value;
  const dailyBudget = Number(document.getElementById("trip-budget").value);

  if (computeDuration(start, end) === null) {
    alert("La date de retour doit être postérieure à la date de départ.");
    return;
  }

  const existingIndex = trips.findIndex((t) => t.id === id);
  const existing = existingIndex >= 0 ? trips[existingIndex] : null;

  const tripData = {
    id, name, start, end, dailyBudget,
    color: selectedColor,
    checklist: existing?.checklist ?? [],
  };

  if (existingIndex >= 0) {
    trips[existingIndex] = tripData;
  } else {
    trips.push(tripData);
  }

  persist();
  render();
  closeModal(modal);
}

/* -------------------------------------------------------------------- */
/* Clics délégués                                                        */
/* -------------------------------------------------------------------- */

function handleGridClick(event) {
  const editBtn = event.target.closest("[data-action='edit']");
  const deleteBtn = event.target.closest("[data-action='delete']");
  const toggleBtn = event.target.closest("[data-action='toggle-checklist']");
  const addBtn = event.target.closest("[data-action='add-item']");
  const deleteItemBtn = event.target.closest("[data-action='delete-item']");

  if (editBtn) {
    const trip = trips.find((t) => t.id === editBtn.dataset.id);
    if (trip) openEditModal(trip, editBtn);
    return;
  }

  if (deleteBtn) {
    const trip = trips.find((t) => t.id === deleteBtn.dataset.id);
    if (trip && confirm(`Supprimer le voyage "${trip.name}" ?`)) {
      trips = trips.filter((t) => t.id !== trip.id);
      expandedTrips.delete(trip.id);
      saveData(EXPANDED_KEY, [...expandedTrips]);
      persist();
      render();
    }
    return;
  }

  if (toggleBtn) {
    const tripId = toggleBtn.dataset.id;
    if (expandedTrips.has(tripId)) {
      expandedTrips.delete(tripId);
    } else {
      expandedTrips.add(tripId);
    }
    saveData(EXPANDED_KEY, [...expandedTrips]);
    render();
    return;
  }

  if (addBtn) {
    const tripId = addBtn.dataset.id;
    const input = grid.querySelector(`[data-item-input="${tripId}"]`);
    const text = input?.value.trim();
    if (!text) { input?.focus(); return; }
    addChecklistItem(tripId, text);
    return;
  }

  if (deleteItemBtn) {
    deleteChecklistItem(deleteItemBtn.dataset.tripId, deleteItemBtn.dataset.itemId);
    return;
  }
}

function handleGridInput(event) {
  if (event.target.matches("[data-action='toggle-item']")) {
    const { tripId, itemId } = event.target.dataset;
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;

    const item = trip.checklist?.find((i) => i.id === itemId);
    if (!item) return;

    item.done = event.target.checked;
    persist();

    const li = event.target.closest(".card__item");
    if (li) li.classList.toggle("is-done", item.done);

    updateChecklistProgressUI(tripId);
  }
}

function handleGridKeydown(event) {
  if (event.key !== "Enter") return;
  const input = event.target.closest("[data-item-input]");
  if (!input) return;

  event.preventDefault();
  const tripId = input.dataset.itemInput;
  const text = input.value.trim();
  if (text) addChecklistItem(tripId, text);
}

/* -------------------------------------------------------------------- */
/* Checklist : actions                                                   */
/* -------------------------------------------------------------------- */

function addChecklistItem(tripId, text) {
  const trip = trips.find((t) => t.id === tripId);
  if (!trip) return;

  trip.checklist ??= [];
  trip.checklist.push({ id: uid(), text, done: false });
  expandedTrips.add(tripId);
  saveData(EXPANDED_KEY, [...expandedTrips]);

  persist();
  render();
}

function deleteChecklistItem(tripId, itemId) {
  const trip = trips.find((t) => t.id === tripId);
  if (!trip?.checklist) return;

  trip.checklist = trip.checklist.filter((i) => i.id !== itemId);
  persist();
  render();
}

/* -------------------------------------------------------------------- */
/* Drag & drop                                                           */
/* -------------------------------------------------------------------- */

function handleDragStart(event) {
  const item = event.target.closest("[data-draggable='item']");
  if (!item) return;

  draggedItem = {
    tripId: item.dataset.tripId,
    itemId: item.dataset.itemId,
  };

  item.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", JSON.stringify(draggedItem));
}

function handleDragOver(event) {
  const dropZone = event.target.closest("[data-drop-zone]");
  if (!dropZone) return;
  const targetTripId = dropZone.dataset.dropZone;
  if (targetTripId === draggedItem?.tripId) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  dropZone.classList.add("is-drag-over");
}

function handleDragLeave(event) {
  const dropZone = event.target.closest("[data-drop-zone]");
  if (dropZone) dropZone.classList.remove("is-drag-over");
}

function handleDrop(event) {
  const dropZone = event.target.closest("[data-drop-zone]");
  if (!dropZone) return;
  event.preventDefault();

  const targetTripId = dropZone.dataset.dropZone;
  dropZone.classList.remove("is-drag-over");

  if (!draggedItem || draggedItem.tripId === targetTripId) return;

  const sourceTrip = trips.find((t) => t.id === draggedItem.tripId);
  const targetTrip = trips.find((t) => t.id === targetTripId);
  if (!sourceTrip?.checklist || !targetTrip) return;

  const itemIndex = sourceTrip.checklist.findIndex((i) => i.id === draggedItem.itemId);
  if (itemIndex === -1) return;

  const [movedItem] = sourceTrip.checklist.splice(itemIndex, 1);
  targetTrip.checklist ??= [];
  targetTrip.checklist.push(movedItem);
  expandedTrips.add(targetTripId);
  saveData(EXPANDED_KEY, [...expandedTrips]);

  persist();
  render();

  showToast(`"${movedItem.text}" déplacé vers ${targetTrip.name}`);
}

function handleDragEnd() {
  grid.querySelectorAll(".is-dragging").forEach((el) => el.classList.remove("is-dragging"));
  grid.querySelectorAll(".is-drag-over").forEach((el) => el.classList.remove("is-drag-over"));
  draggedItem = null;
}

/* -------------------------------------------------------------------- */
/* Parallaxe                                                             */
/* -------------------------------------------------------------------- */

function handleTiltMove(event) {
  if (draggedItem) return;
  const card = event.target.closest(".card");
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  card.style.transform = `perspective(700px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateZ(0)`;
}

function handleTiltLeave(event) {
  const card = event.target.closest?.(".card");
  if (card) card.style.transform = "";
}

/* -------------------------------------------------------------------- */
/* Persistance + rendu                                                   */
/* -------------------------------------------------------------------- */

function persist() {
  saveData(STORAGE_KEY, trips);
}

function render() {
  while (grid.firstChild) grid.removeChild(grid.firstChild);
  while (dashboardPreview.firstChild) dashboardPreview.removeChild(dashboardPreview.firstChild);

  const sorted = [...trips].sort((a, b) => new Date(a.start) - new Date(b.start));

  if (sorted.length === 0) {
    grid.appendChild(buildEmptyState());
  } else {
    sorted.forEach((trip) => grid.appendChild(buildTripCard(trip)));
    sorted.slice(0, 3).forEach((trip) => dashboardPreview.appendChild(buildTripCard(trip)));
  }

  updateStats(sorted);
  window.dispatchEvent(new CustomEvent("trips-updated"));
}

/* -------------------------------------------------------------------- */
/* Constructeurs DOM                                                     */
/* -------------------------------------------------------------------- */

function buildEmptyState() {
  const div = document.createElement("div");
  div.className = "card card--empty";

  const p = document.createElement("p");
  p.textContent = "Aucun voyage planifié pour l'instant.";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn--primary";
  btn.id = "empty-state-add";
  btn.appendChild(icons.plus());
  btn.appendChild(document.createTextNode(" Ajouter votre première destination"));
  btn.addEventListener("click", (e) => openCreateModal(e.currentTarget));

  div.append(p, btn);
  return div;
}

function buildTripCard(trip) {
  const days = computeDuration(trip.start, trip.end);
  const total = computeBudget(days, trip.dailyBudget);
  const { done, total: itemsTotal, percent } = getChecklistStats(trip);
  const isExpanded = expandedTrips.has(trip.id);

  const card = document.createElement("article");
  card.className = "card";
  card.style.setProperty("--card-accent", trip.color);
  card.dataset.tripId = trip.id;

  const body = document.createElement("div");
  body.className = "card__body";

  /* --- Titre + drapeau + toggle --- */
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

  const title = document.createElement("h3");
  title.className = "card__title";
  title.textContent = trip.name;
  titleRow.appendChild(title);

  // Bouton déplier (uniquement si la checklist a des items)
  if (itemsTotal > 0) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "card__toggle";
    toggle.dataset.action = "toggle-checklist";
    toggle.dataset.id = trip.id;
    toggle.setAttribute("aria-expanded", String(isExpanded));

    const chevron = document.createElement("span");
    chevron.className = "card__chevron";
    chevron.textContent = isExpanded ? "▾" : "▸";
    toggle.appendChild(chevron);

    const count = document.createElement("span");
    count.className = "card__toggle-count";
    count.textContent = `${done}/${itemsTotal}`;
    toggle.appendChild(count);

    titleRow.appendChild(toggle);
  }

  body.appendChild(titleRow);

  /* --- Countdown --- */
  const countdown = document.createElement("p");
  countdown.className = "card__countdown";
  countdown.dataset.role = "countdown";
  countdown.textContent = formatCountdown(trip.start);
  body.appendChild(countdown);

  /* --- Meta --- */
  const meta = document.createElement("div");
  meta.className = "card__meta";
  meta.appendChild(buildMetaItem("calendar", `${formatDate(trip.start)} → ${formatDate(trip.end)}`));
  meta.appendChild(buildMetaItem("clock", `${days ?? "?"} jours`));
  meta.appendChild(buildMetaItem("euro", formatCurrency(total)));
  body.appendChild(meta);

  /* --- Barre de progression --- */
  if (itemsTotal > 0) {
    body.appendChild(buildChecklistBar(done, itemsTotal, percent));
  }

  /* --- Panneau dépliable --- */
  if (isExpanded) {
    body.appendChild(buildChecklistPanel(trip));
  }

  /* --- Footer --- */
  const footer = document.createElement("div");
  footer.className = "card__footer";

  const badge = document.createElement("span");
  badge.className = "badge badge--accent";
  badge.textContent = "Voyage";

  const actions = document.createElement("div");
  actions.append(
    buildIconButton("edit", `Modifier ${trip.name}`, "edit", trip.id),
    buildIconButton("delete", `Supprimer ${trip.name}`, "delete", trip.id)
  );

  footer.append(badge, actions);
  body.appendChild(footer);

  card.appendChild(body);
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

  const labelText = document.createElement("span");
  labelText.className = "card__checklist-label-text";
  labelText.textContent = ` ${done}/${total} · ${percent}%`;
  label.appendChild(labelText);

  wrap.append(bar, label);
  return wrap;
}

/* -------------------------------------------------------------------- */
/* Panneau dépliable avec checklist                                      */
/* -------------------------------------------------------------------- */

function buildChecklistPanel(trip) {
  const panel = document.createElement("div");
  panel.className = "card__checklist-panel";
  panel.dataset.dropZone = trip.id;

  const hint = document.createElement("p");
  hint.className = "card__drop-hint";
  hint.textContent = trip.checklist?.length
    ? "Glissez une affaire ici pour la transférer"
    : "Déposez une affaire ici, ou ajoutez-en une";
  panel.appendChild(hint);

  const list = document.createElement("ul");
  list.className = "card__items-list";
  (trip.checklist ?? []).forEach((item) => {
    list.appendChild(buildChecklistItem(trip.id, item));
  });
  panel.appendChild(list);

  panel.appendChild(buildAddItemForm(trip.id));
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

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "card__item-delete";
  delBtn.dataset.action = "delete-item";
  delBtn.dataset.tripId = tripId;
  delBtn.dataset.itemId = item.id;
  delBtn.setAttribute("aria-label", `Supprimer ${item.text}`);
  delBtn.textContent = "×";

  li.append(handle, checkbox, label, delBtn);
  return li;
}

function buildAddItemForm(tripId) {
  const formEl = document.createElement("div");
  formEl.className = "card__add-item";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "card__add-input";
  input.placeholder = "Ajouter une affaire…";
  input.dataset.itemInput = tripId;

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "btn btn--primary btn--icon";
  addBtn.dataset.action = "add-item";
  addBtn.dataset.id = tripId;
  addBtn.setAttribute("aria-label", "Ajouter");
  addBtn.appendChild(icons.plus());

  formEl.append(input, addBtn);
  return formEl;
}

function buildIconButton(action, ariaLabel, iconName, tripId) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = action === "delete"
    ? "btn btn--danger btn--icon"
    : "btn btn--ghost btn--icon";
  btn.dataset.action = action;
  btn.dataset.id = tripId;
  btn.setAttribute("aria-label", ariaLabel);
  const iconFn = typeof icons[iconName] === "function" ? icons[iconName] : icons.trash;
  btn.appendChild(iconFn());
  return btn;
}

/* -------------------------------------------------------------------- */
/* Mises à jour live                                                     */
/* -------------------------------------------------------------------- */

function updateChecklistProgressUI(tripId) {
  const trip = trips.find((t) => t.id === tripId);
  if (!trip) return;

  const card = grid.querySelector(`[data-trip-id="${tripId}"]`);
  if (!card) return;

  const { done, total, percent } = getChecklistStats(trip);

  const fill = card.querySelector(".card__checklist-fill");
  if (fill) fill.style.width = `${percent}%`;

  const labelText = card.querySelector(".card__checklist-label-text");
  if (labelText) labelText.textContent = ` ${done}/${total} · ${percent}%`;

  const toggleCount = card.querySelector(".card__toggle-count");
  if (toggleCount) toggleCount.textContent = `${done}/${total}`;
}

function updateCountdowns() {
  document.querySelectorAll("[data-role='countdown']").forEach((el) => {
    const card = el.closest("[data-trip-id]");
    const trip = trips.find((t) => t.id === card?.dataset.tripId);
    if (trip) el.textContent = formatCountdown(trip.start);
  });
}

function updateStats(sorted) {
  if (statTripCount) statTripCount.textContent = String(sorted.length);

  const next = sorted.find((t) => new Date(t.start) >= new Date(new Date().toDateString()));
  if (statNextTrip) statNextTrip.textContent = next ? formatDate(next.start) : "—";

  const withChecklist = sorted.filter((t) => t.checklist?.length);
  const avg = withChecklist.length
    ? Math.round(
        withChecklist.reduce((sum, t) => sum + getChecklistStats(t).percent, 0) /
          withChecklist.length
      )
    : 0;

  if (statChecklist) statChecklist.textContent = `${avg}\u00A0%`;
}

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