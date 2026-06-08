"use client";

import { useEffect, useRef, useState } from "react";
import CategoryCard from "@/components/Categories/CategoryCard";
import type { ProductCategorySummary } from "@/services/product/categories";

interface CategoryCarouselProps {
  categories: ProductCategorySummary[];
}

export default function CategoryCarousel({ categories }: CategoryCarouselProps) {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => setIsScrolling(false), 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  if (!categories || categories.length === 0) return null;

  const durationS = Math.max(categories.length * 4, 16);
  const track = [...categories, ...categories];
  const paused = isScrolling;

  return (
    <div className="group overflow-hidden py-3">
      <div
        dir="ltr"
        className="flex gap-3 group-hover:[animation-play-state:paused]"
        style={{
          animation: `category-marquee ${durationS}s linear infinite`,
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        {track.map((category, index) => (
          <div
            key={`${category.id}-${index}`}
            aria-hidden={index >= categories.length ? true : undefined}
            className="w-[116px] shrink-0 lg:w-[180px]"
          >
            <CategoryCard category={category} size="carousel" />
          </div>
        ))}
      </div>
    </div>
  );
}
