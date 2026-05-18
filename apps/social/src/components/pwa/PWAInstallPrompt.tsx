"use client";

import { Download, Share2, X } from "lucide-react";
import { useState } from "react";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

const DISMISS_KEY = "social-pwa-install-dismissed-at";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function recentlyDismissed() {
  if (typeof window === "undefined") return true;
  const value = Number(window.localStorage.getItem(DISMISS_KEY));
  return Number.isFinite(value) && Date.now() - value < DISMISS_TTL_MS;
}

export function PWAInstallPrompt() {
  const { isInstallable, isStandalone, isIos, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => recentlyDismissed());

  if (dismissed || isStandalone || (!isInstallable && !isIos)) return null;

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-[calc(7.25rem+env(safe-area-inset-bottom))] left-4 right-4 z-[60] mx-auto max-w-sm rounded-[20px] bg-white p-4 shadow-[0_18px_42px_rgba(61,76,110,0.14)] lg:bottom-6 lg:right-6 lg:left-auto">
      <div className="flex items-start gap-3" dir="rtl">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#F1F4FB] text-infinity-primary">
          {isIos ? <Share2 className="size-5" aria-hidden /> : <Download className="size-5" aria-hidden />}
        </div>
        <div className="min-w-0 flex-1 text-right">
          <p className="font-peyda text-sm font-semibold text-[#424242]">
            {isIos ? "افزودن به صفحه اصلی" : "نصب اینفینیتی‌گرام"}
          </p>
          <p className="mt-1 font-peyda text-xs leading-5 text-[#7B8498]">
            {isIos ? "از منوی Share گزینه Add to Home Screen را انتخاب کنید." : "برای دسترسی سریع‌تر، برنامه را روی دستگاه نصب کنید."}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[#94A3B8] hover:bg-zinc-100 hover:text-zinc-700"
          aria-label="بستن"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {!isIos ? (
        <button
          type="button"
          onClick={() => void promptInstall()}
          className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-infinity-primary font-peyda text-sm font-semibold text-white"
        >
          نصب برنامه
        </button>
      ) : null}
    </div>
  );
}
