"use client";

import BlurImage from "@/components/ui/BlurImage";
import imageLoader from "@/utils/imageLoader";
import type { FC} from "react";
import { useState } from "react";

interface ImageSliderProps {
  images: string[];
  title: string;
  priority?: boolean;
}

const ImageSlider: FC<ImageSliderProps> = ({ images, title, priority = false }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

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
    <div className="relative mx-auto h-[196px] w-[168px] overflow-hidden rounded-[21px] md:h-[270px] md:w-auto">
      <div
        className="flex h-full snap-x snap-mandatory overflow-x-auto scrollbar-none [overscroll-behavior-x:contain] [touch-action:pan-x] [-webkit-overflow-scrolling:touch]"
        onScroll={handleScroll}
      >
        {validImages.map((image, index) => (
          <div key={index} className="relative h-full w-full flex-none snap-start">
            <BlurImage
              src={image}
              alt={`${title} - ${index + 1}`}
              fill
              className="select-none object-cover"
              sizes="(max-width: 768px) 260px, (max-width: 1024px) 300px, 350px"
              priority={priority && index === 0}
              loading={priority && index === 0 ? "eager" : "lazy"}
              loader={imageLoader}
            />
          </div>
        ))}
      </div>

      {validImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-0.5">
          {validImages.map((_, index) => (
            <div
              key={index}
              className={`h-0.5 rounded-full transition-all duration-300 ${
                currentSlide === index ? "w-7 bg-foreground-primary" : "w-[9px] bg-white"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageSlider;
