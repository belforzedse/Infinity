"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "@/components/Reveal";
import ChevronLeftIcon from "@/components/PDP/Icons/ChevronLeftIcon";
import ChevronRightIcon from "@/components/PDP/Icons/ChevronRightIcon";
import CategoryCard from "@/components/Categories/CategoryCard";
import type { ProductCategorySummary } from "@/services/product/categories";

interface CategoryCarouselProps {
  categories: ProductCategorySummary[];
}

type RtlScrollType = "default" | "negative" | "reverse";

let cachedRtlScrollType: RtlScrollType | null = null;

const getRtlScrollType = (): RtlScrollType => {
  if (cachedRtlScrollType) return cachedRtlScrollType;
  if (typeof document === "undefined") return "default";

  const div = document.createElement("div");
  div.dir = "rtl";
  div.style.width = "4px";
  div.style.height = "4px";
  div.style.overflow = "scroll";
  div.style.visibility = "hidden";
  div.style.position = "absolute";
  div.style.top = "-9999px";
  div.innerHTML = '<div style="width:8px;height:4px;"></div>';

  document.body.appendChild(div);

  let type: RtlScrollType = "reverse";

  if (div.scrollLeft > 0) {
    type = "default";
  } else {
    div.scrollLeft = 1;
    if (div.scrollLeft === 0) {
      type = "negative";
    }
  }

  document.body.removeChild(div);
  cachedRtlScrollType = type;
  return type;
};

const getNormalizedScrollLeft = (el: HTMLElement): number => {
  const direction = window.getComputedStyle(el).direction;
  const max = el.scrollWidth - el.clientWidth;

  if (direction !== "rtl") return el.scrollLeft;

  const scrollLeft = el.scrollLeft;
  switch (getRtlScrollType()) {
    case "negative":
      return -scrollLeft;
    case "reverse":
      return max - scrollLeft;
    default:
      return scrollLeft;
  }
};

const scrollToNormalized = (el: HTMLElement, value: number, behavior: ScrollBehavior) => {
  const direction = window.getComputedStyle(el).direction;
  const max = el.scrollWidth - el.clientWidth;
  const clamped = Math.max(0, Math.min(max, value));

  if (direction !== "rtl") {
    el.scrollTo({ left: clamped, behavior });
    return;
  }

  let scrollLeft = clamped;
  switch (getRtlScrollType()) {
    case "negative":
      scrollLeft = -clamped;
      break;
    case "reverse":
      scrollLeft = max - clamped;
      break;
    default:
      scrollLeft = clamped;
      break;
  }

  el.scrollTo({ left: scrollLeft, behavior });
};

export default function CategoryCarousel({ categories }: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const hasInitializedScroll = useRef(false);
  const pointerHandledRef = useRef(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    const normalized = getNormalizedScrollLeft(el);
    setHasOverflow(maxScrollLeft > 1);
    setCanScrollLeft(normalized < maxScrollLeft - 1);
    setCanScrollRight(normalized > 1);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;

    if (!hasInitializedScroll.current) {
      hasInitializedScroll.current = true;
      requestAnimationFrame(() => {
        scrollToNormalized(el, 0, "auto");
        updateScrollState();
      });
    }

    const onScroll = () => updateScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [categories.length]);

  const getScrollStep = () => {
    const el = scrollRef.current;
    if (!el) return 0;
    const firstItem = el.querySelector<HTMLElement>("[data-carousel-item]");
    if (!firstItem) return el.clientWidth * 0.9;
    const styles = window.getComputedStyle(el);
    const gapValue = styles.columnGap || styles.gap || "0";
    const gap = Number.parseFloat(gapValue) || 0;
    return firstItem.offsetWidth + gap;
  };

  const scrollByAmount = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const step = getScrollStep();
    const itemsPerView = step ? Math.max(1, Math.round(el.clientWidth / step)) : 1;
    const amount = step ? step * itemsPerView : el.clientWidth * 0.9;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    const current = getNormalizedScrollLeft(el);
    const next = direction === "left" ? current + amount : current - amount;
    const clamped = Math.max(0, Math.min(maxScrollLeft, next));
    scrollToNormalized(el, clamped, "smooth");
  };

  const handlePointerDown =
    (direction: "left" | "right") => (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      pointerHandledRef.current = true;
      scrollByAmount(direction);
    };

  const handleClick =
    (direction: "left" | "right") => (event: React.MouseEvent<HTMLButtonElement>) => {
      if (pointerHandledRef.current) {
        pointerHandledRef.current = false;
        return;
      }
      event.preventDefault();
      scrollByAmount(direction);
    };

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="scrollbar-hide grid snap-x snap-mandatory auto-cols-[calc(100%/3)] grid-flow-col items-stretch gap-4 overflow-x-auto scroll-smooth pb-4 md:auto-cols-[calc(100%/4)] md:gap-6 min-[900px]:auto-cols-[calc(100%/5)] xl:auto-cols-[calc(100%/6)] xl:gap-0"
      >
        {categories.map((category, index) => (
          <div
            key={category.id}
            className="w-full flex-shrink-0 snap-start"
            data-carousel-item
            style={{ scrollSnapStop: "always" }}
          >
            <Reveal delay={index * 50} variant="fade-up" duration={300}>
              <CategoryCard category={category} size="carousel" />
            </Reveal>
          </div>
        ))}
      </div>

      {hasOverflow && canScrollLeft && (
        <button
          type="button"
          aria-label="View previous categories"
          onPointerDown={handlePointerDown("left")}
          onClick={handleClick("left")}
          className="absolute left-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-infinity-primary-lighter/60 bg-white text-neutral-700 shadow-sm transition hover:bg-infinity-primary-lighter/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-infinity-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white md:flex"
        >
          <ChevronLeftIcon />
        </button>
      )}

      {hasOverflow && canScrollRight && (
        <button
          type="button"
          aria-label="View next categories"
          onPointerDown={handlePointerDown("right")}
          onClick={handleClick("right")}
          className="absolute right-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-infinity-primary-lighter/60 bg-white text-neutral-700 shadow-sm transition hover:bg-infinity-primary-lighter/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-infinity-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white md:flex"
        >
          <ChevronRightIcon />
        </button>
      )}
    </div>
  );
}
