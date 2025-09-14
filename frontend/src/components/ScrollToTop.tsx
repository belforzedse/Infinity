"use client";

import React from "react";

export default function ScrollToTop() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onClick = () => {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  return (
    <button
      aria-label="Scroll to top"
      onClick={onClick}
      className={[
        "fixed bottom-6 right-4 z-[60] rounded-full bg-black/70 text-white",
        "backdrop-blur px-3 py-3 shadow-elevated transition-all",
        "hover:bg-black/80 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec4899]",
        visible ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-3",
      ].join(" ")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5"
      >
        <path fillRule="evenodd" d="M12 5.25a.75.75 0 0 1 .53.22l5.25 5.25a.75.75 0 1 1-1.06 1.06L12.75 7.81v10.44a.75.75 0 0 1-1.5 0V7.81l-3.97 3.97a.75.75 0 0 1-1.06-1.06l5.25-5.25a.75.75 0 0 1 .53-.22Z" clipRule="evenodd" />
      </svg>
    </button>
  );
}

