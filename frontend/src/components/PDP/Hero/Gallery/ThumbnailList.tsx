"use client";

import Image from "next/image";
import imageLoader from "@/utils/imageLoader";
import { useRef, useEffect, useState, useCallback } from "react";

type Props = {
  assets: {
    id: string;
    type: "video" | "image";
    src: string;
    thumbnail: string;
    alt: string;
  }[];
  selectedImage: string;
  setSelectedImage: (id: string) => void;
};

export default function PDPHeroGalleryThumbnailList(props: Props) {
  const { assets, selectedImage, setSelectedImage } = props;
  const [showBlur, setShowBlur] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const preloadSrc = useCallback((src: string) => {
    if (typeof window === "undefined") return;
    try {
      const img = new window.Image();
      img.src = src;
    } catch {}
  }, []);

  const scrollToImage = (index: number) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const isMobile = window.innerWidth < 900;

    // Find the actual DOM element for the thumbnail at this index
    const thumbnailElements = container.querySelectorAll('[data-thumbnail-index]');
    const targetElement = thumbnailElements[index] as HTMLElement;
    
    if (targetElement) {
      // Use scrollIntoView which handles RTL automatically
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: isMobile ? "nearest" : "center",
        inline: isMobile ? "center" : "nearest",
      });
    } else {
      // Fallback to manual calculation if elements not found
      const thumbnailWidth = 84;
      const thumbnailHeight = 132;
      const gap = 8;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      if (isMobile) {
        const itemWidth = thumbnailWidth + gap;
        const scrollPosition = index * itemWidth;
        const centerOffset = (containerWidth - thumbnailWidth) / 2;
        let targetScroll = scrollPosition - centerOffset;
        const maxScroll = Math.max(0, container.scrollWidth - containerWidth);
        targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));

        const currentScroll = container.scrollLeft;
        if (Math.abs(currentScroll - targetScroll) > 10) {
          container.scrollTo({
            left: targetScroll,
            behavior: "smooth",
          });
        }
      } else {
        const scrollPosition = index * (thumbnailHeight + gap);
        const centerOffset = (containerHeight - thumbnailHeight) / 2;
        const targetScroll = Math.max(0, scrollPosition - centerOffset);

        const currentScroll = container.scrollTop;
        if (Math.abs(currentScroll - targetScroll) > 10) {
          container.scrollTo({
            top: targetScroll,
            behavior: "smooth",
          });
        }
      }
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const {
        scrollTop,
        // scrollLeft,
        // scrollWidth,
        scrollHeight,
        clientHeight,
        // clientWidth,
      } = scrollContainerRef.current;

      // Check if we're in mobile view
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        // const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 70;
        setShowBlur(false);
      } else {
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 70;
        setShowBlur(!isAtBottom);
      }
    }
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      handleScroll(); // Check initial state

      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  // Add effect to handle selectedImage changes
  useEffect(() => {
    const selectedIndex = assets.findIndex((asset) => asset.id === selectedImage);
    if (selectedIndex !== -1 && scrollContainerRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        scrollToImage(selectedIndex);
      });
    }
  }, [selectedImage, assets]);

  return (
    <div
      ref={scrollContainerRef}
      className="relative h-auto w-full overflow-x-auto xl:h-[473px] xl:w-[139px] xl:overflow-y-auto xl:overflow-x-hidden [-webkit-overflow-scrolling:touch] [overscroll-behavior-x:contain]"
    >
      <div className="flex min-w-max flex-row-reverse flex-nowrap xl:flex-wrap gap-2 xl:w-full xl:flex-col xl:min-w-0">
        {assets.map((asset, index) => (
          <div
            key={asset.id}
            data-thumbnail-index={index}
            onClick={() => {
              setSelectedImage(asset.id);
            }}
            onMouseEnter={() => preloadSrc(asset.src)}
            className={`relative h-[70px] w-[84px] flex-shrink-0 md:pt-2 xl:pt-0 cursor-pointer overflow-hidden rounded-2xl md:h-[132px] md:w-[139px] ${
              asset.id === selectedImage
                ? "ring-2 ring-pink-500 shadow-lg"
                : "ring-1 ring-black/10"
            }`}
          >
            <div className={`relative h-full w-full ${
              asset.id === selectedImage ? "opacity-60" : "opacity-100"
            }`}>
              <Image
                fill
                src={asset.thumbnail}
                alt={asset.alt}
                sizes="(max-width: 768px) 84px, 139px"
                loader={imageLoader}
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTM5IiBoZWlnaHQ9IjEzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+"
                className="object-cover"
              />
              {/* Gradient overlay for videos */}
              {asset.type === "video" && (
                <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-transparent" />
              )}
            </div>

            {asset.type === "video" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="group/video-thumb flex items-center justify-center transition-all duration-300">
                  <div className="absolute h-12 w-12 rounded-full bg-white/95 backdrop-blur-sm shadow-lg ring-2 ring-pink-200/50 transition-all duration-300 group-hover/video-thumb:scale-110 group-hover/video-thumb:ring-pink-400/70 group-hover/video-thumb:shadow-xl" />
                  <svg
                    className="relative h-5 w-5 text-pink-600 transition-transform duration-300 group-hover/video-thumb:scale-110"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Blur */}
      {showBlur && (
        <div
          className="bottom-0 left-0 hidden h-[71px] w-[40px] xl:sticky xl:left-0 xl:block xl:w-full"
          style={{
            background: "linear-gradient(181.25deg, rgba(255, 255, 255, 0) 44.29%, #FFFFFF 85.78%)",
            backdropFilter: "blur(4px)",
          }}
        />
      )}
    </div>
  );
}
