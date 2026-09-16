/**
 * map.js
 * Carte du monde interactive via Leaflet (CDN).
 * Affiche tous les voyages géolocalisés + un itinéraire optionnel.
 */

import { getTrips } from "./trips.js";
import { icons } from "./icons.js";

let map = null;
let markersLayer = null;
let routeLayer = null;
let showRoute = false;
let isInitialized = false;

/* -------------------------------------------------------------------- */
/* Initialisation                                                        */
/* -------------------------------------------------------------------- */

export function initMap() {
  const container = document.getElementById("world-map");
  if (!container) return;
  if (typeof L === "undefined") {
    console.warn("[map] Leaflet non chargé — vérifie le <script> CDN");
    return;
  }

  // Si déjà initialisé, on ne refait pas la carte
  if (isInitialized) {
    invalidateMap();
    return;
  }

  map = L.map(container, {
    worldCopyJump: true,
    minZoom: 2,
    maxBounds: [[-85, -180], [85, 180]],
  }).setView([25, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
    maxZoom: 19,
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  isInitialized = true;

  // Boutons d'action
  document.getElementById("map-fit-all")?.addEventListener("click", fitAll);
  document.getElementById("map-toggle-route")?.addEventListener("click", toggleRoute);

  renderMap();
}

/* -------------------------------------------------------------------- */
/* Rendu des marqueurs                                                   */
/* -------------------------------------------------------------------- */

export function renderMap() {
  if (!map || !markersLayer) return;

  markersLayer.clearLayers();

  const trips = getTrips().filter((t) => t.lat && t.lng);
  const bounds = [];

  trips.forEach((trip) => {
    const marker = L.circleMarker([trip.lat, trip.lng], {
      radius: 10,
      fillColor: trip.color || "#1a6b5a",
      color: "#c9a227",
      weight: 2,
      fillOpacity: 0.85,
    });

    // Popup construite en DOM (safe)
    const popupContent = document.createElement("div");
    popupContent.className = "map-popup";

    const title = document.createElement("strong");
    title.textContent = trip.name;

    const dates = document.createElement("div");
    dates.textContent = `${trip.start} → ${trip.end}`;

    const checklistInfo = document.createElement("div");
    const done = trip.checklist?.filter((i) => i.done).length || 0;
    const total = trip.checklist?.length || 0;
    checklistInfo.textContent = `${done}/${total} éléments prêts`;
    checklistInfo.style.fontStyle = "italic";
    checklistInfo.style.opacity = "0.8";

    popupContent.append(title, dates, checklistInfo);
    marker.bindPopup(popupContent);

    marker.addTo(markersLayer);
    bounds.push([trip.lat, trip.lng]);
  });

  // Itinéraire
  if (routeLayer) {
    map.removeLayer(routeLayer);
    routeLayer = null;
  }

  if (showRoute && bounds.length >= 2) {
    const sorted = [...trips].sort((a, b) => new Date(a.start) - new Date(b.start));
    routeLayer = L.polyline(
      sorted.map((t) => [t.lat, t.lng]),
      {
        color: "#c9a227",
        weight: 3,
        dashArray: "8 12",
        opacity: 0.8,
      }
    ).addTo(map);
  }

  // Zoom auto si au moins un point
  if (bounds.length) {
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 6 });
  }
}

/* -------------------------------------------------------------------- */
/* Contrôles                                                            */
/* -------------------------------------------------------------------- */

export function toggleRoute() {
  showRoute = !showRoute;
  renderMap();
}

export function fitAll() {
  if (!map) return;
  const points = getTrips()
    .filter((t) => t.lat && t.lng)
    .map((t) => [t.lat, t.lng]);
  if (points.length) {
    map.fitBounds(points, { padding: [60, 60] });
  } else {
    map.setView([25, 0], 2);
  }
}

export function invalidateMap() {
  // Leaflet a besoin de recalculer la taille quand le conteneur devient visible
  map?.invalidateSize();
}