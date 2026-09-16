/**
 * checklist.js
 * Checklist PAR VOYAGE — chaque destination a sa propre liste d'affaires.
 * Persiste directement dans l'objet "trip" correspondant.
 * 100% DOM API — aucun innerHTML.
 */

import { loadData, saveData } from "./storage.js";
import { getTrips, updateTrip } from "./trips.js";
import { icons } from "./icons.js";
import { uid, getFlagEmoji } from "./utils.js";

const ACTIVE_TRIP_KEY = "checklist-active-trip";

const list = document.getElementById("checklist-list");
const form = document.getElementById("checklist-form");
const input = document.getElementById("checklist-input");
const emptyHint = document.getElementById("checklist-empty");
const progressBar = document.getElementById("checklist-progress-bar");
const progressWrap = document.getElementById("checklist-progress");
const statChecklist = document.getElementById("stat-checklist");
const tripSelector = document.getElementById("checklist-trip-selector");

let activeTripId = loadData(ACTIVE_TRIP_KEY, null);

/* -------------------------------------------------------------------- */
/* Initialisation                                                        */
/* -------------------------------------------------------------------- */

export function initChecklist() {
  buildTripSelector();
  ensureActiveTrip();
  render();

  form?.addEventListener("submit", handleAdd);
  list?.addEventListener("click", handleListClick);
  tripSelector?.addEventListener("change", handleTripChange);

  document.getElementById("checklist-duplicate")?.addEventListener("click", handleDuplicate);
  document.getElementById("checklist-template")?.addEventListener("click", handleLoadTemplate);
  document.getElementById("checklist-clear")?.addEventListener("click", handleClear);
}

/* -------------------------------------------------------------------- */
/* Sélecteur de voyage                                                   */
/* -------------------------------------------------------------------- */

function buildTripSelector() {
  if (!tripSelector) return;

  // Reset DOM
  while (tripSelector.firstChild) tripSelector.removeChild(tripSelector.firstChild);

  const trips = getTrips();

  if (trips.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Aucun voyage disponible";
    tripSelector.appendChild(opt);
    tripSelector.disabled = true;
    return;
  }

  tripSelector.disabled = false;
  const sorted = [...trips].sort((a, b) => new Date(a.start) - new Date(b.start));

  sorted.forEach((trip) => {
    const opt = document.createElement("option");
    opt.value = trip.id;

    // Ajoute l'emoji drapeau si un pays est détecté
    const code = extractCountryCode(trip.name);
    const flag = code ? getFlagEmoji(code) + " " : "";

    opt.textContent = `${flag}${trip.name} (${trip.checklist?.length ?? 0})`;
    tripSelector.appendChild(opt);
  });
}

function ensureActiveTrip() {
  const trips = getTrips();

  if (trips.length === 0) {
    activeTripId = null;
    return;
  }

  if (!trips.find((t) => t.id === activeTripId)) {
    activeTripId = trips[0].id;
  }

  if (tripSelector) tripSelector.value = activeTripId;
}

function handleTripChange(event) {
  activeTripId = event.target.value || null;
  saveData(ACTIVE_TRIP_KEY, activeTripId);
  render();
}

/* -------------------------------------------------------------------- */
/* CRUD                                                                  */
/* -------------------------------------------------------------------- */

function handleAdd(event) {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || !activeTripId) return;

  const trip = getTrips().find((t) => t.id === activeTripId);
  if (!trip) return;

  trip.checklist ??= [];
  trip.checklist.push({ id: uid(), text, done: false });

  updateTrip(trip);
  input.value = "";
  render();
  refreshSelector();
}

function handleListClick(event) {
  const checkbox = event.target.closest("[data-role='toggle']");
  const deleteBtn = event.target.closest("[data-action='delete']");

  const trip = getTrips().find((t) => t.id === activeTripId);
  if (!trip || !trip.checklist) return;

  if (checkbox) {
    const item = trip.checklist.find((i) => i.id === checkbox.dataset.id);
    if (item) item.done = checkbox.checked;
    updateTrip(trip);
    render();
  }

  if (deleteBtn) {
    trip.checklist = trip.checklist.filter((i) => i.id !== deleteBtn.dataset.id);
    updateTrip(trip);
    render();
    refreshSelector();
  }
}

function refreshSelector() {
  buildTripSelector();
  if (tripSelector) tripSelector.value = activeTripId;
}

/* -------------------------------------------------------------------- */
/* Actions groupées                                                      */
/* -------------------------------------------------------------------- */

function handleDuplicate() {
  const allTrips = getTrips();
  const sources = allTrips.filter(
    (t) => t.id !== activeTripId && t.checklist?.length
  );

  if (sources.length === 0) {
    alert("Aucun autre voyage ne possède de checklist à copier.");
    return;
  }

  const menu = sources
    .map((t, i) => `${i + 1}. ${t.name} (${t.checklist.length})`)
    .join("\n");

  const choice = prompt(
    `Copier la checklist de quel voyage ?\n\n${menu}\n\nEntrez le numéro :`
  );

  const index = parseInt(choice, 10) - 1;
  if (Number.isNaN(index) || !sources[index]) return;

  const target = allTrips.find((t) => t.id === activeTripId);
  if (!target) return;

  target.checklist ??= [];
  const copied = sources[index].checklist.map((item) => ({
    id: uid(),
    text: item.text,
    done: false,
  }));

  target.checklist.push(...copied);
  updateTrip(target);
  render();
  refreshSelector();
}

function handleLoadTemplate() {
  const trip = getTrips().find((t) => t.id === activeTripId);
  if (!trip) return;

  if (trip.checklist?.length && !confirm("Ajouter le modèle à la checklist existante ?")) {
    return;
  }

  const template = [
    "Passeport / carte d'identité",
    "Billets d'avion / train",
    "Réservation d'hôtel",
    "Assurance voyage",
    "Adaptateur de prise",
    "Chargeur téléphone",
    "Trousse de toilette",
    "Médicaments personnels",
    "Vêtements adaptés à la météo",
    "Espèces / carte bancaire",
  ];

  trip.checklist ??= [];
  template.forEach((text) => {
    trip.checklist.push({ id: uid(), text, done: false });
  });

  updateTrip(trip);
  render();
  refreshSelector();
}

function handleClear() {
  const trip = getTrips().find((t) => t.id === activeTripId);
  if (!trip) return;
  if (!confirm(`Vider toute la checklist de "${trip.name}" ?`)) return;

  trip.checklist = [];
  updateTrip(trip);
  render();
  refreshSelector();
}

/* -------------------------------------------------------------------- */
/* Rendu                                                                 */
/* -------------------------------------------------------------------- */

function render() {
  const trip = getTrips().find((t) => t.id === activeTripId);

  if (!trip) {
    renderNoTrip();
    return;
  }

  renderTripChecklist(trip);
}

function renderNoTrip() {
  while (list.firstChild) list.removeChild(list.firstChild);

  if (emptyHint) {
    emptyHint.hidden = false;
    emptyHint.textContent = "Créez d'abord un voyage pour lui associer une checklist.";
  }

  const submitBtn = form?.querySelector("button[type='submit']");
  if (submitBtn) submitBtn.disabled = true;
  if (input) input.disabled = true;

  updateProgressBar(0);
}

function renderTripChecklist(trip) {
  const submitBtn = form?.querySelector("button[type='submit']");
  if (submitBtn) submitBtn.disabled = false;
  if (input) input.disabled = false;

  const items = trip.checklist ?? [];

  while (list.firstChild) list.removeChild(list.firstChild);

  if (emptyHint) {
    emptyHint.hidden = items.length > 0;
    emptyHint.textContent = items.length === 0
      ? "Aucune affaire pour ce voyage. Ajoutez-en une !"
      : "";
  }

  items.forEach((item) => list.appendChild(buildChecklistItem(item)));

  const done = items.filter((i) => i.done).length;
  const percent = items.length ? Math.round((done / items.length) * 100) : 0;
  updateProgressBar(percent);
}

/* -------------------------------------------------------------------- */
/* Constructeurs DOM                                                     */
/* -------------------------------------------------------------------- */

function buildChecklistItem(item) {
  const li = document.createElement("li");
  li.className = "checklist__item";
  if (item.done) li.classList.add("checklist__item--done");

  /* --- Checkbox --- */
  const checkbox = document.createElement("input");
  checkbox.className = "checklist__checkbox";
  checkbox.type = "checkbox";
  checkbox.id = `item-${item.id}`;
  checkbox.dataset.role = "toggle";
  checkbox.dataset.id = item.id;
  if (item.done) checkbox.checked = true;

  /* --- Label --- */
  const label = document.createElement("label");
  label.className = "checklist__text";
  label.htmlFor = `item-${item.id}`;
  label.textContent = item.text;

  /* --- Bouton supprimer --- */
  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "btn btn--danger btn--icon";
  delBtn.dataset.action = "delete";
  delBtn.dataset.id = item.id;
  delBtn.setAttribute("aria-label", `Supprimer ${item.text}`);
  delBtn.appendChild(icons.trash());

  li.append(checkbox, label, delBtn);
  return li;
}

/* -------------------------------------------------------------------- */
/* Barre de progression                                                  */
/* -------------------------------------------------------------------- */

function updateProgressBar(percent) {
  if (progressBar) progressBar.style.width = `${percent}%`;
  if (progressWrap) progressWrap.setAttribute("aria-valuenow", String(percent));
  if (statChecklist) statChecklist.textContent = `${percent}\u00A0%`;
}

/* Détection pays depuis nom de voyage */
const KEYWORDS = {
  japon: "JP", japan: "JP", tokyo: "JP", kyoto: "JP", osaka: "JP",
  france: "FR", paris: "FR", nice: "FR", lyon: "FR",
  italie: "IT", rome: "IT", venise: "IT",
  espagne: "ES", barcelone: "ES", madrid: "ES",
  portugal: "PT", lisbonne: "PT", porto: "PT",
  maroc: "MA", marrakech: "MA",
  égypte: "EG", egypte: "EG", caire: "EG",
  madagascar: "MG", antananarivo: "MG",
  maurice: "MU", "port louis": "MU",
  seychelles: "SC", comores: "KM",
  "la réunion": "RE", "la reunion": "RE", mayotte: "YT",
  "états-unis": "US", "etats-unis": "US", usa: "US", "new york": "US",
  canada: "CA", montréal: "CA",
  brésil: "BR", bresil: "BR", "rio de janeiro": "BR",
  mexique: "MX", "mexico": "MX",
  allemagne: "DE", berlin: "DE",
  suisse: "CH", genève: "CH",
  grèce: "GR", grece: "GR", athènes: "GR",
  turquie: "TR", istanbul: "TR",
  "royaume-uni": "GB", londres: "GB", london: "GB",
  chine: "CN", pékin: "CN",
  inde: "IN", mumbai: "IN",
  vietnam: "VN", hanoï: "VN",
  corée: "KR", coree: "KR", séoul: "KR",
  thaïlande: "TH", thailande: "TH", bangkok: "TH",
  indonésie: "ID", bali: "ID",
  australie: "AU", sydney: "AU",
  "nouvelle-zélande": "NZ", auckland: "NZ",
};

function extractCountryCode(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const [keyword, code] of Object.entries(KEYWORDS)) {
    if (lower.includes(keyword)) return code;
  }
  return null;
}