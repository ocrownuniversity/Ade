// ZMONIE Service Worker — v1.2
// Handles offline caching and makes the app installable as a PWA

const CACHE_NAME = 'zmonie-v1';
const STATIC_ASSETS = [
  './',
  './index.html'
];

// Install: cache the shell
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network first, fall back to cache
self.addEventListener('fetch', function(e) {
  // Only handle GET requests and same-origin / CDN assets
  if (e.request.method !== 'GET') return;
  
  // For Firebase / API requests — always go to network, never cache
  var url = e.request.url;
  if (url.includes('firebaseapp.com') ||
      url.includes('googleapis.com') ||
      url.includes('firestore.googleapis.com') ||
      url.includes('identitytoolkit') ||
      url.includes('api.')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        // Cache successful responses for static assets
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        // Network failed — serve from cache
        return caches.match(e.request).then(function(cached) {
          return cached || caches.match('./index.html');
        });
      })
  );
});
