"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { categories } from "@/constants/categories";
import Reveal from "@/components/Reveal";

// Select 6 categories matching the Figma design
const showcaseCategories = categories.slice(0, 6);

export default function CategoryShowcase() {
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
              href={category.href}
              className="group flex flex-col items-center text-center transition-transform hover:-translate-y-1"
            >
              <div className="relative h-[200px] w-full overflow-hidden rounded-lg border border-slate-100 md:h-[240px] lg:h-[280px]">
                <div
                  className="flex h-full w-full items-center justify-center transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundColor: category.backgroundColor }}
                >
                  <Image
                    src={category.image}
                    alt={category.name}
                    width={category.width}
                    height={category.height}
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
