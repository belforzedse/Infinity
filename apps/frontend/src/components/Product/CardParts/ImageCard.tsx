import React from "react";
import BlurImage from "@/components/ui/BlurImage";
import ColorSwatches from "@/components/Product/ColorSwatches";
import { faNum } from "@/utils/faNum";
import type { ImageLoaderProps } from "next/image";

interface ImageCardProps {
  image: string;
  title: string;
  discount?: number;
  isAvailable?: boolean;
  priority?: boolean;
  imageLoader: (props: ImageLoaderProps) => string;
  colorCodes?: string[];
  colorsCount?: number;
}

export function ImageCard({
  image,
  title,
  discount,
  isAvailable = true,
  priority = false,
  imageLoader,
  colorCodes,
  colorsCount,
}: ImageCardProps): React.JSX.Element {
  return (
    <div className="relative h-[100px] w-24 shrink-0">
      {discount !== undefined && discount > 0 && (
        <div
          className="absolute left-0 top-0 z-10 rounded-br-xl rounded-tl-xl bg-rose-600 px-2 py-0.5 text-xs text-white"
          role="status"
          aria-label={`${faNum(discount)} درصد تخفیف`}
        >
          ٪{faNum(discount)}
        </div>
      )}
      <BlurImage
        src={image}
        alt={title}
        fill
        className={`rounded-xl object-cover transition-all duration-300 ${
          !isAvailable ? "opacity-60 blur-[0.5px] saturate-[0.4]" : ""
        }`}
        sizes="96px"
        priority={priority}
        loader={imageLoader}
      />
      {!isAvailable && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-stone-200/20 backdrop-blur-[1px]">
          <div className="rounded-full bg-neutral-800/70 px-2.5 py-1 shadow-md ring-1 ring-white/10 backdrop-blur-md">
            <span className="text-[10px] font-bold text-white">ناموجود</span>
          </div>
        </div>
      )}
      <ColorSwatches
        colorCodes={colorCodes}
        colorsCount={colorsCount}
        size="sm"
        className="absolute bottom-1 right-1"
      />
    </div>
  );
}
