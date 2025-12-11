// ============================================================
// service-worker.js - Optimized for E-Commerce PWA
// With background sync + safe caching limit (no push)
// ============================================================

// CACHE NAME + LIMIT
const STATIC_CACHE = "pwa-static-v4";
const MAX_CACHE_ITEMS = 200; // prevents QuotaExceededError

// ----- Install -----
self.addEventListener("install", (event) => {
  console.log("Service Worker Installed");
  self.skipWaiting();
});

// ----- Activate -----
self.addEventListener("activate", (event) => {
  console.log("Service Worker Activated - Cleaning old caches");

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE) {
            console.log("Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// Limit cache size to avoid browser storage full
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    return limitCacheSize(cacheName, maxItems);
  }
}

// ----- Fetch Handler -----
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1) Never cache API requests
  if (url.pathname.startsWith("/api/")) return;

  // 2) Never cache JS files
  if (url.pathname.endsWith(".js") || url.pathname.endsWith(".map")) return;

  // 3) Navigation → network-first, fallback to cached index.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // 4) Cache-first for static assets (images, CSS, fonts)
  if (
    request.destination === "image" ||
    request.destination === "style" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        if (cached) return cached;

        try {
          const networkResponse = await fetch(request);
          const cache = await caches.open(STATIC_CACHE);

          try {
            await cache.put(request, networkResponse.clone());
            await limitCacheSize(STATIC_CACHE, MAX_CACHE_ITEMS);
          } catch (e) {
            console.warn("Cache write failed:", e);
          }

          return networkResponse;
        } catch (err) {
          console.error("Fetch failed:", err);
          return new Response("Offline", {
            status: 408,
            headers: { "Content-Type": "text/plain" },
          });
        }
      })
    );
    return;
  }

  // Default: network-only
});

// ============================================================
// Background Sync - IndexedDB Outbox
// ============================================================

const DB_NAME = "pwa-sync-db";
const STORE_NAME = "outbox";

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

// Handle outbox messages from app.jsx
self.addEventListener("message", (event) => {
  const { action, payload } = event.data || {};
  if (action === "OUTBOX_ADD" && payload) {
    idbAdd(payload).then(() => {
      if (self.registration?.sync) {
        self.registration.sync.register("sync-outbox").catch((err) =>
          console.warn("Sync registration failed", err)
        );
      }
    });
  }
});

// Background sync flush
self.addEventListener("sync", (event) => {
  if (event.tag !== "sync-outbox") return;

  event.waitUntil(
    (async () => {
      const items = await idbGetAll();
      if (!items.length) return;

      for (const item of items) {
        try {
          await fetch(item.url, {
            method: item.method || "POST",
            headers: item.headers || { "Content-Type": "application/json" },
            body: item.body ? JSON.stringify(item.body) : undefined,
          });
        } catch (err) {
          console.error("Background sync failed", err);
          return; // stop, try again later
        }
      }

      await idbClearAll();
    })()
  );
});
