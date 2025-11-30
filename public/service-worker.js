self.addEventListener("install", (event) => {
  console.log("Service Worker Installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker Activated");
});

// Optional: Cache files (basic offline support)
self.addEventListener("fetch", (event) => {
  // Use a network-first strategy for navigation requests (your HTML pages).
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Use a cache-first strategy for all other requests (images, CSS, etc.).
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return the cached response if it exists.
      // Otherwise, fetch from the network.
      return cachedResponse || fetch(event.request).catch(() => {
        // Optional: You can return a specific offline placeholder for images/assets here
        // For now, it will just fail if not in cache and offline.
        console.log("Fetch failed for:", event.request.url);
      });
    })
  );
});
