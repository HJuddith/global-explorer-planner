/**
 * countries.js
 * Recherche de pays via SampleAPIs + Météo & Heure locale via Open-Meteo.
 */

const API_COUNTRIES = "https://api.sampleapis.com/countries/countries";
const API_WEATHER = "https://api.open-meteo.com/v1/forecast";
const DEBOUNCE_MS = 300;

const resultsContainer = document.getElementById("countries-results");
const searchInput = document.getElementById("country-search-input");
const searchForm = document.getElementById("country-search-form");

let allCountriesData = [];
let debounceTimer = null;

export async function initCountries() {
  showStatus("Chargement des pays…");

  // Téléchargement initial de la liste complète de SampleAPIs
  try {
    const res = await fetch(API_COUNTRIES);
    if (!res.ok) throw new Error(`Erreur HTTP : ${res.status}`);
    
    allCountriesData = await res.json();
    showStatus("Entrez le nom d'un pays pour rechercher.");
  } catch (error) {
    console.error("[countries] Échec du chargement :", error);
    showStatus("Impossible de charger la liste des pays.", true);
  }

  // Événement Saisie
  searchInput?.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim();
    if (!query) {
      resultsContainer.innerHTML = "";
      return;
    }
    debounceTimer = setTimeout(() => searchCountries(query), DEBOUNCE_MS);
  });

  // Événement Soumission Formulaire
  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim();
    if (query) searchCountries(query);
  });
}

export function searchFromExternalInput(query) {
  if (searchInput) searchInput.value = query;
  searchCountries(query);
}

function searchCountries(query) {
  if (!allCountriesData.length) return;

  const cleanQuery = query.toLowerCase();

  // Filtrage local sur le nom du pays ou la capitale
  const filteredCountries = allCountriesData.filter((c) => {
    const name = c.name ? c.name.toLowerCase() : "";
    const capital = c.capital ? c.capital.toLowerCase() : "";
    return name.includes(cleanQuery) || capital.includes(cleanQuery);
  });

  renderResults(filteredCountries, query);
}

/**
 * Interroge Open-Meteo à partir de la ville/capitale
 */
async function fetchWeatherAndLocalTime(capitalName) {
  if (!capitalName) return null;

  try {
    // 1. Géocodage du nom de la capitale via Open-Meteo Geocoding
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(capitalName)}&count=1&language=fr&format=json`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) return null;
    
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) return null;

    const { latitude, longitude } = geoData.results[0];

    // 2. Météo et Fuseau horaire
    const weatherUrl = `${API_WEATHER}?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) return null;

    const weatherData = await weatherRes.json();

    const localTime = new Date().toLocaleTimeString("fr-FR", {
      timeZone: weatherData.timezone,
      hour: "2-digit",
      minute: "2-digit"
    });

    return {
      temp: Math.round(weatherData.current_weather.temperature),
      weatherCode: weatherData.current_weather.weathercode,
      time: localTime
    };
  } catch (error) {
    console.warn(`[weather] Erreur pour ${capitalName} :`, error);
    return null;
  }
}

async function renderResults(countries, query) {
  resultsContainer.innerHTML = "";

  if (countries.length === 0) {
    showStatus(`Aucun résultat pour "${query}".`);
    return;
  }

  // Traitement et récupération parallèle de la météo pour les 12 premiers résultats
  const cardsPromises = countries.slice(0, 12).map(async (country) => {
    const name = country.name || "Pays inconnu";
    const capital = country.capital || "Non renseignée";
    const population = country.population ? country.population.toLocaleString("fr-FR") : "N/A";
    const currency = country.currency || "N/A";
    const flagUrl = `https://flagcdn.com/w80/${country.abbreviation?.toLowerCase()}.png`;

    const weatherData = await fetchWeatherAndLocalTime(country.capital);

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card__media">
        <img class="country-card__flag" src="${flagUrl}" alt="Drapeau de ${escapeHtml(name)}" loading="lazy" decoding="async" />
      </div>
      <div class="card__body">
        <h3 class="card__title">${escapeHtml(name)}</h3>
        
        <div class="country-card__stats">
          <span>🏛️ <strong>Capitale :</strong> ${escapeHtml(capital)}</span>
          ${
            weatherData
              ? `<span>🕒 <strong>Heure locale :</strong> ${weatherData.time}</span>
                 <span>🌡️ <strong>Météo :</strong> ${getWeatherIcon(weatherData.weatherCode)} ${weatherData.temp}°C</span>`
              : `<span>🕒 <strong>Heure & Météo :</strong> Indisponible</span>`
          }
          <span>👥 <strong>Population :</strong> ${population}</span>
          <span>💱 <strong>Devise :</strong> ${escapeHtml(currency)}</span>
        </div>
      </div>
    `;

    return card;
  });

  const cards = await Promise.all(cardsPromises);
  cards.forEach((card) => resultsContainer.appendChild(card));
}

function getWeatherIcon(code) {
  if (code === 0) return "☀️";
  if (code >= 1 && code <= 3) return "⛅";
  if (code >= 45 && code <= 48) return "🌫️";
  if (code >= 51 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 95) return "⛈️";
  return "🌡️";
}

function showStatus(message, isError = false) {
  resultsContainer.innerHTML = `<p class="status-message${isError ? " status-message--error" : ""}">${escapeHtml(message)}</p>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}