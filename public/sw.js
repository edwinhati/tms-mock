const CACHE_VERSION = "v1";
const STATIC_CACHE = `tms-static-${CACHE_VERSION}`;
const API_CACHE = `tms-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `tms-images-${CACHE_VERSION}`;

// Assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/auth/login",
  "/driver/shipments",
  "/driver/offline",
  "/manifest.json",
];

// API routes to cache with network-first strategy
const API_ROUTES = ["/api/driver/shipments"];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("[SW] Skip waiting");
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error("[SW] Failed to cache static assets:", err);
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith("tms-") && !name.includes(CACHE_VERSION);
            })
            .map((name) => {
              console.log("[SW] Deleting old cache:", name);
              return caches.delete(name);
            }),
        );
      })
      .then(() => {
        console.log("[SW] Claiming clients");
        return self.clients.claim();
      }),
  );
});

// Fetch event - handle requests with different strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for static assets
  if (request.method !== "GET" && !url.pathname.startsWith("/api/")) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle image requests
  if (request.destination === "image") {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Handle static assets (cache-first)
  event.respondWith(handleStaticRequest(request));
});

// Cache-first strategy for static assets
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    // Return cached version and update cache in background
    fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      })
      .catch(() => {
        // Network failed, but we have cached version
      });

    return cached;
  }

  // Not in cache, fetch from network
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error("[SW] Network request failed:", error);
    // Return offline fallback if available
    return caches.match("/offline");
  }
}

// Network-first strategy for API calls with cache fallback
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  const url = new URL(request.url);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Clone and cache the response
      const responseToCache = networkResponse.clone();

      // Only cache GET requests
      if (request.method === "GET") {
        cache.put(request, responseToCache);
      }

      return networkResponse;
    }

    throw new Error("Network response not ok");
  } catch (error) {
    console.log("[SW] Network failed, trying cache for:", url.pathname);

    // Try to get from cache
    const cached = await cache.match(request);
    if (cached) {
      console.log("[SW] Serving from cache:", url.pathname);
      return cached;
    }

    // Return a custom offline response
    return new Response(
      JSON.stringify({
        error: "You are offline",
        offline: true,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Cache-first with network fallback for images
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return a placeholder image or error response
    return new Response("Image not available offline", { status: 503 });
  }
}

// Background sync for pending updates
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync event:", event.tag);

  if (event.tag === "sync-status-updates") {
    event.waitUntil(syncPendingStatusUpdates());
  }

  if (event.tag === "sync-photo-uploads") {
    event.waitUntil(syncPendingPhotoUploads());
  }
});

// Sync pending status updates from IndexedDB
async function syncPendingStatusUpdates() {
  console.log("[SW] Syncing pending status updates...");

  try {
    // Get pending updates from IndexedDB via client
    const clients = await self.clients.matchAll({ type: "window" });

    if (clients.length === 0) {
      console.log("[SW] No clients available for sync");
      return;
    }

    // Notify clients to sync their pending updates
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_PENDING_UPDATES",
        tag: "sync-status-updates",
      });
    });
  } catch (error) {
    console.error("[SW] Error syncing pending updates:", error);
  }
}

// Sync pending photo uploads
async function syncPendingPhotoUploads() {
  console.log("[SW] Syncing pending photo uploads...");

  try {
    const clients = await self.clients.matchAll({ type: "window" });

    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_PHOTO_UPLOADS",
        tag: "sync-photo-uploads",
      });
    });
  } catch (error) {
    console.error("[SW] Error syncing photo uploads:", error);
  }
}

// Handle messages from clients
self.addEventListener("message", (event) => {
  console.log("[SW] Received message:", event.data);

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data.type === "REGISTER_SYNC") {
    registerBackgroundSync(event.data.tag);
  }

  if (event.data.type === "CLEAR_CACHES") {
    clearAllCaches();
  }
});

// Register background sync
async function registerBackgroundSync(tag) {
  try {
    const registration = await self.registration;

    if ("sync" in registration) {
      await registration.sync.register(tag);
      console.log("[SW] Background sync registered:", tag);
    } else {
      console.log("[SW] Background sync not supported");
    }
  } catch (error) {
    console.error("[SW] Failed to register background sync:", error);
  }
}

// Clear all caches (called on logout)
async function clearAllCaches() {
  console.log("[SW] Clearing all caches...");

  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith("tms-"))
        .map((name) => caches.delete(name)),
    );
    console.log("[SW] All caches cleared");
  } catch (error) {
    console.error("[SW] Error clearing caches:", error);
  }
}

// Push notification support (for future use)
self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event);

  const options = {
    body: event.data?.text() || "New shipment assigned",
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    tag: "shipment-assignment",
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification("TMS Driver App", options),
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event);

  event.notification.close();

  event.waitUntil(self.clients.openWindow("/driver/shipments"));
});
