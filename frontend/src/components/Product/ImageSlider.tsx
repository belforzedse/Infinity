"use client";

import BlurImage from "@/components/ui/BlurImage";
import imageLoader from "@/utils/imageLoader";
import { FC, useState } from "react";

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

  return (
    <div className="relative h-[270px] w-full overflow-hidden rounded-2xl md:h-[300px]">
      <div
        className="flex h-full snap-x snap-mandatory overflow-x-auto scrollbar-none"
        onScroll={handleScroll}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className="relative h-full w-full flex-none snap-start"
          >
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

      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-0.5">
          {images.map((_, index) => (
            <div
              key={index}
              className={`h-0.5 rounded-full transition-all duration-300 ${
                currentSlide === index
                  ? "w-7 bg-foreground-primary"
                  : "w-[9px] bg-white"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageSlider;
