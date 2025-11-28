"use client";

import { useEffect, useState } from "react";

/**
 * Google Consent Mode v2 implementation
 * Handles user consent for analytics and advertising
 * Required for GDPR/CCPA compliance in EEA/UK
 */
export function ConsentManager() {
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if consent was previously given
    const storedConsent = localStorage.getItem("analytics-consent");
    const hasConsent = storedConsent === "granted" || storedConsent === "denied";

    // Initialize Google Consent Mode v2
    if (typeof window.gtag !== "undefined") {
      window.gtag("consent", "default", {
        ad_storage: storedConsent === "granted" ? "granted" : "denied",
        ad_user_data: storedConsent === "granted" ? "granted" : "denied",
        ad_personalization: storedConsent === "granted" ? "granted" : "denied",
        analytics_storage: storedConsent === "granted" ? "granted" : "denied",
        functionality_storage: "granted",
        personalization_storage: storedConsent === "granted" ? "granted" : "denied",
        security_storage: "granted",
      });
    }

    setConsentGiven(storedConsent === "granted");
    // Show banner only if user hasn't made a choice yet
    setShowBanner(!hasConsent);
  }, []);

  const grantConsent = () => {
    if (typeof window === "undefined") return;

    localStorage.setItem("analytics-consent", "granted");
    setConsentGiven(true);
    setShowBanner(false);

    // Update consent mode
    if (typeof window.gtag !== "undefined") {
      window.gtag("consent", "update", {
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
        analytics_storage: "granted",
        personalization_storage: "granted",
      });
    }
  };

  const denyConsent = () => {
    if (typeof window === "undefined") return;

    localStorage.setItem("analytics-consent", "denied");
    setConsentGiven(false);
    setShowBanner(false);

    // Update consent mode
    if (typeof window.gtag !== "undefined") {
      window.gtag("consent", "update", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied",
        personalization_storage: "denied",
      });
    }
  };

  // Don't render banner if it shouldn't be shown
  if (!showBanner) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[9999] bg-white shadow-lg border-t border-slate-200"
      dir="rtl"
      role="dialog"
      aria-label="Cookie consent banner"
      aria-modal="true"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              استفاده از کوکی‌ها
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              ما از کوکی‌ها برای بهبود تجربه کاربری، تجزیه و تحلیل ترافیک و
              شخصی‌سازی محتوا استفاده می‌کنیم. با کلیک روی "پذیرش"، شما با
              استفاده از کوکی‌ها موافقت می‌کنید.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-shrink-0">
            <button
              onClick={denyConsent}
              className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              aria-label="رد کوکی‌ها"
            >
              رد
            </button>
            <button
              onClick={grantConsent}
              className="px-6 py-2.5 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
              aria-label="پذیرش کوکی‌ها"
            >
              پذیرش
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | Record<string, any>,
      config?: Record<string, any>
    ) => void;
  }
}



