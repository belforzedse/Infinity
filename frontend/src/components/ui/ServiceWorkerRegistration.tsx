"use client";

import { useEffect } from "react";

/**
 * Service Worker Registration Component
 * Registers the service worker for offline support and caching
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register service worker in browser environment
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      console.log("[SW] Service workers not supported in this browser");
      return;
    }

    registerServiceWorker();

    // Listen for service worker updates
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("[SW] Service worker controller changed");
      });
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      console.log("[SW] Registering service worker...");

      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });

      console.log("[SW] Service worker registered successfully:", registration);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60000); // Check every minute

      // Handle service worker updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            console.log("[SW] New service worker available");
            // Notify user about update (optional)
            notifyUpdateAvailable();
          }
        });
      });
    } catch (error) {
      console.error("[SW] Failed to register service worker:", error);
    }
  };

  const notifyUpdateAvailable = () => {
    // You can add a toast notification here
    console.log("[SW] A new version of the app is available. Reload to update.");
  };

  return null; // This component doesn't render anything
}
