"use client";

import { useEffect, useState } from "react";
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  setAnalyticsConsent,
} from "@/lib/analytics/matomo";

export function ConsentManager() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedConsent = localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
    const hasConsent = storedConsent === "granted" || storedConsent === "denied";
    setShowBanner(!hasConsent);
  }, []);

  const grantConsent = () => {
    if (typeof window === "undefined") return;
    setAnalyticsConsent("granted");
    setShowBanner(false);
  };

  const denyConsent = () => {
    if (typeof window === "undefined") return;
    setAnalyticsConsent("denied");
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[9999] border-t border-slate-200 bg-white shadow-lg"
      dir="rtl"
      role="dialog"
      aria-label="Cookie consent banner"
      aria-modal="true"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h3 className="text-sm mb-2 font-semibold text-slate-900">استفاده از کوکی‌ها</h3>
            <p className="text-sm leading-relaxed text-slate-600">
              ما از کوکی‌ها برای تحلیل رفتار کاربران و بهبود تجربه خرید استفاده می‌کنیم. با پذیرش
              کوکی‌ها، تحلیل دقیق‌تری از مسیر خرید شما خواهیم داشت.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-shrink-0">
            <button
              onClick={denyConsent}
              className="px-6 py-2.5 text-sm rounded-lg border border-slate-300 bg-white font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              aria-label="رد کوکی‌ها"
            >
              رد
            </button>
            <button
              onClick={grantConsent}
              className="px-6 py-2.5 text-sm rounded-lg bg-pink-600 font-medium text-white transition-colors hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
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
