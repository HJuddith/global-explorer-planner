/**
 * icons.js
 * Bibliothèque centralisée d'icônes SVG inline.
 * Retourne des éléments SVG (Node) prêts à être insérés dans le DOM.
 * 100% safe : aucun innerHTML, aucune chaîne HTML.
 */

const SVG_NS = "http://www.w3.org/2000/svg";

/* -------------------------------------------------------------------- */
/* Définition des tracés (paths, cercles, rects…)                        */
/* -------------------------------------------------------------------- */

const PATHS = {
  /* --- Actions --- */
  plus: [{ tag: "path", attrs: { d: "M12 5v14M5 12h14" } }],
  edit: [
    { tag: "path", attrs: { d: "M12 20h9" } },
    { tag: "path", attrs: { d: "M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" } },
  ],
  trash: [
    { tag: "path", attrs: { d: "M3 6h18" } },
    { tag: "path", attrs: { d: "M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" } },
    { tag: "path", attrs: { d: "M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" } },
    { tag: "path", attrs: { d: "M10 11v6M14 11v6" } },
  ],
  close: [{ tag: "path", attrs: { d: "M18 6L6 18M6 6l12 12" } }],
  check: [{ tag: "polyline", attrs: { points: "20 6 9 17 4 12" } }],

  /* --- Métadonnées voyage --- */
  calendar: [
    { tag: "rect", attrs: { x: 3, y: 4, width: 18, height: 18, rx: 2 } },
    { tag: "path", attrs: { d: "M16 2v4M8 2v4M3 10h18" } },
  ],
  clock: [
    { tag: "circle", attrs: { cx: 12, cy: 12, r: 10 } },
    { tag: "polyline", attrs: { points: "12 6 12 12 16 14" } },
  ],
  euro: [
    { tag: "path", attrs: { d: "M4 10h12M4 14h9" } },
    { tag: "path", attrs: { d: "M18 6.5A8 8 0 1018 17.5" } },
  ],
  suitcase: [
    { tag: "rect", attrs: { x: 2, y: 7, width: 20, height: 14, rx: 2 } },
    { tag: "path", attrs: { d: "M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" } },
    { tag: "path", attrs: { d: "M2 13h20" } },
  ],

  /* --- Checklist --- */
  copy: [
    { tag: "rect", attrs: { x: 9, y: 9, width: 13, height: 13, rx: 2 } },
    { tag: "path", attrs: { d: "M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" } },
  ],
  sparkles: [
    { tag: "path", attrs: { d: "M12 3l1.9 5.8L20 10.7l-5 3.6L16.5 20 12 16.8 7.5 20 9 14.3 4 10.7l6.1-1.9L12 3z" } },
  ],

  /* --- Fonctionnalités --- */
  search: [
    { tag: "circle", attrs: { cx: 11, cy: 11, r: 7 } },
    { tag: "path", attrs: { d: "M21 21l-4.3-4.3" } },
  ],
  globe: [
    { tag: "circle", attrs: { cx: 12, cy: 12, r: 10 } },
    { tag: "path", attrs: { d: "M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" } },
  ],
  download: [
    { tag: "path", attrs: { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" } },
    { tag: "polyline", attrs: { points: "7 10 12 15 17 10" } },
    { tag: "line", attrs: { x1: 12, y1: 15, x2: 12, y2: 3 } },
  ],
  upload: [
    { tag: "path", attrs: { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" } },
    { tag: "polyline", attrs: { points: "17 8 12 3 7 8" } },
    { tag: "line", attrs: { x1: 12, y1: 3, x2: 12, y2: 15 } },
  ],
  palette: [
    { tag: "circle", attrs: { cx: 12, cy: 12, r: 10 } },
    { tag: "circle", attrs: { cx: 8, cy: 10, r: 1.5, fill: "currentColor" } },
    { tag: "circle", attrs: { cx: 12, cy: 7, r: 1.5, fill: "currentColor" } },
    { tag: "circle", attrs: { cx: 16, cy: 10, r: 1.5, fill: "currentColor" } },
    { tag: "circle", attrs: { cx: 14, cy: 16, r: 1.5, fill: "currentColor" } },
  ],
  sun: [
    { tag: "circle", attrs: { cx: 12, cy: 12, r: 4 } },
    { tag: "path", attrs: { d: "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" } },
  ],
  moon: [
    { tag: "path", attrs: { d: "M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" } },
  ],

  /* --- Voyage / navigation --- */
  plane: [
    { tag: "path", attrs: { d: "M17.8 19.2L16 11l3.5-3.5a2.1 2.1 0 00-3-3L13 8 4.8 6.2a1 1 0 00-.9 1.7L9 12l-2 3H4l-1 2 3 1 1 3 2-1v-3l3-2 4.1 5.1a1 1 0 001.7-.9z" } },
  ],
  compass: [
    { tag: "circle", attrs: { cx: 12, cy: 12, r: 10 } },
    { tag: "polygon", attrs: { points: "16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76", fill: "currentColor" } },
  ],
  route: [
    { tag: "circle", attrs: { cx: 6, cy: 19, r: 3 } },
    { tag: "circle", attrs: { cx: 18, cy: 5, r: 3 } },
    { tag: "path", attrs: { d: "M9 19h6a4 4 0 000-8H9a4 4 0 010-8h6", "stroke-dasharray": "4 4" } },
  ],
  mapPin: [
    { tag: "path", attrs: { d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" } },
    { tag: "circle", attrs: { cx: 12, cy: 10, r: 3 } },
  ],
};

/* -------------------------------------------------------------------- */
/* Créateur d'élément SVG                                                */
/* -------------------------------------------------------------------- */

function createIcon(name, size = 20) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("icon");

  (PATHS[name] || []).forEach(({ tag, attrs }) => {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    svg.appendChild(el);
  });

  return svg;
}

/* -------------------------------------------------------------------- */
/* API publique                                                          */
/* -------------------------------------------------------------------- */

export const icons = {
  /* Actions */
  plus: () => createIcon("plus"),
  edit: () => createIcon("edit"),
  trash: () => createIcon("trash"),
  close: () => createIcon("close"),
  check: () => createIcon("check"),

  /* Métadonnées */
  calendar: () => createIcon("calendar"),
  clock: () => createIcon("clock"),
  euro: () => createIcon("euro"),
  suitcase: () => createIcon("suitcase"),

  /* Checklist */
  copy: () => createIcon("copy"),
  sparkles: () => createIcon("sparkles"),

  /* Fonctionnalités */
  search: () => createIcon("search"),
  globe: () => createIcon("globe"),
  download: () => createIcon("download"),
  upload: () => createIcon("upload"),
  palette: () => createIcon("palette"),
  sun: () => createIcon("sun"),
  moon: () => createIcon("moon"),

  /* Voyage */
  plane: () => createIcon("plane"),
  compass: () => createIcon("compass"),
  route: () => createIcon("route"),
  mapPin: () => createIcon("mapPin"),
};