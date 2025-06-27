const CACHE_NAME = 'wu-head-tas-v1';
const NAVIGATION_CACHE = 'wu-head-tas-nav-v1';
const urlsToCache = [
  '/',
  '/offline',
  '/manifest.json',
];

// Navigation routes to prefetch
const navigationRoutes = [
  '/directory',
  '/courses',
  '/semesters',
  '/people',
  '/professors',
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(urlsToCache)),
      // Prefetch navigation routes for offline support
      caches.open(NAVIGATION_CACHE)
        .then((cache) => {
          return Promise.all(
            navigationRoutes.map(route => 
              fetch(route, { mode: 'no-cors' })
                .then(response => cache.put(route, response))
                .catch(() => console.log(`Failed to cache ${route}`))
            )
          );
        })
    ])
  );
});

// Cache and return requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle navigation requests with stale-while-revalidate strategy
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              // Update cache with fresh response
              if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(NAVIGATION_CACHE)
                  .then((cache) => cache.put(request, responseToCache));
              }
              return networkResponse;
            })
            .catch(() => {
              // If offline and no cache, show offline page
              return caches.match('/offline');
            });

          // Return cached response immediately, update in background
          return cachedResponse || fetchPromise;
        })
    );
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(request).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Only cache GET requests
            if (request.method !== 'GET') {
              return response;
            }

            // Don't cache API requests
            if (url.pathname.startsWith('/api/')) {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          }
        );
      })
      .catch(() => {
        // Return offline page if network request fails
        return caches.match('/offline');
      })
  );
});

// Update service worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, NAVIGATION_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});