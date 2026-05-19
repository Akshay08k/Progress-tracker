const CACHE_NAME = 'stitchxp-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// Install event - Cache the application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Cache strategy: Stale-While-Revalidate for local assets, Network-only for Firebase
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass third-party scripts, Firebase Auth, Firestore long-polling, and Firestore WebSockets
  if (
    url.origin !== self.location.origin ||
    event.request.method !== 'GET' ||
    url.pathname.includes('/api/') ||
    event.request.url.includes('firebase') ||
    event.request.url.includes('googleapis') ||
    event.request.url.includes('firestore')
  ) {
    // Network only for dynamic API/Firebase data
    return;
  }

  // Stale-While-Revalidate for local static frontend assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update for cache
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch((err) => console.log('[Service Worker] BG fetch failed:', err));

        return cachedResponse;
      }

      // If not in cache, fallback to network
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cache the newly fetched asset
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});
