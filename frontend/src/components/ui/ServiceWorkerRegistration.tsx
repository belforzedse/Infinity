"use client";

import { useEffect } from "react";
import { BUILD_VERSION } from "@/constants/build";

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

      // Send build version to service worker
      sendBuildVersion(registration);

      // Send PWA mode status to service worker
      sendPWAModeStatus(registration);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60000); // Check every minute

      // Handle service worker updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
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

  const sendBuildVersion = async (registration: ServiceWorkerRegistration) => {
    try {
      // Wait for service worker to be ready
      if (registration.active) {
        registration.active.postMessage({
          type: "SET_BUILD_VERSION",
          version: BUILD_VERSION,
        });
        console.log("[SW] Build version sent to service worker:", BUILD_VERSION);
      } else if (registration.installing) {
        registration.installing.addEventListener("statechange", () => {
          if (registration.installing?.state === "activated") {
            registration.active?.postMessage({
              type: "SET_BUILD_VERSION",
              version: BUILD_VERSION,
            });
            console.log("[SW] Build version sent to service worker:", BUILD_VERSION);
          }
        });
      } else if (registration.waiting) {
        registration.waiting.postMessage({
          type: "SET_BUILD_VERSION",
          version: BUILD_VERSION,
        });
        console.log("[SW] Build version sent to service worker:", BUILD_VERSION);
      }

      // Also listen for when service worker becomes ready
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          registration.active.postMessage({
            type: "SET_BUILD_VERSION",
            version: BUILD_VERSION,
          });
          console.log("[SW] Build version sent to ready service worker:", BUILD_VERSION);
        }
      });
    } catch (error) {
      console.error("[SW] Failed to send build version:", error);
    }
  };

  const sendPWAModeStatus = async (registration: ServiceWorkerRegistration) => {
    try {
      // Check if user is in PWA mode (standalone display mode)
      const isPWA =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");

      const sendMessage = (worker: ServiceWorker | null) => {
        if (worker) {
          worker.postMessage({
            type: "PWA_MODE",
            isPWA: isPWA,
          });
          console.log("[SW] PWA mode status sent to service worker:", isPWA);
        }
      };

      // Wait for service worker to be ready
      if (registration.active) {
        sendMessage(registration.active);
      } else if (registration.installing) {
        registration.installing.addEventListener("statechange", () => {
          if (registration.installing?.state === "activated" && registration.active) {
            sendMessage(registration.active);
          }
        });
      } else if (registration.waiting) {
        sendMessage(registration.waiting);
      }

      // Also listen for when service worker becomes ready
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          sendMessage(registration.active);
        }
      });

      // Listen for display mode changes (if supported)
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia("(display-mode: standalone)");
        const handleChange = () => {
          navigator.serviceWorker.ready.then((registration) => {
            if (registration.active) {
              const isPWA =
                window.matchMedia("(display-mode: standalone)").matches ||
                (window.navigator as any).standalone === true;
              registration.active.postMessage({
                type: "PWA_MODE",
                isPWA: isPWA,
              });
            }
          });
        };
        // Some browsers support addEventListener on MediaQueryList
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener("change", handleChange);
        } else {
          // Fallback for older browsers
          mediaQuery.addListener(handleChange);
        }
      }
    } catch (error) {
      console.error("[SW] Failed to send PWA mode status:", error);
    }
  };

  const notifyUpdateAvailable = () => {
    // You can add a toast notification here
    console.log("[SW] A new version of the app is available. Reload to update.");
  };

  return null; // This component doesn't render anything
}
