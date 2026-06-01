"use client";

import React, { useMemo, useRef } from "react";
import MobileHero from "./mobileHero";
import { defaultSliderConfig, type MobileLayout } from "./config";
import PaginationMobile from "./PaginationMobile";
import { useAutoplaySlider } from "./useAutoplaySlider";

interface MobileSliderProps {
  slides?: MobileLayout[];
  autoplayInterval?: number;
  autoplayEligibility?: boolean[];
}

export default function MobileSlider({
  slides: customSlides,
  autoplayInterval = defaultSliderConfig.autoplayInterval,
  autoplayEligibility,
}: MobileSliderProps = {}) {
  const slides = useMemo(() => customSlides ?? defaultSliderConfig.mobile, [customSlides]);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const { index, goTo, next, prev } = useAutoplaySlider({
    slidesLength: slides.length,
    autoplayInterval,
    autoplayEligibility,
  });

  if (slides.length === 0) {
    return null;
  }

  return (
    <div ref={hostRef} className="mobile-slider-container block space-y-2 pb-0 [touch-action:manipulation]">
      <MobileHero layout={slides[index]} slideKey={index} />

      <div className="flex w-full items-center justify-center">
        <PaginationMobile
          total={slides.length}
          index={index}
          onDotClick={goTo}
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
