/**
 * MDE Accountability App — Service Worker
 *
 * ANNUAL UPDATE INSTRUCTIONS:
 * When publishing a new MDE manual year, increment CACHE_NAME below
 * (e.g. 'mde-acct-v2026-1') AND update version.json.
 * All installed users will automatically receive an "Update Available" banner.
 */

const CACHE_NAME = 'mde-acct-v2025-1';

const ASSETS = [
  './index.html',
  './manifest.json',
  './version.json',
  './icon.svg',
  './icon-maskable.svg'
];

// Install: cache all app assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  // Do NOT skipWaiting here — let the app control when to activate
  // so users see the "Update Available" banner first
});

// Activate: delete all old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: serve from cache first, update cache in background (stale-while-revalidate)
self.addEventListener('fetch', event => {
  // Only handle GET requests for same-origin assets
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(cached => {
        const networkFetch = fetch(event.request)
          .then(response => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => null);

        // Return cached version immediately; background-refresh the cache
        return cached || networkFetch;
      })
    )
  );
});

// Message handler: app sends 'SKIP_WAITING' when user approves the update
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
