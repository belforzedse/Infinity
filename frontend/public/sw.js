/**
 * Service Worker for Offline Cart Support
 * Caches cart data and API requests for offline availability
 * Syncs data when connection is restored
 * Uses build version for automatic cache invalidation on deployments
 */

// Build version will be set via message from client
let BUILD_VERSION = "v1-dev"; // Fallback version

// Generate cache names with build version
function getCacheNames() {
  return {
    CART_CACHE: `cart-cache-v${BUILD_VERSION}`,
    API_CACHE: `api-cache-v${BUILD_VERSION}`,
    RUNTIME_CACHE: `runtime-cache-v${BUILD_VERSION}`,
  };
}

// Cache strategies
const CACHE_FIRST = "cache-first";
const NETWORK_FIRST = "network-first";
const NETWORK_ONLY = "network-only";

// URLs to cache on install
const URLS_TO_CACHE = ["/", "/offline.html", "/manifest.json"];

// API routes that should be cached
const CACHEABLE_API_ROUTES = ["/api/cart", "/api/products", "/api/categories"];

/**
 * Install event: cache essential files
 */
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  const { RUNTIME_CACHE } = getCacheNames();

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
  const { CART_CACHE, API_CACHE, RUNTIME_CACHE } = getCacheNames();

  // Compute the full Promise chain first
  const activationPromise = caches
    .keys()
    .then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old cache versions (any cache that doesn't match current version)
          const currentCaches = [CART_CACHE, API_CACHE, RUNTIME_CACHE];
          if (!currentCaches.includes(cacheName)) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    })
    .then(() => self.clients.claim());

  // Then pass the complete promise to waitUntil
  event.waitUntil(activationPromise);
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
  // Skip Next.js image optimization - let Next.js handle image optimization
  if (
    url.pathname.includes("/auth/self") ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/chunks/") ||
    url.pathname.startsWith("/_next/image")
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
  const { CART_CACHE } = getCacheNames();
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
  const { API_CACHE } = getCacheNames();
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
 * Handle static assets (cache-first with network fallback)
 * Images, CSS, JS, etc.
 * For images, we use network-first to ensure they load properly
 */
async function handleStaticAsset(request) {
  const { RUNTIME_CACHE } = getCacheNames();

  // For images, try network first to ensure they load properly
  // This prevents stale cache from blocking image loading
  if (request.destination === "image" || isImagePath(request.url)) {
    try {
      const response = await fetch(request);

      // Cache successful responses
      if (response.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response.clone());
      }

      return response;
    } catch (error) {
      // If network fails, try cache
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }

      // Only return placeholder if truly offline and no cache
      console.log("[SW] Failed to fetch image:", request.url);
      // Don't return placeholder - let the browser handle the error naturally
      // This allows Next.js Image component to show alt text properly
      throw error;
    }
  }

  // For other static assets, use cache-first
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
    // For other assets, return error
    return new Response("Asset not available offline", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

/**
 * Check if URL is an image path
 */
function isImagePath(url) {
  const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"];
  try {
    const urlObj = new URL(url);
    return imageExtensions.some((ext) => urlObj.pathname.toLowerCase().endsWith(ext));
  } catch {
    return false;
  }
}

// Store PWA mode status per client
const pwaModeClients = new Set();

/**
 * Check if a client is in PWA mode (standalone display mode)
 * Clients should send a message with type "PWA_MODE" and isPWA boolean
 */
async function isPWAMode(clientId) {
  // If we have stored info about this client, use it
  if (clientId && pwaModeClients.has(clientId)) {
    return true;
  }

  // Default: don't assume PWA mode (conservative approach)
  // offline.html should only show for confirmed PWA users
  return false;
}

/**
 * Check if request is a navigation request (HTML page request)
 */
function isNavigationRequest(request) {
  // Check if request mode is navigate (browser navigation)
  if (request.mode === "navigate") {
    return true;
  }

  // Check Accept header for HTML content
  const acceptHeader = request.headers.get("Accept");
  if (acceptHeader && acceptHeader.includes("text/html")) {
    return true;
  }

  // Check if request destination is document
  if (request.destination === "document") {
    return true;
  }

  return false;
}

/**
 * Check if error indicates offline state (network error)
 */
function isNetworkError(error) {
  // Network errors typically have no response or are TypeError
  // Server errors (4xx, 5xx) are not network errors
  return (
    error instanceof TypeError ||
    error.name === "NetworkError" ||
    error.message?.includes("Failed to fetch") ||
    error.message?.includes("NetworkError")
  );
}

/**
 * Handle generic requests (network-first)
 * Try network first, fall back to cache
 * Only show offline.html for PWA users when actually offline and for navigation requests
 */
async function handleGenericRequest(request) {
  const { RUNTIME_CACHE } = getCacheNames();

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok && request.method === "GET") {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Check if this is a network error (offline) vs server error
    const isOffline = isNetworkError(error);

    // Try cache first
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Only show offline.html if:
    // 1. It's a navigation request (HTML page)
    // 2. User is actually offline (network error, not server error)
    // 3. User is in PWA mode (confirmed via client message)
    const isNav = isNavigationRequest(request);

    if (isNav && isOffline) {
      // Check if user is in PWA mode by checking stored client info
      try {
        const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        let isPWA = false;

        // Check if any of the clients are in PWA mode
        for (const client of clients) {
          const clientId = client.id || client.url || "default";
          if (pwaModeClients.has(clientId)) {
            isPWA = true;
            break;
          }
        }

        // Only return offline.html for PWA users
        if (isPWA) {
          const offlinePage = await caches.match("/offline.html");
          if (offlinePage) {
            console.log("[SW] Returning offline.html for PWA user");
            return offlinePage;
          }
        } else {
          console.log("[SW] Not showing offline.html - user is not in PWA mode");
        }
      } catch (err) {
        console.log("[SW] Error checking PWA mode:", err);
      }
    }

    // For non-navigation requests or when not offline, return appropriate error
    if (isNavigationRequest(request)) {
      // For navigation requests that failed but aren't offline, return error page
      return new Response("Page not available", {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // For API or other requests, return JSON error
    return new Response(JSON.stringify({ error: "Request failed", message: error.message }), {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "application/json" },
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

  if (event.data && event.data.type === "SET_BUILD_VERSION") {
    BUILD_VERSION = event.data.version || BUILD_VERSION;
    console.log("[SW] Build version set:", BUILD_VERSION);
  }

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    clearAllCaches();
  }

  if (event.data && event.data.type === "CACHE_URLS") {
    cacheUrls(event.data.urls);
  }

  // Handle PWA mode status from client
  if (event.data && event.data.type === "PWA_MODE") {
    // Get the client that sent the message
    const client = event.source;
    if (client) {
      if (event.data.isPWA) {
        // Store client ID or use client object as key
        const clientId = client.id || client.url || "default";
        pwaModeClients.add(clientId);
        console.log("[SW] Client is in PWA mode:", clientId);
      } else {
        const clientId = client.id || client.url || "default";
        pwaModeClients.delete(clientId);
        console.log("[SW] Client is not in PWA mode:", clientId);
      }
    }
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
  const { RUNTIME_CACHE } = getCacheNames();
  const cache = await caches.open(RUNTIME_CACHE);
  return cache.addAll(urls).catch((err) => {
    console.log("[SW] Failed to cache URLs:", err);
  });
}

console.log("[SW] Service worker loaded");
