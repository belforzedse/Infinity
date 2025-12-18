"use client";

import BlurImage from "@/components/ui/BlurImage";
import imageLoader from "@/utils/imageLoader";
import type { FC} from "react";
import { useState, useEffect } from "react";

interface ImageSliderProps {
  images: string[];
  title: string;
  priority?: boolean;
  isAvailable?: boolean;
}

const ImageSlider: FC<ImageSliderProps> = ({
  images,
  title,
  priority = false,
  isAvailable = true,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const slideWidth = e.currentTarget.clientWidth;
    const newSlide = Math.round(scrollLeft / slideWidth);
    setCurrentSlide(Math.abs(newSlide));
  };

  // Filter out empty, null, or undefined images
  const validImages = images.filter(
    (img) => img && typeof img === "string" && img.trim() !== ""
  );

  // Don't render if no valid images
  if (validImages.length === 0) {
    return null;
  }

  return (
    <div className="relative mx-auto h-[196px] w-[168px] overflow-hidden rounded-[21px] md:h-[270px] md:w-[250px]">
      <div
        className="flex h-full overflow-hidden md:snap-x md:snap-mandatory md:overflow-x-auto scrollbar-none [overscroll-behavior-x:contain] [touch-action:pan-x] [-webkit-overflow-scrolling:touch]"
        onScroll={handleScroll}
      >
        {validImages.map((image, index) => {
          // On mobile, only render the first image
          if (isMobile && index > 0) return null;

          return (
            <div
              key={index}
              className={`relative h-full w-full flex-none snap-start ${index > 0 ? "hidden md:block" : ""}`}
            >
              <BlurImage
                src={image}
                alt={`${title} - ${index + 1}`}
                fill
                className={`select-none object-cover transition-all duration-300 ${
                  !isAvailable ? "opacity-60 saturate-[0.4] blur-[0.5px]" : ""
                }`}
                sizes="(max-width: 768px) 168px, 250px"
                priority={priority && index === 0}
                loading={priority && index === 0 ? "eager" : "lazy"}
                loader={imageLoader}
              />
            </div>
          );
        })}
      </div>

      {!isAvailable && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-200/20 backdrop-blur-[1px]">
          <div className="rounded-full bg-neutral-800/70 px-4 py-1.5 shadow-xl backdrop-blur-md ring-1 ring-white/20">
            <span className="text-sm font-bold text-white tracking-wider">ناموجود</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageSlider;
