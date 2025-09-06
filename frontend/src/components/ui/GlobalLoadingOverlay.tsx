"use client";

import { useAtomValue } from "jotai";
import { isGlobalLoadingAtom, navigationInProgressAtom } from "@/atoms/loading";
import SuspenseLoader from "./SuspenseLoader";
import useSmoothLoading from "@/hooks/useSmoothLoading";

export default function GlobalLoadingOverlay() {
  const apiLoading = useAtomValue(isGlobalLoadingAtom);
  const navLoading = useAtomValue(navigationInProgressAtom);
  const active = apiLoading || navLoading;
  // Show immediately on navigation; keep minimum to avoid flicker
  const visible = useSmoothLoading(active, { showDelayMs: 0, minVisibleMs: 300 });

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[1000] flex items-start justify-center">
      {/* Subtle backdrop to signal blocked interactions */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
      <div className="relative mt-24">
        <SuspenseLoader fullscreen={false} />
      </div>
    </div>
  );
}
