// SwipePath AI — Service Worker v2
const CACHE_NAME = 'swipepath-v2';
const STATIC_ASSETS = ['/', '/index.html', '/style.css', '/app.js', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Never intercept external origins (LinkedIn, Unsplash, Google fonts, etc.)
  if (url.origin !== self.location.origin) return;
  // API calls: network only
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request).catch(() => new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } })));
    return;
  }
  // Images: cache first
  if (event.request.destination === 'image') {
    event.respondWith(caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        return response;
      }).catch(() => cached);
    }));
    return;
  }
  // Everything else: network first, cache fallback
  event.respondWith(
    fetch(event.request).then(response => {
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match(event.request))
  );
});