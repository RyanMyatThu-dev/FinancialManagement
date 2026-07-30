const CACHE_NAME = "st-finance-v3";
const ASSETS_TO_CACHE = [
  "/logo.png",
  "/logo-large.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Purging old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // DO NOT intercept:
  // 1. Non-GET requests
  // 2. Navigation requests (HTML pages) -> Let browser & Vercel handle routing/redirects natively
  // 3. API endpoints
  // 4. Next.js static asset chunks (_next) -> Handled with immutable headers by Vercel
  // 5. External requests
  if (
    event.request.method !== "GET" ||
    event.request.mode === "navigate" ||
    event.request.url.includes("/api/") ||
    event.request.url.includes("_next") ||
    !event.request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  // Cache static public assets (images, icons)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});


