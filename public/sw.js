// Rivlet Executive Console - Auto-clean & Self-Unregistering Service Worker
// Automatically purges stale caches and unregisters to guarantee live sync with the newest UI.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map((name) => caches.delete(name)));
    }).then(() => {
      return self.registration.unregister();
    })
  );
  self.clients.claim();
});

// Pass through all network requests directly - NEVER serve stale HTML/JS
self.addEventListener('fetch', () => {
  // Let the browser handle standard fetch directly
  return;
});
