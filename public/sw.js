// Service Worker for AirSense Pro
// Enables background notifications and caching

const CACHE_NAME = 'airsense-v1';
const CACHE_URLS = [
    '/',
    '/index.html',
    '/logo.png',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(CACHE_URLS);
        })
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activated');
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
    // Only cache GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request).then((response) => {
                // Cache new responses for static assets
                if (response.ok && event.request.url.includes('/assets/')) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            });
        })
    );
});

// Push notification event
self.addEventListener('push', (event) => {
    console.log('[SW] Push received');

    const data = event.data ? event.data.json() : {};
    const title = data.title || '🌬️ AirSense Pro Alert';
    const options = {
        body: data.body || 'Check your air quality',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'aqi-alert',
        requireInteraction: data.critical || false,
        actions: [
            { action: 'open', title: 'Open App' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // Focus existing window if available
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open new window
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// Periodic background sync for AQI checks (if supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'aqi-check') {
        console.log('[SW] Periodic AQI check');
        event.waitUntil(checkAQI());
    }
});

// Background AQI check function
async function checkAQI() {
    try {
        // Get last known location and API key from cache
        const cache = await caches.open('airsense-data');
        const locationData = await cache.match('last-location');
        const keyData = await cache.match('iqair-key');

        if (!locationData) return;

        const { lat, lon } = await locationData.json();

        let key = '';
        if (keyData) {
            const keyJson = await keyData.json();
            key = keyJson.key || '';
        }

        if (!key) return; // Cannot check without API key

        // Fetch current AQI
        const response = await fetch(
            `https://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lon}&key=${key}`
        );

        if (!response.ok) return;

        const data = await response.json();
        const aqi = data.data?.current?.pollution?.aqius;

        if (aqi && aqi >= 150) {
            // Send notification for unhealthy air
            await self.registration.showNotification(
                aqi >= 300 ? '🚨 HAZARDOUS AIR' : '⚠️ Unhealthy Air Quality',
                {
                    body: `Current AQI: ${aqi}. ${aqi >= 300 ? 'Stay indoors!' : 'Limit outdoor activity.'}`,
                    icon: '/logo.png',
                    tag: 'aqi-background',
                    requireInteraction: aqi >= 300
                }
            );
        }
    } catch (error) {
        console.log('[SW] Background AQI check failed:', error);
    }
}
