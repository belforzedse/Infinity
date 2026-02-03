"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import ChevronLeftIcon from "@/components/PDP/Icons/ChevronLeftIcon";
import ChevronRightIcon from "@/components/PDP/Icons/ChevronRightIcon";
import type { ProductCategorySummary } from "@/services/product/categories";
import { CATEGORY_IMAGE_PLACEHOLDER } from "@/constants/placeholders";

interface CategoryCarouselProps {
  categories: ProductCategorySummary[];
}

const getCategoryColor = (color?: string | null) => (color && color.trim() ? color.trim() : "#f8fafc");

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
  div.innerHTML = "<div style=\"width:8px;height:4px;\"></div>";

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

  const handlePointerDown = (direction: "left" | "right") => (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    pointerHandledRef.current = true;
    scrollByAmount(direction);
  };

  const handleClick = (direction: "left" | "right") => (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
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
        className="grid grid-flow-col auto-cols-[calc(100%/3)] items-stretch gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth snap-x snap-mandatory md:auto-cols-[calc(100%/4)] md:gap-6 lg:auto-cols-[calc(100%/6)] lg:gap-0"
      >
        {categories.map((category, index) => {
          const imageSrc = category.imageUrl || CATEGORY_IMAGE_PLACEHOLDER;
          const label = category.name || category.slug;
          const bgColor = getCategoryColor(category.color);

          return (
            <Link
              key={category.id}
              href={{ pathname: "/plp", query: { category: category.slug } }}
              className="group flex w-full flex-shrink-0 flex-col items-center text-center snap-start"
              aria-label={label}
              data-carousel-item
              style={{ scrollSnapStop: "always" }}
            >
              <Reveal
                delay={index * 50}
                className="hidden w-full lg:block"
                variant="fade-up"
                duration={300}
              >
                <div className="relative h-[340px] w-full overflow-hidden border border-slate-100 transition-transform duration-300 group-hover:-translate-y-0.5">
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ backgroundColor: bgColor }}
                  >
                    <Image
                      src={imageSrc}
                      alt={category.imageAlt || label}
                      width={category.imageWidth || 220}
                      height={category.imageHeight || 260}
                      className="max-h-[230px] w-auto object-contain drop-shadow-md"
                      loading="lazy"
                      sizes="(min-width: 1024px) calc(100vw/6), (min-width: 768px) calc(100vw/4), calc(100vw/3)"
                    />
                  </div>
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-xl bg-white px-3 py-1.5 text-base font-medium shadow-[0_10px_20px_rgba(0,0,0,0.15)]">
                    {label}
                  </span>
                </div>
              </Reveal>

              <Reveal
                delay={index * 30}
                className="flex w-full flex-col items-center lg:hidden"
                variant="fade-up"
                duration={400}
              >
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full p-4 transition-transform group-hover:scale-105 md:h-28 md:w-28"
                  style={{ backgroundColor: bgColor }}
                >
                  <Image
                    src={imageSrc}
                    alt={category.imageAlt || label}
                    width={80}
                    height={80}
                    className="h-16 w-auto md:h-20"
                    loading="lazy"
                    sizes="80px"
                  />
                </div>
                <span className="mt-2 text-center text-sm font-medium md:text-base">{label}</span>
              </Reveal>
            </Link>
          );
        })}
      </div>

      {hasOverflow && canScrollLeft && (
        <button
          type="button"
          aria-label="View previous categories"
          onPointerDown={handlePointerDown("left")}
          onClick={handleClick("left")}
          className="hidden md:flex items-center justify-center rounded-full border border-pink-200 bg-white text-neutral-700 shadow-sm transition hover:bg-pink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 z-10"
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
          className="hidden md:flex items-center justify-center rounded-full border border-pink-200 bg-white text-neutral-700 shadow-sm transition hover:bg-pink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 z-10"
        >
          <ChevronRightIcon />
        </button>
      )}
    </div>
  );
}
