"use client";

import Image from "next/image";
import imageLoader from "@/utils/imageLoader";
import NavigationButtons from "../../NavigationButtons";
import { useEffect, useState } from "react";

type Props = {
  type: "video" | "image";
  src: string;
  thumb?: string;
  alt?: string;
  goToNextImage: () => void;
  goToPreviousImage: () => void;
};

export default function PDPHeroGallerySingleImage(props: Props) {
  const { type, src, thumb, alt, goToNextImage, goToPreviousImage } = props;
  const [isLoading, setIsLoading] = useState(true);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    // Start loading state whenever src/type changes
    setIsLoading(true);
    setBroken(false);
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
            onError={() => setIsLoading(false)}
            poster={thumb}
          />
        ) : (
          <Image
            className={`h-full w-full object-cover transition-all duration-300 ease-out ${
              isLoading ? "scale-[1.02] opacity-0 blur-[2px]" : "opacity-100"
            }`}
            src={broken ? "/images/placeholders/image-placeholder.svg" : src}
            alt={alt || ""}
            fill
            loader={imageLoader}
            sizes="(max-width: 768px) 100vw, 640px"
            onLoadingComplete={() => setIsLoading(false)}
            onError={() => {
              setBroken(true);
              setIsLoading(false);
            }}
            priority={false}
          />
        )}

        {/* Blur-up placeholder (uses provided thumbnail) */}
        {isLoading && thumb ? (
          <div
            className="absolute inset-0 scale-105 blur-md transition-opacity duration-300"
            style={{
              backgroundImage: `url(${thumb})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.9,
            }}
          />
        ) : null}
        {/* Fallback skeleton when no thumbnail */}
        {isLoading && !thumb ? (
          <div className="absolute inset-0 animate-pulse bg-gray-100" />
        ) : null}



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
