"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import MobileHero from "./mobileHero";
import { mobileSlides } from "./config/mobileSlides";
import PaginationMobile from "./PaginationMobile";

export default function MobileSlider() {
  const slides = useMemo(() => mobileSlides, []);
  const [index, setIndex] = useState(0);
  const [playKey, setPlayKey] = useState(0);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
      setPlayKey((k) => k + 1);
    }, 7000);
    return () => clearInterval(id);
  }, [slides.length]);

  const next = () => {
    setIndex((i) => (i + 1) % slides.length);
    setPlayKey((k) => k + 1);
  };
  const prev = () => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
    setPlayKey((k) => k + 1);
  };

  return (
    <div ref={hostRef} className="mobile-slider-container block">
      <MobileHero layout={slides[index]} playKey={playKey} />

      {/* Pagination below content, not overlaying images */}
      <div className="mb-2 mt-3 flex w-full items-center justify-center">
        <PaginationMobile
          total={slides.length}
          index={index}
          onDotClick={(i) => {
            setIndex(i);
            setPlayKey((k) => k + 1);
          }}
          onNext={next}
          onPrev={prev}
          className="px-2 py-0"
        />
      </div>
      <style jsx>{`
        .mobile-slider-container {
          width: 100%;
        }
        @media (min-width: 1190px) {
          .mobile-slider-container {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
