/**
 * plannerForm.js
 * Planificateur de séjour : destination (autocomplete API), durée, budget,
 * hint de budget et conversion en devise locale.
 *
 * - Liste des pays : SampleAPIs
 * - Devise locale  : REST Countries (source officielle)
 * - Taux de change : open.er-api.com
 */

import {
  computeDuration,
  computeBudget,
  formatCurrency,
  formatCountdown,
} from "./planner.js";

/* -------------------------------------------------------------------- */
/* Références DOM                                                        */
/* -------------------------------------------------------------------- */

const form = document.getElementById("planner-form");
const destinationInput = document.getElementById("planner-destination");
const destinationResults = document.getElementById("planner-destination-results");
const destinationCode = document.getElementById("planner-destination-code");
const selectedFlag = document.getElementById("planner-selected-flag");
const clearBtn = document.getElementById("planner-destination-clear");
const autocomplete = document.getElementById("planner-destination-autocomplete");

const durationOut = document.getElementById("planner-duration");
const totalOut = document.getElementById("planner-total");
const countdownOut = document.getElementById("planner-countdown");
const destinationNameOut = document.getElementById("planner-destination-label");
const budgetHint = document.getElementById("planner-budget-hint");
const conversionRow = document.getElementById("planner-conversion-row");
const convertedOut = document.getElementById("planner-converted");

/* -------------------------------------------------------------------- */
/* État                                                                  */
/* -------------------------------------------------------------------- */

let tickInterval = null;
let allCountries = [];
let selectedCountry = null;  // { code, name, currency }
let activeResultIndex = -1;
let visibleResults = [];

/* -------------------------------------------------------------------- */
/* Cache                                                                 */
/* -------------------------------------------------------------------- */

const currencyCache = {};  // { "FR": "EUR", "MG": "MGA", ... }
const rateCache = {};      // { "EUR-MGA": 4800, ... }

/* -------------------------------------------------------------------- */
/* Initialisation                                                        */
/* -------------------------------------------------------------------- */

export async function initPlannerForm() {
  await loadCountries();
  initAutocomplete();

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    compute();
  });

  form?.addEventListener("input", (event) => {
    // Recalcul auto sauf si on tape dans la recherche destination
    if (event.target.id !== "planner-destination") {
      if (form.start.value && form.end.value && form.budget.value) compute();
    }
  });
}

/* -------------------------------------------------------------------- */
/* Chargement des pays via API                                           */
/* -------------------------------------------------------------------- */

async function loadCountries() {
  try {
    const res = await fetch("https://api.sampleapis.com/countries/countries");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();

    allCountries = raw
      .map((c) => {
        const name = c.name || "";
        const code = (c.abbreviation || c.alpha2Code || "").toUpperCase();
        if (!name || !code) return null;
        return {
          name,
          code,
          capital: c.capital || "",
          currency: c.currency || "",
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));

    console.info(`[planner] ${allCountries.length} pays chargés`);
  } catch (err) {
    console.warn("[planner] Impossible de charger les pays :", err);
    allCountries = [];
  }
}

/* -------------------------------------------------------------------- */
/* Autocomplete                                                          */
/* -------------------------------------------------------------------- */

function initAutocomplete() {
  if (!destinationInput || !destinationResults) return;

  destinationInput.addEventListener("focus", () => {
    renderResults(destinationInput.value);
  });

  destinationInput.addEventListener("input", (e) => {
    renderResults(e.target.value);
  });

  destinationInput.addEventListener("keydown", handleKeydown);

  // mousedown au lieu de click (évite le blur prématuré)
  destinationResults.addEventListener("mousedown", handleResultMouseDown);

  // Fermer au clic extérieur
  document.addEventListener("mousedown", (e) => {
    if (!autocomplete.contains(e.target)) closeResults();
  });

  clearBtn?.addEventListener("click", clearSelection);
}

function renderResults(query) {
  if (!destinationResults) return;

  const q = (query || "").toLowerCase().trim();

  visibleResults = !q
    ? allCountries.slice(0, 100)
    : allCountries.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 100);

  while (destinationResults.firstChild) {
    destinationResults.removeChild(destinationResults.firstChild);
  }

  if (visibleResults.length === 0) {
    const empty = document.createElement("li");
    empty.className = "autocomplete__empty";
    empty.textContent = "Aucun pays trouvé";
    destinationResults.appendChild(empty);
  } else {
    visibleResults.forEach((country, i) => {
      destinationResults.appendChild(buildResultItem(country, i));
    });
  }

  destinationResults.hidden = false;
  destinationInput?.setAttribute("aria-expanded", "true");
  activeResultIndex = 0;
  updateActiveHighlight();
}

function buildResultItem(country, index) {
  const li = document.createElement("li");
  li.className = "autocomplete__item";
  li.role = "option";
  li.dataset.code = country.code;
  li.dataset.index = String(index);
  li.id = `autocomplete-item-${index}`;
  li.tabIndex = -1;

  const flag = document.createElement("img");
  flag.className = "autocomplete__item-flag";
  flag.src = `https://flagcdn.com/w40/${country.code.toLowerCase()}.png`;
  flag.alt = "";
  flag.loading = "lazy";
  flag.decoding = "async";
  flag.addEventListener("error", () => flag.remove());

  const name = document.createElement("span");
  name.className = "autocomplete__item-name";
  name.textContent = country.name;

  li.append(flag, name);

  if (country.capital) {
    const capital = document.createElement("span");
    capital.className = "autocomplete__item-capital";
    capital.textContent = country.capital;
    li.appendChild(capital);
  }

  return li;
}

function handleKeydown(e) {
  const items = destinationResults?.querySelectorAll(".autocomplete__item");
  if (!items || items.length === 0) return;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      activeResultIndex = Math.min(activeResultIndex + 1, items.length - 1);
      updateActiveHighlight();
      break;

    case "ArrowUp":
      e.preventDefault();
      activeResultIndex = Math.max(activeResultIndex - 1, 0);
      updateActiveHighlight();
      break;

    case "Enter":
      e.preventDefault();
      if (activeResultIndex >= 0 && visibleResults[activeResultIndex]) {
        selectCountry(visibleResults[activeResultIndex]);
      }
      break;

    case "Escape":
      e.preventDefault();
      closeResults();
      break;

    case "Home":
      e.preventDefault();
      activeResultIndex = 0;
      updateActiveHighlight();
      break;

    case "End":
      e.preventDefault();
      activeResultIndex = items.length - 1;
      updateActiveHighlight();
      break;
  }
}

function updateActiveHighlight() {
  const items = destinationResults?.querySelectorAll(".autocomplete__item");
  if (!items) return;

  items.forEach((el, i) => {
    if (i === activeResultIndex) {
      el.classList.add("is-active");
      el.setAttribute("aria-selected", "true");
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else {
      el.classList.remove("is-active");
      el.setAttribute("aria-selected", "false");
    }
  });
}

function handleResultMouseDown(e) {
  const item = e.target.closest(".autocomplete__item");
  if (!item) return;

  e.preventDefault();
  const code = item.dataset.code;
  const country = allCountries.find((c) => c.code === code);
  if (country) selectCountry(country);
}

/* -------------------------------------------------------------------- */
/* Sélection d'un pays                                                   */
/* -------------------------------------------------------------------- */

async function selectCountry(country) {
  selectedCountry = country;

  if (destinationInput) destinationInput.value = country.name;
  if (destinationCode) destinationCode.value = country.code;
  updateInputFlag(country.code);

  if (clearBtn) clearBtn.hidden = false;
  if (destinationNameOut) destinationNameOut.textContent = country.name;
  updateResultFlag(country.code);

  // 🎯 Récupération dynamique de la devise (asynchrone)
  if (budgetHint) budgetHint.textContent = "Chargement de la devise…";
  const currency = await getCurrencyForCountry(country);
  selectedCountry.currency = currency;

  if (budgetHint) {
    budgetHint.textContent = currency
      ? `Devise locale : ${currency}`
      : "";
  }

  closeResults();
  compute();
}

function clearSelection() {
  selectedCountry = null;
  if (destinationInput) destinationInput.value = "";
  if (destinationCode) destinationCode.value = "";
  if (clearBtn) clearBtn.hidden = true;
  if (budgetHint) budgetHint.textContent = "";
  if (destinationNameOut) destinationNameOut.textContent = "Simulation libre";
  updateInputFlag(null);
  updateResultFlag(null);
  closeResults();
  compute();
}

function closeResults() {
  if (destinationResults) destinationResults.hidden = true;
  destinationInput?.setAttribute("aria-expanded", "false");
  activeResultIndex = -1;
}

/* -------------------------------------------------------------------- */
/* Drapeaux                                                              */
/* -------------------------------------------------------------------- */

function updateInputFlag(code) {
  if (!selectedFlag) return;
  while (selectedFlag.firstChild) selectedFlag.removeChild(selectedFlag.firstChild);

  if (!code) {
    selectedFlag.hidden = true;
    return;
  }

  selectedFlag.hidden = false;
  const img = document.createElement("img");
  img.src = `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
  img.alt = "";
  img.className = "autocomplete__flag-img";
  selectedFlag.appendChild(img);
}

function updateResultFlag(code) {
  const flagEl = document.getElementById("planner-destination-flag");
  if (!flagEl) return;

  while (flagEl.firstChild) flagEl.removeChild(flagEl.firstChild);

  if (!code) {
    flagEl.hidden = true;
    return;
  }

  flagEl.hidden = false;
  const img = document.createElement("img");
  img.src = `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
  img.alt = "";
  img.className = "planner__flag-img";
  flagEl.appendChild(img);
}

/* -------------------------------------------------------------------- */
/* Devise du pays (via REST Countries)                                   */
/* -------------------------------------------------------------------- */

/**
 * Récupère la devise d'un pays via l'API REST Countries.
 * Résultat mis en cache pour éviter les appels répétés.
 * @param {object} country — { code, name }
 * @returns {Promise<string|null>} — ex: "MGA", "EUR", "JPY"
 */
async function getCurrencyForCountry(country) {
  if (!country?.code) return null;

  const code = country.code.toUpperCase();

  // Cache
  if (currencyCache[code] !== undefined) {
    return currencyCache[code];
  }

  try {
    const res = await fetch(
      `https://restcountries.com/v3.1/alpha/${code}?fields=currencies`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const currencies = data?.currencies || {};
    const currency = Object.keys(currencies)[0] || null;

    currencyCache[code] = currency;
    return currency;
  } catch (err) {
    console.warn(`[planner] REST Countries échec pour ${code} :`, err);
    currencyCache[code] = null;
    return null;
  }
}

/* -------------------------------------------------------------------- */
/* Calcul                                                                */
/* -------------------------------------------------------------------- */

async function compute() {
  const start = document.getElementById("planner-start");
  const end = document.getElementById("planner-end");
  const budget = document.getElementById("planner-budget");
  if (!start || !end || !budget) return;

  const days = computeDuration(start.value, end.value);

  if (days === null) {
    if (durationOut) durationOut.textContent = "—";
    if (totalOut) totalOut.textContent = "—";
    if (countdownOut) countdownOut.textContent = "Vérifiez les dates.";
    if (conversionRow) conversionRow.hidden = true;
    return;
  }

  const totalBudget = computeBudget(days, Number(budget.value));
  if (durationOut) durationOut.textContent = `${days} jour${days > 1 ? "s" : ""}`;
  if (totalOut) totalOut.textContent = formatCurrency(totalBudget);

  // Conversion en devise locale
  await updateConversion(totalBudget);

  // Countdown
  clearInterval(tickInterval);
  updateCountdown(start.value);
  tickInterval = setInterval(() => updateCountdown(start.value), 1000 * 30);
}

async function updateConversion(totalBudget) {
  if (!conversionRow || !convertedOut) return;

  // Pas de pays sélectionné → masquer
  if (!selectedCountry) {
    conversionRow.hidden = true;
    return;
  }

  const currency = selectedCountry.currency;
  if (!currency) {
    conversionRow.hidden = true;
    return;
  }

  // Si déjà en euros → masquer (ou afficher tel quel)
  if (currency === "EUR") {
    conversionRow.hidden = true;
    return;
  }

  // Afficher et convertir
  conversionRow.hidden = false;
  convertedOut.textContent = "Conversion en cours…";

  try {
    const converted = await convertCurrency(totalBudget, currency);
    convertedOut.textContent = `${converted.toLocaleString("fr-FR")} ${currency}`;
  } catch (err) {
    console.warn("[planner] Conversion échouée :", err);
    convertedOut.textContent = `— ${currency}`;
  }
}

function updateCountdown(startDate) {
  if (countdownOut) countdownOut.textContent = formatCountdown(startDate);
}

/* -------------------------------------------------------------------- */
/* Conversion de devise (via open.er-api.com)                            */
/* -------------------------------------------------------------------- */

async function convertCurrency(amount, toCurrency) {
  if (toCurrency === "EUR") return amount;

  const key = `EUR-${toCurrency}`;
  if (rateCache[key] !== undefined) {
    return Math.round(amount * rateCache[key]);
  }

  const res = await fetch("https://open.er-api.com/v6/latest/EUR");
  if (!res.ok) throw new Error("Erreur API devise");

  const data = await res.json();
  if (!data.rates) throw new Error("Format de réponse invalide");

  // Cache global de tous les taux
  Object.entries(data.rates).forEach(([code, value]) => {
    rateCache[`EUR-${code}`] = value;
  });

  const rate = data.rates[toCurrency];
  if (!rate) throw new Error(`Devise ${toCurrency} non supportée`);

  return Math.round(amount * rate);
}