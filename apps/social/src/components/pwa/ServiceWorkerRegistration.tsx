"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

export function ServiceWorkerRegistration() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;

    const register = async () => {
      registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });

      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
      }

      registration.addEventListener("updatefound", () => {
        const worker = registration?.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingWorker(worker);
          }
        });
      });
    };

    const onControllerChange = () => window.location.reload();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        registration?.update().catch(() => undefined);
      }
    };

    void register();
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  if (!waitingWorker) return null;

  return (
    <div className="fixed bottom-[calc(7.25rem+env(safe-area-inset-bottom))] left-4 right-4 z-[65] mx-auto max-w-sm rounded-[20px] bg-white p-4 shadow-[0_18px_42px_rgba(61,76,110,0.14)] lg:bottom-6 lg:right-6 lg:left-auto">
      <div className="flex items-center gap-3" dir="rtl">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#F1F4FB] text-infinity-primary">
          <RefreshCw className="size-5" aria-hidden />
        </div>
        <p className="min-w-0 flex-1 text-right font-peyda text-sm font-semibold text-[#424242]">
          نسخه جدید آماده است
        </p>
        <button
          type="button"
          onClick={() => waitingWorker.postMessage("SKIP_WAITING")}
          className="inline-flex h-9 items-center justify-center rounded-xl bg-infinity-primary px-3 font-peyda text-sm font-semibold text-white"
        >
          بروزرسانی
        </button>
      </div>
    </div>
  );
}
