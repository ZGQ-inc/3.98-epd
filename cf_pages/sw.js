// sw.js — Service Worker for 3.98" BWRY E-Paper Open Badge PWA
// Provides 100% offline capability for Cloudflare Pages deployment

const CACHE_NAME = 'epd-pwa-v2.1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
  './css/theme.css',
  './css/layout.css',
  './css/components.css',
  './css/studios.css',
  './js/qrcode.js',
  './js/dither.js',
  './js/device.js',
  './js/presets.js',
  './js/canvas.js',
  './js/studio.js',
  './js/ui.js',
  './js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching static assets for 100% offline usage...');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Pass-through for local hardware REST API calls (like http://192.168.x.x/api/...)
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.port === '80') {
    return;
  }

  // Network first for index/html, falling back to cache when offline
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
