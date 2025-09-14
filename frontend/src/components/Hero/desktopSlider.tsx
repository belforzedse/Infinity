"use client";
import React, { useEffect, useMemo, useState } from "react";
import DesktopHero from "./desktopHero";
import { desktopSlides } from "./config/desktopSlides";

export default function DesktopSlider() {
  const slides = useMemo(() => desktopSlides, []);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 3000);
    return () => clearInterval(id);
  }, [slides.length]);

  const next = () => setIndex((i) => (i + 1) % slides.length);
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);

  return (
    <div className="desktop-slider-container relative">
      <DesktopHero layout={slides[index]} slideKey={index} />

      {/* RTL-friendly controls: Next on left (←), Prev on right (→) */}
      <button
        aria-label="Next"
        onClick={next}
        className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-pink-500 shadow hover:bg-pink-100 lg:flex"
      >
        ‹
      </button>
      <button
        aria-label="Previous"
        onClick={prev}
        className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-pink-500 shadow hover:bg-pink-100 lg:flex"
      >
        ›
      </button>

      {/* Dots */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-2xl bg-white/80 px-3 py-1 lg:flex">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-pink-500" : "w-2 bg-gray-300"}`}
          />
        ))}
      </div>
    </div>
  );
}
