const CACHE = 'dailystack-v4';

const LOCAL = [
  './app.html',
  './data.jsx',
  './grid.jsx',
  './analysis.jsx',
  './trackers.jsx',
  './goals.jsx',
  './onboarding.jsx',
  './reminders.jsx',
  './app-main.jsx',
  './manifest.json',
  './icon.svg',
];

const CDN = [
  'https://unpkg.com/react@18.3.1/umd/react.development.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js',
];

// Pre-cache everything on install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled([
        cache.addAll(LOCAL),
        ...CDN.map((url) => fetch(url).then((r) => cache.put(url, r)).catch(() => {})),
      ])
    ).then(() => self.skipWaiting())
  );
});

// Remove old caches on activate
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Serve from cache, fall back to network, cache new responses
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Skip non-http(s)
  if (!url.protocol.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        return response;
      }).catch(() => cached);
    })
  );
});
