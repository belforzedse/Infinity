"use client";

import { Download, Share2, X } from "lucide-react";
import { useState } from "react";
import Modal from "@/components/Kits/Modal";
import { SITE_NAME } from "@/config/site";
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
    <Modal
      isOpen
      onClose={dismiss}
      className="max-w-sm overflow-hidden"
      closeIcon={<X className="size-5 text-zinc-600" aria-hidden />}
      aria-labelledby="social-pwa-install-title"
    >
      <div className="flex flex-col items-center text-center" dir="rtl">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F1F4FB] text-infinity-primary">
          {isIos ? <Share2 className="size-6" aria-hidden /> : <Download className="size-6" aria-hidden />}
        </div>
        <h2
          id="social-pwa-install-title"
          className="mt-4 font-peyda text-base font-semibold text-[#424242]"
        >
          {isIos ? "افزودن به صفحه اصلی" : `نصب ${SITE_NAME}`}
        </h2>
        <p className="mt-2 font-peyda text-sm leading-6 text-[#7B8498]">
          {isIos
            ? "از منوی Share گزینه Add to Home Screen را انتخاب کنید."
            : "برای دسترسی سریع‌تر، برنامه را روی دستگاه نصب کنید."}
        </p>
      </div>
      {!isIos ? (
        <button
          type="button"
          onClick={() => void promptInstall()}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-infinity-primary font-peyda text-sm font-semibold text-white"
        >
          نصب برنامه
        </button>
      ) : null}
    </Modal>
  );
}
