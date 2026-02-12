"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import TabletHero from "./tabletHero";
import { defaultSliderConfig, type TabletLayout } from "./config";
import PaginationMobile from "./PaginationMobile";

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
  const [index, setIndex] = useState(0);
  const [playKey, setPlayKey] = useState(0);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const normalizedInterval =
    typeof autoplayInterval === "number" && autoplayInterval >= 3000
      ? autoplayInterval
      : (defaultSliderConfig.autoplayInterval ?? 600000);

  const hasEligibleAutoplaySlides = useMemo(() => {
    if (!autoplayEligibility || autoplayEligibility.length === 0) return slides.length > 1;
    return autoplayEligibility.some(Boolean);
  }, [autoplayEligibility, slides.length]);

  const findNextAutoplayIndex = (current: number) => {
    if (!autoplayEligibility || autoplayEligibility.length !== slides.length) {
      return (current + 1) % slides.length;
    }

    for (let step = 1; step <= slides.length; step += 1) {
      const candidate = (current + step) % slides.length;
      if (autoplayEligibility[candidate]) {
        return candidate;
      }
    }

    return current;
  };

  useEffect(() => {
    if (slides.length === 0) {
      setIndex(0);
      return;
    }

    if (index >= slides.length) {
      setIndex(0);
      return;
    }

    if (autoplayEligibility && autoplayEligibility.length === slides.length && !autoplayEligibility[index]) {
      const firstEligible = autoplayEligibility.findIndex(Boolean);
      if (firstEligible >= 0) {
        setIndex(firstEligible);
        setPlayKey((k) => k + 1);
      }
    }
  }, [autoplayEligibility, index, slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || !hasEligibleAutoplaySlides) return;
    const id = setInterval(() => {
      setIndex((i) => findNextAutoplayIndex(i));
      setPlayKey((k) => k + 1);
    }, normalizedInterval);
    return () => clearInterval(id);
  }, [slides.length, normalizedInterval, hasEligibleAutoplaySlides, autoplayEligibility]);

  if (slides.length === 0) {
    return null;
  }

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
      <TabletHero layout={slides[index]} slideKey={index} />

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
