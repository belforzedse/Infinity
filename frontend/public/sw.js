/**
 * Service Worker for Offline Cart Support
 * Caches cart data and API requests for offline availability
 * Syncs data when connection is restored
 */

const CACHE_VERSION = "v1";
const CART_CACHE = `cart-cache-${CACHE_VERSION}`;
const API_CACHE = `api-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-cache-${CACHE_VERSION}`;

// Cache strategies
const CACHE_FIRST = "cache-first";
const NETWORK_FIRST = "network-first";
const NETWORK_ONLY = "network-only";

// URLs to cache on install
const URLS_TO_CACHE = ["/", "/offline.html"];

// API routes that should be cached
const CACHEABLE_API_ROUTES = ["/api/cart", "/api/products", "/api/categories"];

/**
 * Install event: cache essential files
 */
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");

  event.waitUntil(
    caches
      .open(RUNTIME_CACHE)
      .then((cache) => {
        return cache.addAll(URLS_TO_CACHE).catch((err) => {
          console.log("[SW] Some files failed to cache:", err);
          // Don't fail the install if some files fail
          return Promise.resolve();
        });
      })
      .then(() => self.skipWaiting()),
  );
});

/**
 * Activate event: clean up old caches
 */
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");

  event
    .waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old cache versions
            if (
              cacheName !== CART_CACHE &&
              cacheName !== API_CACHE &&
              cacheName !== RUNTIME_CACHE
            ) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      }),
    )
    .then(() => self.clients.claim());
});

/**
 * Fetch event: handle requests with caching strategies
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and non-http(s) schemes
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // Skip service worker for auth endpoints - they need fresh data for role checks
  // Also skip Next.js static assets - Next.js handles cache-busting with hashed filenames
  if (
    url.pathname.includes("/auth/self") ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/chunks/")
  ) {
    // Let these requests pass through without service worker interception
    return;
  }

  // Handle API cart requests with network-first strategy
  if (url.pathname.includes("/api/cart") || url.pathname.includes("/cart")) {
    event.respondWith(handleCartRequest(request));
    return;
  }

  // Handle other API requests with cache-first strategy
  if (url.pathname.includes("/api/")) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Handle other requests with network-first strategy
  event.respondWith(handleGenericRequest(request));
});

/**
 * Handle cart API requests (network-first)
 * Try network first, fall back to cache
 */
async function handleCartRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(CART_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Network failed, try cache
    console.log("[SW] Network failed, using cached cart data");
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Return offline response
    return new Response(JSON.stringify({ error: "Offline", data: null }), {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "application/json" },
    });
  }
}
/**
 * Handle API requests (cache-first)
 * Use cache if available, fall back to network
 */
async function handleAPIRequest(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Return offline response
    return new Response(JSON.stringify({ error: "Offline", data: null }), {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Handle static assets (cache-first)
 * Images, CSS, JS, etc.
 */
async function handleStaticAsset(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log("[SW] Failed to fetch static asset:", request.url);
    // For images, return a placeholder
    if (request.destination === "image") {
      return new Response(
        `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#f0f0f0" width="200" height="200"/></svg>`,
        { headers: { "Content-Type": "image/svg+xml" } },
      );
    }

    // For other assets, return error
    return new Response("Asset not available offline", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

/**
 * Handle generic requests (network-first)
 * Try network first, fall back to cache
 */
async function handleGenericRequest(request) {
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok && request.method === "GET") {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Return offline page if available
    return caches.match("/offline.html").catch(() => {
      return new Response("Offline - Page not available", {
        status: 503,
        statusText: "Service Unavailable",
      });
    });
  }
}

/**
 * Check if a path is a static asset
 */
function isStaticAsset(pathname) {
  const staticExtensions = [
    ".js",
    ".css",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
  ];
  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

/**
 * Handle background sync for queued requests
 * This syncs cart changes when connection is restored
 */
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync triggered:", event.tag);

  if (event.tag === "sync-cart") {
    event.waitUntil(syncCartData());
  }
});

/**
 * Sync cart data with backend
 */
async function syncCartData() {
  try {
    const cache = await caches.open(CART_CACHE);
    const cartRequest = new Request("/api/cart");
    const cached = await cache.match(cartRequest);

    if (cached) {
      // Attempt to send queued changes to backend
      console.log("[SW] Syncing cart data with backend...");
      const response = await fetch("/api/cart/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        // Clear the sync queue on success
        await cache.delete(cartRequest);
        console.log("[SW] Cart sync successful");
      }
    }
  } catch (error) {
    console.error("[SW] Cart sync failed:", error);
    // Will retry on next sync event
  }
}

/**
 * Handle messages from clients
 */
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    clearAllCaches();
  }

  if (event.data && event.data.type === "CACHE_URLS") {
    cacheUrls(event.data.urls);
  }
});

/**
 * Clear all caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(cacheNames.map((name) => caches.delete(name)));
}

/**
 * Cache specific URLs
 */
async function cacheUrls(urls) {
  const cache = await caches.open(RUNTIME_CACHE);
  return cache.addAll(urls).catch((err) => {
    console.log("[SW] Failed to cache URLs:", err);
  });
}

console.log("[SW] Service worker loaded");
