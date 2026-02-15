"use client";

import { useAtomValue } from "jotai";
import { isGlobalLoadingAtom, navigationInProgressAtom } from "@/atoms/loading";
import SuspenseLoader from "./SuspenseLoader";
import useSmoothLoading from "@/hooks/useSmoothLoading";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** After this many ms, stop blocking clicks so the UI never stays stuck. */
const MAX_BLOCKING_MS = 60_000;

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

  const visibleSinceRef = useRef<number | null>(null);
  const [allowClickThrough, setAllowClickThrough] = useState(false);

  useEffect(() => {
    if (visible) {
      if (visibleSinceRef.current === null) visibleSinceRef.current = Date.now();
      const elapsed = Date.now() - (visibleSinceRef.current ?? 0);
      if (elapsed >= MAX_BLOCKING_MS && !allowClickThrough) {
        setAllowClickThrough(true);
      }
    } else {
      visibleSinceRef.current = null;
      setAllowClickThrough(false);
    }
  }, [visible, allowClickThrough]);

  // Skip overlay on super-admin routes where it interferes with editing UX
  if (pathname?.startsWith("/super-admin")) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-start justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop: stop blocking clicks after MAX_BLOCKING_MS so UI never stays stuck */}
          <div
            className={`absolute inset-0 bg-white/40 backdrop-blur-[2px] ${allowClickThrough ? "pointer-events-none" : ""}`}
          />
          <div className="pointer-events-none relative mt-24">
            <SuspenseLoader fullscreen={false} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
