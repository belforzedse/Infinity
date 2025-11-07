"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import MobileHero from "./mobileHero";
import { defaultSliderConfig, type MobileLayout } from "./config";
import PaginationMobile from "./PaginationMobile";

interface MobileSliderProps {
  slides?: MobileLayout[];
  autoplayInterval?: number;
}

export default function MobileSlider({
  slides: customSlides,
  autoplayInterval = defaultSliderConfig.autoplayInterval,
}: MobileSliderProps = {}) {
  const slides = useMemo(() => customSlides ?? defaultSliderConfig.mobile, [customSlides]);
  const [index, setIndex] = useState(0);
  const [playKey, setPlayKey] = useState(0);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
      setPlayKey((k) => k + 1);
    }, autoplayInterval);
    return () => clearInterval(id);
  }, [slides.length, autoplayInterval]);

  const next = () => {
    setIndex((i) => (i + 1) % slides.length);
    setPlayKey((k) => k + 1);
  };
  const prev = () => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
    setPlayKey((k) => k + 1);
  };

  return (
    <div ref={hostRef} className="mobile-slider-container block space-y-6 pb-12 [touch-action:manipulation]">
      <MobileHero layout={slides[index]} playKey={playKey} />

      {/* Pagination below content, not overlaying images */}
      <div className="flex w-full items-center justify-center">
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
        @media (min-width: 768px) {
          .mobile-slider-container {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}


