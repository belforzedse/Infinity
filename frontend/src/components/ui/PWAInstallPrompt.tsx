"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Check if device is mobile
 */
function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  // Check screen width
  if (window.innerWidth >= 768) return false;

  // Check user agent for mobile devices
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

  return mobileRegex.test(userAgent.toLowerCase());
}

/**
 * Check if device is iOS (iPhone, iPad, iPod)
 */
function isIOSDevice(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const iosRegex = /iphone|ipad|ipod/i;

  return iosRegex.test(userAgent.toLowerCase());
}

/**
 * Check if running in Safari on iOS
 */
function isSafariIOS(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isIOS = /iphone|ipad|ipod/i.test(userAgent.toLowerCase());
  const isSafari = /safari/i.test(userAgent.toLowerCase()) && !/chrome|crios|fxios/i.test(userAgent.toLowerCase());

  return isIOS && isSafari;
}

/**
 * PWA Install Prompt Component
 * Shows a full-screen overlay to prompt users to install the PWA when available
 * Only shows on mobile devices, and only once per user
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if on mobile device
    const mobile = isMobileDevice();
    const ios = isIOSDevice();
    setIsMobile(mobile);
    setIsIOS(ios);

    if (!mobile) {
      console.log("[PWA] Not showing prompt - desktop device");
      return;
    }

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

    // Check if user has permanently dismissed the prompt
    const wasDismissed = localStorage.getItem("pwa-prompt-dismissed-permanently");
    if (wasDismissed === "true") {
      console.log("[PWA] User has permanently dismissed the prompt");
      return;
    }

    // Check if running on HTTPS or localhost (required for PWA)
    const isSecure =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (!isSecure) {
      console.warn("[PWA] App must be served over HTTPS (or localhost) for install prompt to work");
      return;
    }

    // For iOS, show prompt immediately (iOS doesn't support beforeinstallprompt)
    if (ios && isSafariIOS()) {
      console.log("[PWA] iOS device detected - showing manual install prompt");
      // Show prompt after a short delay to ensure page is loaded
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000); // 2 second delay
      return () => clearTimeout(timer);
    }

    // For Android/other browsers, listen for beforeinstallprompt event
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

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.warn(
        "[PWA] No deferred prompt available. User may need to use browser's install button.",
      );
      // Fallback: Show instructions for manual installation
      alert(
        "برای نصب اپلیکیشن، از منوی مرورگر خود استفاده کنید:\n\nChrome/Edge: روی آیکون + در نوار آدرس کلیک کنید\nFirefox: از منوی ⋮ گزینه 'نصب' را انتخاب کنید",
      );
      // Still mark as dismissed since we showed instructions
      localStorage.setItem("pwa-prompt-dismissed-permanently", "true");
      setShowPrompt(false);
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
        // Mark as permanently dismissed
        localStorage.setItem("pwa-prompt-dismissed-permanently", "true");
      }
    } catch (error) {
      console.error("[PWA] Error showing install prompt:", error);
      // Mark as dismissed on error
      localStorage.setItem("pwa-prompt-dismissed-permanently", "true");
    } finally {
      // Clear the deferred prompt
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    // Mark as permanently dismissed
    localStorage.setItem("pwa-prompt-dismissed-permanently", "true");
    setShowPrompt(false);
    console.log("[PWA] User dismissed the prompt permanently");
  };

  // Don't show if:
  // - Not on mobile
  // - Already installed
  // - Prompt not ready
  // - User has dismissed it permanently
  if (!isMobile || isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(4px)" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleDismiss} aria-hidden="true" />

      {/* Modal Content */}
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl rtl:text-right">
        {/* Icon/Logo */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
          نصب اپلیکیشن اینفینیتی
        </h2>

        {/* Description */}
        <p className="mb-6 text-center leading-relaxed text-gray-600">
          اینفینیتی را به صفحه اصلی خود اضافه کنید و سریع‌تر دسترسی داشته باشید. تجربه بهتر خرید با
          اپلیکیشن ما!
        </p>

        {/* iOS-specific instructions */}
        {isIOS && (
          <div className="mb-6 rounded-xl bg-pink-50 p-4 rtl:text-right">
            <p className="mb-2 text-sm font-semibold text-pink-900">نحوه نصب:</p>
            <ol className="list-inside list-decimal space-y-1 text-sm text-pink-800 rtl:list-decimal">
              <li>دکمه Share (اشتراک‌گذاری) را در پایین صفحه بزنید</li>
              <li>گزینه "Add to Home Screen" (افزودن به صفحه اصلی) را انتخاب کنید</li>
              <li>روی "Add" (افزودن) کلیک کنید</li>
            </ol>
          </div>
        )}

        {/* Benefits List */}
        <ul className="mb-6 space-y-2 text-sm text-gray-600">
          <li className="flex items-center gap-2 rtl:flex-row-reverse">
            <svg
              className="h-5 w-5 flex-shrink-0 text-pink-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>دسترسی سریع‌تر</span>
          </li>
          <li className="flex items-center gap-2 rtl:flex-row-reverse">
            <svg
              className="h-5 w-5 flex-shrink-0 text-pink-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>کار بدون اینترنت</span>
          </li>
          <li className="flex items-center gap-2 rtl:flex-row-reverse">
            <svg
              className="h-5 w-5 flex-shrink-0 text-pink-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>تجربه بهتر</span>
          </li>
        </ul>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {isIOS ? (
            <button
              onClick={handleDismiss}
              className="w-full transform rounded-xl bg-pink-600 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:scale-[1.02] hover:bg-pink-700 hover:shadow-xl active:scale-[0.98]"
            >
              متوجه شدم
            </button>
          ) : (
            <button
              onClick={handleInstallClick}
              className="w-full transform rounded-xl bg-pink-600 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:scale-[1.02] hover:bg-pink-700 hover:shadow-xl active:scale-[0.98]"
            >
              نصب اپلیکیشن
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="w-full rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-200"
          >
            نه، ممنون
          </button>
        </div>
      </div>
    </div>
  );
}
