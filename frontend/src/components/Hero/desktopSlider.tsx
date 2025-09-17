"use client";
import React, { useEffect, useMemo, useState } from "react";
import DesktopHero from "./desktopHero";
import { desktopSlides } from "./config/desktopSlides";
import PaginationDesktop from "./PaginationDesktop";

export default function DesktopSlider() {
  const slides = useMemo(() => desktopSlides, []);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 7000);
    return () => clearInterval(id);
  }, [slides.length]);

  const next = () => setIndex((i) => (i + 1) % slides.length);
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);

  return (
    <div className="desktop-slider-container relative hidden">
      <DesktopHero layout={slides[index]} slideKey={index} />

      {/* Bottom controls: arrows + dots in one pill */}
      <div className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-2xl bg-white/80 px-2 py-1 shadow ring-1 ring-black/5 backdrop-blur-md">
        {/* RTL-friendly: Next on the left */}
        <button
          aria-label="Next"
          onClick={next}
          className="mx-1 rounded-full p-1 text-pink-600 transition hover:bg-pink-50"
        >
          ‹
        </button>

        <div className="flex items-center gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-9 bg-pink-600" : "w-3 bg-pink-200"}`}
            />
          ))}
        </div>

        {/* Prev on the right */}
        <button
          aria-label="Previous"
          onClick={prev}
          className="mx-1 rounded-full p-1 text-pink-600 transition hover:bg-pink-50"
        >
          ›
        </button>
      </div>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2">
        <PaginationDesktop
          total={slides.length}
          index={index}
          onDotClick={(i) => setIndex(i)}
          onNext={next}
          onPrev={prev}
        />
      </div>
      <style jsx>{`
        @media (min-width: 1190px) {
          .desktop-slider-container {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
