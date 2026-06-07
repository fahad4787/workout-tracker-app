/**
 * FahadFit service worker — offline app shell
 */
const CACHE = 'fahadfit-v7';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon.svg',
  './css/tailwind.css',
  './css/custom.css',
  './css/fonts/plus-jakarta-sans-latin-wght-normal.woff2',
  './css/fonts/plus-jakarta-sans-latin-wght-italic.woff2',
  './css/fonts/unbounded-latin-wght-normal.woff2',
  './js/utils.js',
  './js/icons.js',
  './js/storage.js',
  './js/calories.js',
  './js/exercises.js',
  './js/exercise-media.js',
  './js/workouts.js',
  './js/audio.js',
  './js/app.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const network = fetch(event.request)
          .then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE).then((cache) => cache.put(event.request, clone));
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Exercise GIFs: cache-first after first load (offline gym)
  if (url.hostname.includes('exercisedb.dev')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const network = fetch(event.request)
          .then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE).then((cache) => cache.put(event.request, clone));
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
