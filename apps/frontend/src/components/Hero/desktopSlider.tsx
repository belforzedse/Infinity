"use client";

import React, { useMemo } from "react";
import DesktopHero from "./desktopHero";
import { defaultSliderConfig, type DesktopLayout } from "./config";
import PaginationDesktop from "./PaginationDesktop";
import { useAutoplaySlider } from "./useAutoplaySlider";

interface DesktopSliderProps {
  slides?: DesktopLayout[];
  autoplayInterval?: number;
  autoplayEligibility?: boolean[];
}

export default function DesktopSlider({
  slides: customSlides,
  autoplayInterval = defaultSliderConfig.autoplayInterval,
  autoplayEligibility,
}: DesktopSliderProps = {}) {
  const slides = useMemo(() => customSlides ?? defaultSliderConfig.desktop, [customSlides]);
  const { index, setIndex, next, prev } = useAutoplaySlider({
    slidesLength: slides.length,
    autoplayInterval,
    autoplayEligibility,
  });

  if (slides.length === 0) {
    return null;
  }

  return (
    <div className="desktop-slider-container relative hidden flex-col gap-2 pb-0">
      <DesktopHero layout={slides[index]} slideKey={index} />

      <div className="flex items-center justify-center py-1">
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
