"use client";

import Image from "next/image";
import { useRef, useEffect, useState } from "react";

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

  const scrollToImage = (index: number) => {
    if (scrollContainerRef.current) {
      const thumbnailWidth = 84; // Width of each thumbnail on mobile
      const thumbnailHeight = 132; // Height of each thumbnail on desktop
      const gap = 8; // Gap between thumbnails
      const containerWidth = scrollContainerRef.current.clientWidth;
      const containerHeight = scrollContainerRef.current.clientHeight;

      // Check if we're in mobile view (scrolling horizontally)
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        const scrollPosition = index * (thumbnailWidth + gap);
        // Center the selected thumbnail horizontally
        const centerOffset = (containerWidth - thumbnailWidth) / 2;
        const targetScroll = Math.max(0, scrollPosition - centerOffset);

        scrollContainerRef.current.scrollTo({
          left: targetScroll,
          behavior: "smooth",
        });
      } else {
        // Desktop view (scrolling vertically)
        const scrollPosition = index * (thumbnailHeight + gap);
        // Center the selected thumbnail vertically
        const centerOffset = (containerHeight - thumbnailHeight) / 2;
        const targetScroll = Math.max(0, scrollPosition - centerOffset);

        scrollContainerRef.current.scrollTo({
          top: targetScroll,
          behavior: "smooth",
        });
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
    const selectedIndex = assets.findIndex(
      (asset) => asset.id === selectedImage
    );
    if (selectedIndex !== -1) {
      scrollToImage(selectedIndex);
    }
  }, [selectedImage, assets]);

  return (
    <div
      ref={scrollContainerRef}
      className="md:h-[473px] overflow-x-auto md:overflow-x-hidden md:overflow-y-auto w-full md:w-[139px] relative h-auto"
    >
      <div className="flex flex-row-reverse md:flex-col gap-2 w-fit md:w-full">
        {assets.map((asset) => (
          <div
            key={asset.id}
            onClick={() => {
              setSelectedImage(asset.id);
            }}
            className="rounded-2xl overflow-hidden md:w-[139px] md:h-[132px] w-[84px] h-[70px] relative cursor-pointer"
          >
            <div className={asset.id === selectedImage ? "opacity-50" : ""}>
              <Image fill src={asset.thumbnail} alt={asset.alt} />
            </div>

            {asset.type === "video" && (
              <button className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
                <Image
                  width={24}
                  height={24}
                  src="/images/pdp/play-icon.png"
                  alt="close"
                />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Blur */}
      {showBlur && (
        <div
          className="h-[71px] w-[40px] md:w-full hidden md:block md:sticky bottom-0 left-0 md:left-0"
          style={{
            background:
              "linear-gradient(181.25deg, rgba(255, 255, 255, 0) 44.29%, #FFFFFF 85.78%)",
            backdropFilter: "blur(4px)",
          }}
        />
      )}
    </div>
  );
}
