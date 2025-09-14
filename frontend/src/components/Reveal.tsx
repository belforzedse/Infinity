"use client";

import React from "react";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number; // ms
  amount?: number; // intersection threshold
  once?: boolean;
};

export default function Reveal({
  children,
  className,
  delay = 0,
  amount = 0.2,
  once = true,
}: RevealProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

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
  }, [amount, once]);

  return (
    <div
      ref={ref}
      className={[
        className ?? "",
        "transition-all duration-700 ease-out will-change-transform motion-reduce:transition-none motion-reduce:transform-none",
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
      ].join(" ")}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
