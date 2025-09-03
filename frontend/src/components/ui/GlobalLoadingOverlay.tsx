"use client";

import { useAtomValue } from "jotai";
import { isGlobalLoadingAtom, navigationInProgressAtom } from "@/atoms/loading";
import SuspenseLoader from "./SuspenseLoader";
import { useEffect, useState } from "react";

export default function GlobalLoadingOverlay() {
  const apiLoading = useAtomValue(isGlobalLoadingAtom);
  const navLoading = useAtomValue(navigationInProgressAtom);
  const active = apiLoading || navLoading;
  const [visible, setVisible] = useState(false);

  // Debounce short loads to avoid flashing overlay
  useEffect(() => {
    let t: any;
    if (active) {
      // Show after a slightly longer threshold for smoother feel
      t = setTimeout(() => setVisible(true), 280);
    } else {
      // Linger briefly before hiding for smoother fade
      t = setTimeout(() => setVisible(false), 200);
    }
    return () => t && clearTimeout(t);
  }, [active]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none flex items-start justify-center">
      {/* Subtle backdrop to signal blocked interactions */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
      <div className="relative mt-24">
        <SuspenseLoader fullscreen={false} />
      </div>
    </div>
  );
}
