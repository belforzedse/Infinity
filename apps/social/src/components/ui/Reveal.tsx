"use client";

import { useEffect, useRef, useState } from "react";

type Variant = "fade-up" | "fade-in" | "fade-right" | "fade-left" | "zoom-in" | "blur-up";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  amount?: number;
  once?: boolean;
  variant?: Variant;
};

const hiddenClass: Record<Variant, string> = {
  "fade-up": "opacity-0 translate-y-4",
  "fade-in": "opacity-0",
  "fade-right": "opacity-0 -translate-x-4",
  "fade-left": "opacity-0 translate-x-4",
  "zoom-in": "opacity-0 scale-95",
  "blur-up": "opacity-0 translate-y-4 blur-sm",
};

const shownClass: Record<Variant, string> = {
  "fade-up": "opacity-100 translate-y-0",
  "fade-in": "opacity-100",
  "fade-right": "opacity-100 translate-x-0",
  "fade-left": "opacity-100 translate-x-0",
  "zoom-in": "opacity-100 scale-100",
  "blur-up": "opacity-100 translate-y-0 blur-0",
};

export function Reveal({
  children,
  className,
  delay = 0,
  duration = 600,
  amount = 0.2,
  once = true,
  variant = "fade-up",
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) return;

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
    return () => observer.disconnect();
  }, [amount, once, reducedMotion]);

  return (
    <div
      ref={ref}
      className={[
        className ?? "",
        "transition-all ease-out will-change-transform",
        reducedMotion || shown ? shownClass[variant] : hiddenClass[variant],
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        transitionDelay: reducedMotion ? "0ms" : `${delay}ms`,
        transitionDuration: reducedMotion ? "0ms" : `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}
