"use client";
import React, { useEffect, useMemo, useState } from "react";
import DesktopHero from "./desktopHero";
import { defaultSliderConfig, type DesktopLayout } from "./config";
import PaginationDesktop from "./PaginationDesktop";

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
  const [index, setIndex] = useState(0);
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
      }
    }
  }, [autoplayEligibility, index, slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || !hasEligibleAutoplaySlides) return;
    const id = setInterval(() => {
      setIndex((i) => findNextAutoplayIndex(i));
    }, normalizedInterval);
    return () => clearInterval(id);
  }, [slides.length, normalizedInterval, hasEligibleAutoplaySlides, autoplayEligibility]);

  if (slides.length === 0) {
    return null;
  }

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
