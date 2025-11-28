const CACHE_NAME = "samriddhi-cache-v1";

// Only cache static assets (images, fonts, CSS)
// DO NOT cache HTML or JS (prevents React/typing freeze issues)
const ASSETS_TO_CACHE = [
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png"
];

// Install SW — cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate SW — remove old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch handler — network first, cache fallback only for static files
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache HTML or JS — let React always update
  if (
    event.request.destination === "document" ||
    event.request.destination === "script"
  ) {
    return;
  }

  // Cache images, fonts, CSS, icons only
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).then((networkResponse) => {
          if (
            networkResponse &&
            (event.request.destination === "image" ||
              event.request.destination === "style" ||
              event.request.destination === "font")
          ) {
            // Save static assets to cache
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
      );
    })
  );
});
