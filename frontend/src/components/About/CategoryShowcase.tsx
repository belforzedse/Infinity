"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import type { ProductCategorySummary } from "@/services/product/categories";
import { CATEGORY_IMAGE_PLACEHOLDER } from "@/constants/placeholders";

interface CategoryShowcaseProps {
  categories: ProductCategorySummary[];
}

const getCategoryColor = (color?: string | null) => (color && color.trim() ? color.trim() : "#f8fafc");

export default function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  const showcaseCategories = categories.slice(0, 6);

  if (showcaseCategories.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide md:gap-6 lg:grid lg:grid-cols-6 lg:gap-0 lg:overflow-visible">
        {showcaseCategories.map((category, index) => (
          <Reveal
            key={category.id}
            delay={index * 80}
            variant="fade-up"
            duration={600}
            className="flex-shrink-0"
          >
            <Link
              href={{ pathname: "/plp", query: { category: category.slug } }}
              className="group flex flex-col items-center text-center transition-transform hover:-translate-y-1"
            >
              <div className="relative h-[200px] w-full overflow-hidden rounded-lg border border-slate-100 md:h-[240px] lg:h-[280px]">
                <div
                  className="flex h-full w-full items-center justify-center transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundColor: getCategoryColor(category.color) }}
                >
                  <Image
                    src={category.imageUrl || CATEGORY_IMAGE_PLACEHOLDER}
                    alt={category.imageAlt || category.name}
                    width={category.imageWidth || 200}
                    height={category.imageHeight || 240}
                    className="max-h-[160px] w-auto object-contain drop-shadow-md md:max-h-[200px]"
                    loading="lazy"
                    sizes="(max-width: 768px) 150px, (max-width: 1024px) 200px, 240px"
                  />
                </div>
              </div>
              <span className="mt-3 text-sm font-medium text-foreground-primary md:text-base">
                {category.name}
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
