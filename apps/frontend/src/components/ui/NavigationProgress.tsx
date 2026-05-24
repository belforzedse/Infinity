"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Phase = "hidden" | "enter" | "progress" | "done";

export default function NavigationProgress() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const activeRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const [phase, setPhase] = useState<Phase>("hidden");
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const queueTimer = useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, delay);
    timersRef.current.push(timer);
  }, []);

  const queuePhase = useCallback(
    (nextPhase: Phase, delay = 0) => {
      queueTimer(() => setPhase(nextPhase), delay);
    },
    [queueTimer],
  );

  const startNavigation = useCallback(() => {
    clearTimers();
    activeRef.current = true;

    if (reducedMotion) {
      queuePhase("enter");
      queueTimer(() => {
        activeRef.current = false;
        setPhase("hidden");
      }, 2000);
      return;
    }

    queuePhase("enter");
    queuePhase("progress", 50);
    queueTimer(() => {
      activeRef.current = false;
      setPhase("done");
    }, 2200);
    queuePhase("hidden", 2500);
  }, [clearTimers, queuePhase, queueTimer, reducedMotion]);

  const finishNavigation = useCallback(() => {
    clearTimers();
    activeRef.current = false;

    if (reducedMotion) {
      queuePhase("hidden");
      return;
    }

    queuePhase("done");
    queuePhase("hidden", 300);
  }, [clearTimers, queuePhase, reducedMotion]);

  useEffect(() => {
    function shouldStartForUrl(rawHref: string | null) {
      if (!rawHref || rawHref.startsWith("#")) return false;

      try {
        const current = new URL(window.location.href);
        const target = new URL(rawHref, current.href);
        if (target.origin !== current.origin) return false;

        const currentPath = `${current.pathname}${current.search}`;
        const targetPath = `${target.pathname}${target.search}`;
        return currentPath !== targetPath;
      } catch {
        return false;
      }
    }

    function handleClick(event: MouseEvent) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = (event.target as HTMLElement | null)?.closest?.("a");
      if (!link) return;
      if (link.getAttribute("target") === "_blank") return;
      if (link.getAttribute("data-nav-ignore") === "true") return;
      if (!shouldStartForUrl(link.getAttribute("href"))) return;

      startNavigation();
      queueMicrotask(() => {
        if (event.defaultPrevented) finishNavigation();
      });
    }

    function handlePopState() {
      startNavigation();
    }

    const originalPushState = history.pushState.bind(history);
    history.pushState = function (...args: Parameters<History["pushState"]>) {
      if (shouldStartForUrl(typeof args[2] === "string" ? args[2] : args[2]?.toString() ?? null)) {
        startNavigation();
      }
      return originalPushState(...args);
    } as History["pushState"];

    window.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      clearTimers();
      history.pushState = originalPushState;
      window.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [clearTimers, finishNavigation, queueTimer, reducedMotion, startNavigation]);

  useEffect(() => {
    if (pathname === previousPathname.current) return;
    previousPathname.current = pathname;

    if (activeRef.current) {
      queueTimer(finishNavigation, 0);
      return;
    }

    queueTimer(() => {
      startNavigation();
      queueTimer(finishNavigation, reducedMotion ? 200 : 650);
    }, 0);
  }, [finishNavigation, pathname, queueTimer, reducedMotion, startNavigation]);

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
        className="h-full bg-gradient-to-l from-[#334155] via-[#db2777] to-[#fb7185] shadow-[0_0_10px_rgba(219,39,119,0.55)]"
        style={barStyle}
      />
    </div>
  );
}
