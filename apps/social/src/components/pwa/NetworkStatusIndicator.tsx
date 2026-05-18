"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/hooks/use-network-status";

export function NetworkStatusIndicator() {
  const { isOnline, hasRecovered } = useNetworkStatus();
  if (isOnline && !hasRecovered) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[70] flex justify-center px-4">
      <div
        className={`pointer-events-auto inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 font-peyda text-sm shadow-[0_12px_28px_rgba(61,76,110,0.12)] ${
          isOnline ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
        }`}
      >
        {isOnline ? <Wifi className="size-4" aria-hidden /> : <WifiOff className="size-4" aria-hidden />}
        <span>{isOnline ? "اتصال برقرار شد" : "بدون اتصال اینترنت"}</span>
      </div>
    </div>
  );
}
