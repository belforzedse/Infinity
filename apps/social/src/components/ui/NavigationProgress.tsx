"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Phase = "hidden" | "enter" | "progress" | "done";

export function NavigationProgress() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [phase, setPhase] = useState<Phase>("hidden");
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    if (reducedMotion) {
      const t0 = window.setTimeout(() => setPhase("enter"), 0);
      const t1 = window.setTimeout(() => setPhase("hidden"), 300);
      return () => {
        window.clearTimeout(t0);
        window.clearTimeout(t1);
      };
    }

    const t0 = window.setTimeout(() => setPhase("enter"), 0);
    const t1 = window.setTimeout(() => setPhase("progress"), 50);
    const t2 = window.setTimeout(() => setPhase("done"), 600);
    const t3 = window.setTimeout(() => setPhase("hidden"), 900);

    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [pathname, reducedMotion]);

  if (phase === "hidden") return null;

  const barStyle = reducedMotion
    ? { width: "100%", opacity: 1 }
    : {
        opacity: phase === "done" ? 0 : 1,
        width: phase === "enter" ? "15%" : phase === "progress" ? "80%" : "100%",
        transition:
          phase === "enter"
            ? "opacity 80ms linear"
            : phase === "progress"
            ? "width 540ms cubic-bezier(0.16, 1, 0.3, 1)"
            : "width 150ms linear, opacity 250ms linear 150ms",
      };

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[2px]"
      role="progressbar"
      aria-label="بارگذاری صفحه"
      aria-busy={phase !== "done"}
    >
      <div
        className="h-full bg-gradient-to-l from-[#3d4c6e] to-[#98bdff]"
        style={barStyle}
      />
    </div>
  );
}
