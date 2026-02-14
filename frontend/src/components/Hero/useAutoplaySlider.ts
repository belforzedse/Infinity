"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_INTERVAL_MS = 600000;

export interface UseAutoplaySliderOptions {
  /** Total number of slides */
  slidesLength: number;
  /** Autoplay interval in ms; minimum 3000 */
  autoplayInterval?: number;
  /** Per-slide eligibility for autoplay; when length matches slidesLength, only eligible slides advance */
  autoplayEligibility?: boolean[];
}

export interface UseAutoplaySliderReturn {
  index: number;
  setIndex: React.Dispatch<React.SetStateAction<number>>;
  /** Go to slide and bump playKey (for tablet/mobile pagination) */
  goTo: (i: number) => void;
  next: () => void;
  prev: () => void;
  playKey: number;
}

/**
 * Shared autoplay and index state for hero sliders.
 * Uses functional setState in interval to avoid stale closures.
 */
export function useAutoplaySlider({
  slidesLength,
  autoplayInterval = DEFAULT_INTERVAL_MS,
  autoplayEligibility,
}: UseAutoplaySliderOptions): UseAutoplaySliderReturn {
  const [index, setIndex] = useState(0);
  const [playKey, setPlayKey] = useState(0);

  const normalizedInterval =
    typeof autoplayInterval === "number" && autoplayInterval >= 3000
      ? autoplayInterval
      : DEFAULT_INTERVAL_MS;

  const hasEligibleAutoplaySlides = useMemo(() => {
    if (!autoplayEligibility || autoplayEligibility.length === 0) return slidesLength > 1;
    return autoplayEligibility.some(Boolean);
  }, [autoplayEligibility, slidesLength]);

  const findNextAutoplayIndex = useMemo(() => {
    return (current: number) => {
      if (!autoplayEligibility || autoplayEligibility.length !== slidesLength) {
        return (current + 1) % slidesLength;
      }
      for (let step = 1; step <= slidesLength; step += 1) {
        const candidate = (current + step) % slidesLength;
        if (autoplayEligibility[candidate]) {
          return candidate;
        }
      }
      return current;
    };
  }, [autoplayEligibility, slidesLength]);

  useEffect(() => {
    if (slidesLength === 0) {
      setIndex(0);
      return;
    }
    setIndex((i) => (i >= slidesLength ? 0 : i));
  }, [slidesLength]);

  useEffect(() => {
    if (slidesLength === 0) return;
    if (
      autoplayEligibility &&
      autoplayEligibility.length === slidesLength &&
      !autoplayEligibility[index]
    ) {
      const firstEligible = autoplayEligibility.findIndex(Boolean);
      if (firstEligible >= 0) {
        setIndex(firstEligible);
        setPlayKey((k) => k + 1);
      }
    }
  }, [autoplayEligibility, index, slidesLength]);

  useEffect(() => {
    if (slidesLength <= 1 || !hasEligibleAutoplaySlides) return;
    const id = setInterval(() => {
      setIndex((i) => findNextAutoplayIndex(i));
      setPlayKey((k) => k + 1);
    }, normalizedInterval);
    return () => clearInterval(id);
  }, [slidesLength, normalizedInterval, hasEligibleAutoplaySlides, findNextAutoplayIndex]);

  const next = () => {
    setIndex((i) => (i + 1) % slidesLength);
    setPlayKey((k) => k + 1);
  };
  const prev = () => {
    setIndex((i) => (i - 1 + slidesLength) % slidesLength);
    setPlayKey((k) => k + 1);
  };
  const goTo = (i: number) => {
    setIndex(i);
    setPlayKey((k) => k + 1);
  };

  return { index, setIndex, goTo, next, prev, playKey };
}
