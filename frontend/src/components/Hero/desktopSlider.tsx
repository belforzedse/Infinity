"use client";
import React, { useEffect, useMemo, useState } from "react";
import DesktopHero from "./desktopHero";
import { defaultSliderConfig, type DesktopLayout } from "./config";
import PaginationDesktop from "./PaginationDesktop";

interface DesktopSliderProps {
  slides?: DesktopLayout[];
  autoplayInterval?: number;
}

export default function DesktopSlider({
  slides: customSlides,
  autoplayInterval = defaultSliderConfig.autoplayInterval,
}: DesktopSliderProps = {}) {
  const slides = useMemo(() => customSlides ?? defaultSliderConfig.desktop, [customSlides]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, autoplayInterval);
    return () => clearInterval(id);
  }, [slides.length, autoplayInterval]);

  const next = () => setIndex((i) => (i + 1) % slides.length);
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);

  return (
    <div className="desktop-slider-container relative hidden flex-col gap-8 pb-12">
      <DesktopHero layout={slides[index]} slideKey={index} />

      {/* Bottom controls below the hero content */}
      <div className="flex items-center justify-center py-4">
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
            display: flex;
          }
        }
      `}</style>
    </div>
  );
}

