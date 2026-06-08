"use client";

import React from "react";
import Reveal from "@/components/Reveal";
import CategoryCard from "@/components/Categories/CategoryCard";
import type { ProductCategorySummary } from "@/services/product/categories";

interface CategoryShowcaseProps {
  categories: ProductCategorySummary[];
}

export default function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  const showcaseCategories = categories.slice(0, 6);

  if (showcaseCategories.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-4 md:gap-6 lg:grid lg:grid-cols-6 lg:gap-4 lg:overflow-visible">
        {showcaseCategories.map((category, index) => (
          <Reveal
            key={category.id}
            delay={index * 80}
            variant="fade-up"
            duration={600}
            className="w-[calc(50%-0.5rem)] flex-shrink-0 lg:w-full"
          >
            <CategoryCard category={category} size="carousel" />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
