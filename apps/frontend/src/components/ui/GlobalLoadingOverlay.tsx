"use client";

import { useAtomValue } from "jotai";
import { isGlobalLoadingAtom, navigationInProgressAtom } from "@/atoms/loading";
import SuspenseLoader from "./SuspenseLoader";
import useSmoothLoading from "@/hooks/useSmoothLoading";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { GLOBAL_OVERLAY_MAX_BLOCKING_MS } from "@/constants/api";

/** After this many ms, stop blocking clicks so the UI never stays stuck. */
const MAX_BLOCKING_MS = GLOBAL_OVERLAY_MAX_BLOCKING_MS;

export default function GlobalLoadingOverlay() {
  const pathname = usePathname();
  const apiLoading = useAtomValue(isGlobalLoadingAtom);
  const navLoading = useAtomValue(navigationInProgressAtom);
  const active = apiLoading || navLoading;
  // Show immediately on navigation; keep minimum to avoid flicker
  const visible = useSmoothLoading(active, {
    showDelayMs: 0,
    minVisibleMs: 300,
  });

  const [allowClickThrough, setAllowClickThrough] = useState(false);

  useEffect(() => {
    if (!visible) {
      setAllowClickThrough(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAllowClickThrough(true);
    }, MAX_BLOCKING_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [visible]);

  // Skip overlay on super-admin routes where it interferes with editing UX
  if (pathname?.startsWith("/super-admin")) return null;

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center animate-in fade-in duration-200">
      {/* Backdrop: stop blocking clicks after MAX_BLOCKING_MS so UI never stays stuck */}
      <div
        className={`absolute inset-0 bg-white/40 backdrop-blur-[2px] transition-opacity ${allowClickThrough ? "pointer-events-none" : ""}`}
      />
      <div className="pointer-events-none relative mt-24">
        <SuspenseLoader fullscreen={false} />
      </div>
    </div>
  );
}
