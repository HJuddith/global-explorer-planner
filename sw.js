/**
 * sw.js
 * Service Worker minimal pour le mode hors-ligne (PWA).
 */

const CACHE_VERSION = "gep-v2"; // Incrémenté pour forcer la mise à jour

const ASSETS = [
  "./",
  "./index.html",
  "./css/variables.css",
  "./css/base.css",
  "./css/layout.css",
  "./css/components.css",
  "./css/responsive.css",
  "./js/main.js",
  "./manifest.json",
];

/* -------------------------------------------------------------------- */
/* Installation                                                          */
/* -------------------------------------------------------------------- */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

/* -------------------------------------------------------------------- */
/* Activation — supprime les anciennes versions                          */
/* -------------------------------------------------------------------- */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

/* -------------------------------------------------------------------- */
/* Fetch — la partie CRITIQUE                                            */
/* -------------------------------------------------------------------- */

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // 1. Ignorer les requêtes non-GET
  if (request.method !== "GET") return;

  // 2. Parser l'URL en toute sécurité
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // 3. IGNORER les schémas non-HTTP (chrome-extension, file, etc.)
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return; // ← LA LIGNE QUI CORRIGE L'ERREUR
  }

  // 4. Ne pas interférer avec les APIs externes et CDN
  const skipHosts = [
    "api.sampleapis.com",
    "api.open-meteo.com",
    "geocoding-api.open-meteo.com",
    "unpkg.com",
    "fonts.googleapis.com",
    "fonts.gstatic.com",
    "tile.openstreetmap.org",
  ];
  if (skipHosts.some((h) => url.hostname.includes(h))) return;

  // 5. Cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((res) => {
          // Ne cacher que les réponses valides et cachables
          if (!res || !res.ok || res.type === "opaque") return res;

          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => {
            try {
              c.put(request, copy);
            } catch {
              // URL non cachable
            }
          });

          return res;
        })
        .catch(() => new Response("", { status: 503 }));
    })
  );
});