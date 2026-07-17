/**
 * Mframapa manual service worker (fallback / reference implementation).
 * In production the Vite + Workbox-generated SW takes precedence.
 *
 * Strategy:
 *  - Static assets  → Cache First (1 year)
 *  - /api/*         → Network First (10 s timeout, 6 h stale cache)
 *  - Navigation     → Network First (app shell fallback)
 */

const CACHE_VERSION = 'mframapa-v2';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const API_CACHE     = `${CACHE_VERSION}-api`;

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/city-packs/top-cities.v1.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('mframapa-') && k !== STATIC_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstAPI(request));
    return;
  }

  if (url.pathname.startsWith('/city-packs/')) {
    event.respondWith(cacheFirstStatic(request));
    return;
  }

  if (url.hostname.includes('mapbox.com')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNav(request));
    return;
  }

  event.respondWith(cacheFirstStatic(request));
});

async function networkFirstAPI(request) {
  const cache = await caches.open(API_CACHE);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeout);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    clearTimeout(timeout);
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function networkFirstNav(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match('/');
    return cached ?? Response.error();
  }
}

async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    return Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}
