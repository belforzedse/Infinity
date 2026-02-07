"use client";

import React from "react";

type Variant = "fade-up" | "fade-in" | "fade-right" | "fade-left" | "zoom-in" | "blur-up";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number; // ms
  duration?: number; // ms
  amount?: number; // intersection threshold
  once?: boolean;
  variant?: Variant;
};

export default function Reveal({
  children,
  className,
  delay = 0,
  duration = 700,
  amount = 0.2,
  once = true,
  variant = "fade-up",
}: RevealProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = React.useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const legacyMediaQuery = mediaQuery as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };
    const applyPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };
    const handleMediaChange = () => applyPreference();
    const subscribe = () => {
      if ("addEventListener" in mediaQuery) {
        mediaQuery.addEventListener("change", handleMediaChange);
        return () => mediaQuery.removeEventListener("change", handleMediaChange);
      }
      legacyMediaQuery.addListener?.(handleMediaChange as (event: MediaQueryListEvent) => void);
      return () =>
        legacyMediaQuery.removeListener?.(handleMediaChange as (event: MediaQueryListEvent) => void);
    };
    applyPreference();
    const unsubscribe = subscribe();

    const el = ref.current;
    if (!el) {
      return unsubscribe;
    }

    if (mediaQuery.matches) {
      setShown(true);
      return unsubscribe;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setShown(false);
        }
      },
      { threshold: amount, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      unsubscribe();
    };
  }, [amount, once]);

  const hiddenByVariant: Record<Variant, string> = {
    "fade-up": "opacity-0 translate-y-4",
    "fade-in": "opacity-0",
    "fade-right": "opacity-0 -translate-x-4",
    "fade-left": "opacity-0 translate-x-4",
    "zoom-in": "opacity-0 scale-95",
    "blur-up": "opacity-0 translate-y-4 blur-sm",
  };

  const shownByVariant: Record<Variant, string> = {
    "fade-up": "opacity-100 translate-y-0",
    "fade-in": "opacity-100",
    "fade-right": "opacity-100 translate-x-0",
    "fade-left": "opacity-100 translate-x-0",
    "zoom-in": "opacity-100 scale-100",
    "blur-up": "opacity-100 translate-y-0 blur-0",
  };

  return (
    <div
      ref={ref}
      className={[
        className ?? "",
        "transition-all ease-out will-change-transform motion-reduce:transform-none motion-reduce:blur-0 motion-reduce:transition-none",
        shown ? shownByVariant[variant] : hiddenByVariant[variant],
      ].join(" ")}
      style={{
        transitionDelay: prefersReducedMotion ? "0ms" : `${delay}ms`,
        transitionDuration: prefersReducedMotion ? "0ms" : `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}
