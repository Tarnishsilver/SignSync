// Dummy Service Worker to prevent 404 errors from the avatar engine
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', () => {
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Just pass through
    event.respondWith(fetch(event.request));
});
