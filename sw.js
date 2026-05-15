// NexaCorp ERP — Service Worker
// Caches all assets for offline/PWA functionality

const CACHE_NAME = 'nexa-erp-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/data/finance.csv',
  './assets/data/sales.csv',
  './assets/data/crm.csv',
  './assets/data/production.csv',
  './assets/data/supplychain.csv'
];

// Install: cache all core assets
self.addEventListener('install', function(event) {
  console.log('[SW] Installing NexaCorp ERP Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] Caching app shell and CSV data files');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for CSV data, cache-first for everything else
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Network-first strategy for CSV files (always try to get fresh data)
  if (url.includes('.csv')) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(function() {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first for everything else
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request);
    })
  );
});
