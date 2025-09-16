"use client";

import React from "react";

export default function ScrollToTop() {
  const [visible, setVisible] = React.useState(false);
  const [progress, setProgress] = React.useState(0); // 0..1
  const [btnBottom, setBtnBottom] = React.useState<number>(80);

  React.useEffect(() => {
    const recalcBottom = () => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      if (isMobile) {
        const nav = document.querySelector<HTMLElement>("nav[data-bottom-nav]");
        const navH = nav ? nav.offsetHeight : 64;
        setBtnBottom(navH + 20); // nav height + margin
      } else {
        setBtnBottom(48); // desktop spacing
      }
    };

    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
      setProgress(Math.min(1, Math.max(0, scrollTop / scrollable)));
      setVisible(scrollTop > 400);
    };
    onScroll();
    recalcBottom();
    window.addEventListener("scroll", onScroll, { passive: true });
    const onResize = () => {
      onScroll();
      recalcBottom();
    };
    window.addEventListener("resize", onResize, { passive: true } as any);

    // Observe nav height changes if present
    const nav = document.querySelector<HTMLElement>("nav[data-bottom-nav]");
    let ro: ResizeObserver | null = null;
    if (nav && "ResizeObserver" in window) {
      ro = new ResizeObserver(() => recalcBottom());
      ro.observe(nav);
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (ro) ro.disconnect();
    };
  }, []);

  const onClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    const to = e.shiftKey ? document.documentElement.scrollHeight : 0; // Shift+click => bottom
    try {
      window.scrollTo({ top: to, behavior: "smooth" });
    } catch {
      window.scrollTo(0, to);
    }
  };

  const size = 44; // touch target
  const stroke = 3;
  const r = (size - stroke) / 2 - 2; // radius for ring
  const c = 2 * Math.PI * r;
  const dash = c;
  const offset = c * (1 - progress);

  return (
    <button
      aria-label="بازگشت به بالا"
      title="بازگشت به بالا"
      type="button"
      onClick={onClick}
      className={[
        "fixed right-4 z-[60] rounded-full text-pink-600",
        "shadow-elevated transition-all motion-reduce:transition-none",
        // liquid glass gradient
        "bg-gradient-to-br from-pink-50/70 to-white/70 ring-1 ring-white/60 saturate-150 backdrop-blur-xl",
        "hover:from-pink-50/80 hover:to-white/80 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec4899] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      ].join(" ")}
      style={{ bottom: `calc(${btnBottom}px + env(safe-area-inset-bottom))` }}
    >
      <div className="relative flex h-11 w-11 items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0"
          aria-hidden
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="rgba(236,72,153,0.2)"
            strokeWidth={stroke}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="#ec4899"
            strokeLinecap="round"
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={dash}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 200ms ease" }}
          />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="relative h-5 w-5"
        >
          <path
            fillRule="evenodd"
            d="M12 5.25a.75.75 0 0 1 .53.22l5.25 5.25a.75.75 0 1 1-1.06 1.06L12.75 7.81v10.44a.75.75 0 0 1-1.5 0V7.81l-3.97 3.97a.75.75 0 0 1-1.06-1.06l5.25-5.25a.75.75 0 0 1 .53-.22Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </button>
  );
}
