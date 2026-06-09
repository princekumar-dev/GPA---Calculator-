// Service Worker for Push Notifications
const CACHE_NAME = 'msec-connect-v2';
const urlsToCache = [
  '/',
  '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        // Use addAll with error handling - cache only what's available
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn('Service Worker: Failed to cache', url, err);
              return null;
            })
          )
        );
      })
      .then(() => self.skipWaiting())
      .catch(err => {
        console.error('Service Worker: Installation failed', err);
        return self.skipWaiting();
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - with error handling
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // For HTML navigations, use Network First, falling back to cache.
  // This ensures users always get the latest index.html pointing to correct asset hashes.
  if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update the cache with the latest version
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network is absent, fall back to cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If there's no cache, return the root cache as a last resort
            return caches.match('/');
          });
        })
    );
    return;
  }

  // For other requests (like assets), use Cache First strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if available
        if (response) {
          return response;
        }
        
        // Try to fetch from network
        return fetch(event.request)
          .catch((error) => {
            // Log error but don't throw - let browser handle it
            console.warn('Service Worker: Fetch failed for', event.request.url, error);
            // Return a basic response for failed requests to prevent error spam
            return new Response('Service Worker: Network request failed', {
              status: 408,
              statusText: 'Request Timeout',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Push Notification Event - Robust handling and async parsing
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received', event);
  event.waitUntil((async () => {
    let notificationData = {
      title: 'MSEC Academics',
      body: 'You have a new notification',
      icon: '/images/android-chrome-192x192.png',
      badge: '/images/favicon-32x32.png',
      vibrate: [200, 100, 200],
      tag: 'msec-notification',
      requireInteraction: false,
      silent: false,
      renotify: true,
      dir: 'auto',
      lang: 'en-US',
      data: {}
    };

    // Parse push data (prefer JSON, fall back to text)
    if (event.data) {
      try {
        const data = event.data.json();
        notificationData = {
          ...notificationData,
          ...data,
          icon: data.icon || notificationData.icon,
          badge: data.badge || notificationData.badge,
          data: data.data || {},
          tag: data.tag || notificationData.tag
        };
      } catch (err) {
        try {
          const txt = event.data && event.data.text ? await event.data.text() : '';
          notificationData.body = txt || notificationData.body;
        } catch (e2) {
          console.error('Error reading push data:', e2);
        }
      }
    }

    const notificationOptions = {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      vibrate: notificationData.vibrate,
      tag: notificationData.tag || `notification-${Date.now()}`,
      requireInteraction: notificationData.requireInteraction || false,
      silent: notificationData.silent || false,
      renotify: true,
      timestamp: Date.now(),
      data: notificationData.data || {},
      dir: notificationData.dir || 'auto',
      lang: notificationData.lang || 'en-US',
      image: notificationData.image,
      actions: notificationData.actions || []
    };

    // Notify clients
    const notifyPromise = (async () => {
      try {
        const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of allClients) {
          try {
            client.postMessage({ type: 'NOTIFICATION_RECEIVED', title: notificationData.title, body: notificationData.body, data: { ...notificationData.data, timestamp: Date.now() } });
          } catch (e) {
            // ignore per-client failures
          }
        }
      } catch (e) {
        // ignore matching errors
      }
    })();

    // Show notification
    const showPromise = (async () => {
      try {
        await self.registration.showNotification(notificationData.title || 'MSEC Academics', notificationOptions);
      } catch (e) {
        // log but don't rethrow
        console.error('Error showing notification in SW:', e);
      }
    })();

    try { await Promise.all([notifyPromise, showPromise]); } catch (e) { /* ignore */ }
  })());
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();

  // Handle action buttons
  if (event.action === 'close') {
    return;
  }

  // Open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          const url = event.notification.data?.url || '/';
          return clients.openWindow(url);
        }
      })
  );
});

// Background Sync (for offline actions)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event);
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  }
});

async function syncBookings() {
  // Implement booking sync logic here
  console.log('Syncing bookings...');
}

// Message handler - accept admin commands from pages
self.addEventListener('message', (event) => {
  try {
    const msg = event && event.data ? event.data : null;
    if (!msg || !msg.type) return;

    if (msg.type === 'FORCE_RELOAD' || msg.type === 'FORCE_UPDATE') {
      // Attempt to navigate/reload all client windows so they pick up latest assets
      event.waitUntil((async () => {
        try {
          const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
          for (const client of allClients) {
            try {
              // Try to navigate the client to its current URL (forces reload)
              if (client.navigate) {
                await client.navigate(client.url);
              } else {
                // Fallback: send a message to the client and let it handle reload
                client.postMessage({ type: 'RELOAD_REQUEST', reason: msg.type });
              }
            } catch (e) {
              try { client.postMessage({ type: 'RELOAD_REQUEST', reason: msg.type }); } catch (err) { /* ignore */ }
            }
          }
        } catch (e) {
          // ignore
        }
      })());
    }
  } catch (e) {
    // ignore malformed messages
  }
});
