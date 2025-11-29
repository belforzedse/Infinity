"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * PWA Install Prompt Component
 * Shows a banner to prompt users to install the PWA when available
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      console.log("[PWA] App is already installed (standalone mode)");
      setIsInstalled(true);
      return;
    }

    // Check if app was installed before (localStorage flag)
    const wasInstalled = localStorage.getItem("pwa-installed");
    if (wasInstalled === "true") {
      console.log("[PWA] App was previously installed");
      setIsInstalled(true);
      return;
    }

    // Check if running on HTTPS or localhost (required for PWA)
    const isSecure = window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!isSecure) {
      console.warn("[PWA] App must be served over HTTPS (or localhost) for install prompt to work");
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("[PWA] beforeinstallprompt event fired!");
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if app was just installed
    window.addEventListener("appinstalled", () => {
      console.log("[PWA] App was just installed");
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem("pwa-installed", "true");
    });

    // Fallback: Check if PWA is installable after a delay (for browsers that don't fire event immediately)
    const checkInstallability = setTimeout(() => {
      // If we haven't received the event yet, check if we can show manual install instructions
      if (!deferredPrompt && !isInstalled && isSecure) {
        // Check if service worker is registered (required for installability)
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistration().then((registration) => {
            if (registration) {
              console.log("[PWA] Service worker is registered, but beforeinstallprompt hasn't fired yet");
              // You could show a manual install button here if needed
            }
          });
        }
      }
    }, 3000); // Wait 3 seconds

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      clearTimeout(checkInstallability);
    };
  }, [deferredPrompt, isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.warn("[PWA] No deferred prompt available. User may need to use browser's install button.");
      // Fallback: Show instructions for manual installation
      alert("برای نصب اپلیکیشن، از منوی مرورگر خود استفاده کنید:\n\nChrome/Edge: روی آیکون + در نوار آدرس کلیک کنید\nFirefox: از منوی ⋮ گزینه 'نصب' را انتخاب کنید");
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("[PWA] User accepted the install prompt");
        localStorage.setItem("pwa-installed", "true");
      } else {
        console.log("[PWA] User dismissed the install prompt");
      }
    } catch (error) {
      console.error("[PWA] Error showing install prompt:", error);
    } finally {
      // Clear the deferred prompt
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember dismissal for this session
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  // Don't show if already installed or dismissed this session
  if (isInstalled || !showPrompt || sessionStorage.getItem("pwa-prompt-dismissed") === "true") {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[2147483645] md:left-auto md:right-4 md:max-w-md">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-start gap-3 rtl:flex-row-reverse">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1 text-sm">نصب اپلیکیشن</h3>
          <p className="text-xs text-gray-600 mb-3">
            اینفینیتی را به صفحه اصلی خود اضافه کنید و سریع‌تر دسترسی داشته باشید
          </p>
          <div className="flex gap-2 rtl:flex-row-reverse">
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-pink-600 text-white text-xs font-semibold rounded-lg hover:bg-pink-700 transition-colors"
            >
              نصب
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              بعداً
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="بستن"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

