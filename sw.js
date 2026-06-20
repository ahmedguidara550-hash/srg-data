// SRG — Service Worker
// Mise en cache des fichiers statiques pour fonctionnement hors-ligne.
// Les données JSON (GitHub) ne sont JAMAIS mises en cache ici — c'est
// index.html qui gère son propre cache via localStorage pour avoir
// toujours la donnée la plus fraîche possible quand le réseau est dispo.

const CACHE_NAME = "srg-static-v1";
const STATIC_FILES = [
  "./index.html",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ne jamais intercepter les requêtes vers raw.githubusercontent.com
  // (les données dynamiques) — laisser le réseau ou l'échec gérer ça
  // dans index.html via son propre fallback localStorage.
  if (url.hostname.includes("githubusercontent.com")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => cached);
    })
  );
});