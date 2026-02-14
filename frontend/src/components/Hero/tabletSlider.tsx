"use client";

import React, { useMemo, useRef } from "react";
import TabletHero from "./tabletHero";
import { defaultSliderConfig, type TabletLayout } from "./config";
import PaginationMobile from "./PaginationMobile";
import { useAutoplaySlider } from "./useAutoplaySlider";

interface TabletSliderProps {
  slides?: TabletLayout[];
  autoplayInterval?: number;
  autoplayEligibility?: boolean[];
}

export default function TabletSlider({
  slides: customSlides,
  autoplayInterval = defaultSliderConfig.autoplayInterval,
  autoplayEligibility,
}: TabletSliderProps = {}) {
  const slides = useMemo(() => customSlides ?? defaultSliderConfig.tablet, [customSlides]);
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
    <div ref={hostRef} className="tablet-slider-container block space-y-6 pb-12 px-4 [touch-action:manipulation]">
      <TabletHero layout={slides[index]} slideKey={index} />

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
        .tablet-slider-container {
          width: 100%;
        }
        @media (max-width: 767px) {
          .tablet-slider-container {
            display: none;
          }
        }
        @media (min-width: 1190px) {
          .tablet-slider-container {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
