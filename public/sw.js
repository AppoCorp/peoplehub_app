// Progressive Web App Service Worker for PeopleHub Workspace

const CACHE_NAME = 'peoplehub-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/1.png',
  '/2.png',
  '/hero.png',
];

// Install Event - Pre-cache minimal shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event - Network-first strategy for dynamic resources, fallback to cache
self.addEventListener('fetch', (event) => {
  // Ignore API requests and browser extension resources
  if (
    event.request.url.startsWith(self.location.origin) &&
    !event.request.url.includes('/api/') &&
    event.request.method === 'GET'
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response and save it to the cache
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone);
          });
          return response;
        })
        .catch(() => {
          // Fall back to cache on request failures (offline support)
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // Return index shell if fallback resource is page layout
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/');
            }
          });
        })
    );
  }
});

// Handle Push notifications
self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: data.icon || '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: '1',
        },
      };
      event.waitUntil(
        self.registration.showNotification(data.title || 'PeopleHub Notification', options)
      );
    } catch (e) {
      // Fallback for plain text notifications
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('PeopleHub Workspace', {
          body: text,
          icon: '/icon-192x192.png',
          vibrate: [100, 50, 100],
        })
      );
    }
  }
});

// Handle notification click routing
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window or open a new one
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
