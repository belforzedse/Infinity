"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import TabletHero from "./tabletHero";
import { defaultSliderConfig, type TabletLayout } from "./config";
import PaginationMobile from "./PaginationMobile";

interface TabletSliderProps {
  slides?: TabletLayout[];
  autoplayInterval?: number;
}

export default function TabletSlider({
  slides: customSlides,
  autoplayInterval = defaultSliderConfig.autoplayInterval,
}: TabletSliderProps = {}) {
  const slides = useMemo(() => customSlides ?? defaultSliderConfig.tablet, [customSlides]);
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
    <div ref={hostRef} className="tablet-slider-container block space-y-6 pb-12 px-4 [touch-action:manipulation]">
      <TabletHero layout={slides[index]} playKey={playKey} />

      {/* Pagination below content */}
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
