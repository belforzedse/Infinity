"use client";

import { useEffect, useState } from "react";
import { BUILD_VERSION } from "@/constants/build";
import { X, RefreshCw } from "lucide-react";

interface BuildVersionData {
  BUILD_VERSION: string;
  timestamp: number;
  commitHash: string | null;
  generatedAt: string;
}

/**
 * Version Check Component
 *
 * Periodically checks if the user's app version is outdated by comparing
 * the current BUILD_VERSION with the latest version from the server.
 * Shows a persistent banner when an update is available.
 */
export default function VersionCheck() {
  const [isOutdated, setIsOutdated] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkVersion = async () => {
    // Skip check in development mode
    if (BUILD_VERSION === "dev") {
      return;
    }

    try {
      setIsChecking(true);
      // Fetch the latest build version from the server
      // Add cache-busting query parameter to ensure we get the latest version
      const response = await fetch(`/build-version.json?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) {
        console.warn("[VersionCheck] Failed to fetch build version:", response.status);
        return;
      }

      const data: BuildVersionData = await response.json();
      const serverVersion = data.BUILD_VERSION;

      setLatestVersion(serverVersion);

      // Compare versions - if they don't match, the app is outdated
      if (serverVersion && serverVersion !== BUILD_VERSION) {
        setIsOutdated(true);
        setIsDismissed(false); // Reset dismissal when new version is detected
      } else {
        setIsOutdated(false);
      }
    } catch (error) {
      console.error("[VersionCheck] Error checking version:", error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Initial check on mount
    checkVersion();

    // Check periodically (every 5 minutes)
    const interval = setInterval(
      () => {
        checkVersion();
      },
      5 * 60 * 1000,
    );

    // Also check when the page becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkVersion();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleRefresh = () => {
    // Clear all caches and reload
    if (typeof window !== "undefined" && "caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }

    // Reload the page
    window.location.reload();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Store dismissal in localStorage with version to re-show if version changes
    if (typeof window !== "undefined") {
      localStorage.setItem("versionCheckDismissed", latestVersion || "");
    }
  };

  // Don't show if dismissed for this version
  useEffect(() => {
    if (typeof window !== "undefined" && latestVersion) {
      const dismissedVersion = localStorage.getItem("versionCheckDismissed");
      if (dismissedVersion === latestVersion) {
        setIsDismissed(true);
      }
    }
  }, [latestVersion]);

  // Don't render if not outdated, dismissed, or in development
  if (!isOutdated || isDismissed || BUILD_VERSION === "dev") {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9998] bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg"
      role="alert"
      aria-live="polite"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <RefreshCw className="h-5 w-5 flex-shrink-0 animate-spin" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm font-medium">نسخه جدیدی از برنامه در دسترس است</p>
              <p className="mt-0.5 text-xs opacity-90">
                برای دریافت آخرین ویژگی‌ها و بهبودها، لطفاً صفحه را به‌روزرسانی کنید.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              به‌روزرسانی
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="بستن"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
