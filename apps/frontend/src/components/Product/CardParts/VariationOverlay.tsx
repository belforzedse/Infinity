"use client";

import Image from "next/image";
import { type FC } from "react";
import { faNum } from "@/utils/faNum";
import imageLoader from "@/utils/imageLoader";
import ColorSwatches from "../ColorSwatches";

interface VariationOverlayProps {
  variationImages: string[];
  colorsCount?: number;
  validImagesCount: number;
  colorCodes?: string[];
  title: string;
}

export const VariationOverlay: FC<VariationOverlayProps> = ({
  variationImages,
  colorsCount,
  validImagesCount,
  colorCodes,
  title,
}) => {
  return (
    <div className="absolute inset-x-0 -bottom-4 z-10 hidden translate-y-full px-3 py-4 backdrop-blur-md transition-transform duration-500 ease-out md:block md:group-hover:translate-y-0 md:group-focus-within:translate-y-0">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[10px] text-infinity-primary">
          موجود در {faNum(colorsCount || validImagesCount)} رنگ بندی متفاوت!
        </span>
        <ColorSwatches
          colorCodes={colorCodes}
          colorsCount={colorsCount}
          maxVisible={2}
          size="sm"
          className="shrink-0"
        />
      </div>

      {variationImages.length > 0 && (
        <div className="flex h-20 gap-2">
          {variationImages.map((img, idx) => (
            <div
              key={`${img}-${idx}`}
              className="relative flex-1 overflow-hidden rounded-[14px] border border-neutral-100 shadow-sm transition-transform hover:scale-[1.05]"
            >
              <Image
                src={img}
                alt={`${title} - تصویر ${faNum(idx + 2)}`}
                fill
                className="object-cover"
                loader={imageLoader}
                sizes="80px"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
