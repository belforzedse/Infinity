"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import Modal from "@/components/Kits/Modal";

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
    <Modal
      isOpen
      onClose={() => setWaitingWorker(null)}
      className="max-w-sm overflow-hidden"
      aria-labelledby="social-pwa-update-title"
    >
      <div className="flex flex-col items-center text-center" dir="rtl">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F1F4FB] text-infinity-primary">
          <RefreshCw className="size-6" aria-hidden />
        </div>
        <h2
          id="social-pwa-update-title"
          className="mt-4 font-peyda text-base font-semibold text-[#424242]"
        >
          نسخه جدید آماده است
        </h2>
        <p className="mt-2 font-peyda text-sm leading-6 text-[#7B8498]">
          برای دریافت آخرین تغییرات، برنامه را به‌روزرسانی کنید.
        </p>
        <button
          type="button"
          onClick={() => waitingWorker.postMessage("SKIP_WAITING")}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-infinity-primary px-3 font-peyda text-sm font-semibold text-white"
        >
          بروزرسانی
        </button>
      </div>
    </Modal>
  );
}
