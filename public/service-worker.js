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
    caches.match(event.request).then((response) => {
      // If we have a cached response, return it.
      if (response) {
        return response;
      }

      // Otherwise, fetch from the network.
      return fetch(event.request).then((networkResponse) => {
        // If the fetch is successful, clone it and cache it.
        // We need to clone because a response is a stream and can only be consumed once.
        let responseToCache = networkResponse.clone();
        caches.open("v1").then((cache) => {
          cache.put(event.request, responseToCache);
        });
        // Return the original network response to the browser.
        return networkResponse;
      }).catch(error => {
        console.error("Service Worker fetch failed:", error);
        // IMPORTANT: Return a generic error response to avoid the TypeError
        return new Response("Network error happened", {
          status: 408,
          headers: { "Content-Type": "text/plain" },
        });
      })
    })
  );
});
