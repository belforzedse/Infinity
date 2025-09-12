"use client";

import Image from "next/image";
import imageLoader from "@/utils/imageLoader";
import ChevronDownIcon from "../../Icons/ChevronDownIcon";
import NavigationButtons from "../../NavigationButtons";
import { useEffect, useState } from "react";

type Props = {
  type: "video" | "image";
  src: string;
  alt?: string;
  goToNextImage: () => void;
  goToPreviousImage: () => void;
};

export default function PDPHeroGallerySingleImage(props: Props) {
  const { type, src, alt, goToNextImage, goToPreviousImage } = props;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Start loading state whenever src/type changes
    setIsLoading(true);
  }, [src, type]);

  // Keyboard navigation for accessibility and faster UX
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNextImage();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPreviousImage();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goToNextImage, goToPreviousImage]);

  return (
    <div className="h-full flex-1">
      <div className="relative h-[485px] w-full overflow-hidden rounded-3xl">
        {type === "video" ? (
          <video
            className={`h-full w-full object-contain transition-opacity duration-300 ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
            src={src}
            controls
            loop
            onCanPlay={() => setIsLoading(false)}
          />
        ) : (
          <Image
            className={`h-full w-full object-cover transition-all duration-300 ease-out ${
              isLoading ? "opacity-0 scale-[1.02] blur-[2px]" : "opacity-100"
            }`}
            src={src}
            alt={alt || ""}
            fill
            loader={imageLoader}
            sizes="(max-width: 768px) 100vw, 640px"
            onLoadingComplete={() => setIsLoading(false)}
          />
        )}

        {/* Soft skeleton overlay while image/video loads */}
        {isLoading && (
          <div className="absolute inset-0 animate-pulse bg-gray-100" />
        )}

        <button className="absolute left-2 top-2 z-10 hidden h-[64px] w-[64px] flex-col items-center justify-center gap-2 rounded-full border border-pink-200 bg-white md:flex">
          <div className="text-[9px] text-pink-600">استایل بساز</div>
          <ChevronDownIcon />
        </button>

        <div className="absolute bottom-3 left-[50%] z-10 translate-x-[-50%]">
          <NavigationButtons
            goToNextImage={goToNextImage}
            goToPreviousImage={goToPreviousImage}
          />
        </div>
      </div>
    </div>
  );
}
