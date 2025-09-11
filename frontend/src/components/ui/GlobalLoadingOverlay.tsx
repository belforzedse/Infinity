"use client";

import { useAtomValue } from "jotai";
import { isGlobalLoadingAtom, navigationInProgressAtom } from "@/atoms/loading";
import SuspenseLoader from "./SuspenseLoader";
import useSmoothLoading from "@/hooks/useSmoothLoading";
import { AnimatePresence, motion } from "framer-motion";

export default function GlobalLoadingOverlay() {
  const apiLoading = useAtomValue(isGlobalLoadingAtom);
  const navLoading = useAtomValue(navigationInProgressAtom);
  const active = apiLoading || navLoading;
  // Show immediately on navigation; keep minimum to avoid flicker
  const visible = useSmoothLoading(active, { showDelayMs: 0, minVisibleMs: 300 });

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
          {/* Subtle backdrop to signal blocked interactions */}
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
          <div className="relative mt-24 pointer-events-none">
            <SuspenseLoader fullscreen={false} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
