// service-worker.js - optimized for e-commerce PWA with background sync (no push)

// ----- Install -----
self.addEventListener("install", (event) => {
  console.log("Service Worker Installed");
  // Activate new SW immediately (use carefully in production)
  self.skipWaiting();
});

// ----- Activate -----
self.addEventListener("activate", (event) => {
  console.log("Service Worker Activated - cleaning old caches");
  const allowedCaches = ["pwa-static-v3"];

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (!allowedCaches.includes(key)) {
            console.log("Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );

  // Take control of uncontrolled clients
  self.clients.claim();
});

// ----- Fetch Handler -----
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1) Never cache API requests — always use network
  if (url.pathname.startsWith("/api/")) {
    return; // let network handle it
  }

  // 2) Never cache JS bundles or source maps — always use network
  if (url.pathname.endsWith(".js") || url.pathname.endsWith(".map")) {
    return;
  }

  // 3) Navigation requests (HTML pages) → network-first, fallback to cached index.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Optionally update the cached index.html if you want
          return networkResponse;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // 4) Cache-first for static assets: images, styles, fonts
  if (
    request.destination === "image" ||
    request.destination === "style" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request)
          .then((networkResponse) => {
            // Cache the fetched asset for future offline use
            return caches.open("pwa-static-v3").then((cache) => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
          })
          .catch(() => {
            // Optional: return a lightweight fallback for images (small blank svg) or styles
            return new Response("", { status: 408, statusText: "Network error" });
          });
      })
    );
    return;
  }

  // Default: network-only (do not cache)
  // This avoids accidentally caching other dynamic content
});

// ------------------------------
// Background sync (IndexedDB outbox)
// ------------------------------

const DB_NAME = "pwa-sync-db";
const STORE_NAME = "outbox";

// Open IndexedDB
function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbAdd(payload) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add(payload);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGetAll() {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function idbClearAll() {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// Expose helper to add to outbox from client via postMessage (optional)
// Client can also use its own IndexedDB helper; exposing postMessage is convenient.
self.addEventListener("message", (event) => {
  try {
    const { action, payload } = event.data || {};
    if (action === "OUTBOX_ADD" && payload) {
      // payload: { url, method, headers, body }
      idbAdd(payload).then(() => {
        // try register sync if available
        if (self.registration && self.registration.sync) {
          self.registration.sync.register("sync-outbox").catch((err) => {
            // registration may fail in some browsers — not fatal
            console.warn("Background sync registration failed", err);
          });
        }
      });
    }
  } catch (e) {
    console.error("SW message handler error", e);
  }
});

// Background sync event — flush outbox to network
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-outbox") {
    event.waitUntil(
      (async () => {
        const items = await idbGetAll();
        if (!items.length) return;

        for (const item of items) {
          try {
            // item should contain { url, method, body, headers }
            await fetch(item.url, {
              method: item.method || "POST",
              headers: item.headers || { "Content-Type": "application/json" },
              body: item.body ? JSON.stringify(item.body) : undefined,
            });
            // continue to next item if success
          } catch (err) {
            // stop on first failure — leave remaining items for next sync
            console.error("Background sync failed for item", item, err);
            return;
          }
        }

        // All requests succeeded — clear outbox
        await idbClearAll();
      })()
    );
  }
});
