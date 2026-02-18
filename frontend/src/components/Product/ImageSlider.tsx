"use client";

import BlurImage from "@/components/ui/BlurImage";
import imageLoader from "@/utils/imageLoader";
import type { FC } from "react";

interface ImageSliderProps {
  images: string[];
  title: string;
  priority?: boolean;
  isAvailable?: boolean;
}

/**
 * Displays the product cover image only (no slider).
 * PLP: one image per card for performance; additional images show on hover via VariationOverlay.
 */
const ImageSlider: FC<ImageSliderProps> = ({
  images,
  title,
  priority = false,
  isAvailable = true,
}) => {
  const validImages = images.filter(
    (img) => img && typeof img === "string" && img.trim() !== ""
  );
  const coverImage = validImages[0];

  if (!coverImage) {
    return null;
  }

  return (
    <div
      className="relative mx-auto h-[196px] w-[168px] overflow-hidden rounded-[21px] md:h-[270px] md:w-[250px]"
      role="img"
      aria-label={!isAvailable ? `محصول ${title} ناموجود است` : undefined}
    >
      <div className="relative h-full w-full" aria-hidden={!isAvailable}>
        <BlurImage
          src={coverImage}
          alt={title}
          fill
          className={`select-none object-cover transition-all duration-300 ${
            !isAvailable ? "opacity-60 saturate-[0.4] blur-sm" : ""
          }`}
          sizes="(max-width: 768px) 168px, (max-width: 1024px) 200px, 250px"
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          loader={imageLoader}
        />
      </div>

      {!isAvailable && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-stone-200/20 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label="محصول ناموجود است"
        >
          <div className="rounded-full bg-neutral-800/70 px-4 py-1.5 shadow-xl backdrop-blur-md ring-1 ring-white/20">
            <span className="text-sm font-bold text-white tracking-wider">ناموجود</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageSlider;
