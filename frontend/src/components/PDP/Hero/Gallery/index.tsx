"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import ThumbnailList from "./ThumbnailList";
import SingleImage from "./SingleImage";
import { usePreloadOnIntersect } from "@/utils/imagePreloader";

type Props = {
  assets: {
    id: string;
    type: "video" | "image";
    src: string;
    thumbnail: string;
    alt: string;
  }[];
};

export default function PDPHeroGallery(props: Props) {
  const { assets } = props;

  const [selectedImage, setSelectedImage] = useState<string>(assets[0]?.id ?? "");

  // Memoize a lookup map to avoid repeated finds
  const byId = useMemo(() => {
    const m = new Map<string, (typeof assets)[number]>();
    for (const a of assets) m.set(a.id, a);
    return m;
  }, [assets]);

  function goToNextImage() {
    const currentIndex = assets.findIndex((asset) => asset.id === selectedImage);
    const nextIndex = (currentIndex + 1) % assets.length;
    setSelectedImage(assets[nextIndex].id);
  }

  function goToPreviousImage() {
    const currentIndex = assets.findIndex((asset) => asset.id === selectedImage);
    const previousIndex = (currentIndex - 1 + assets.length) % assets.length;
    setSelectedImage(assets[previousIndex].id);
  }

  const galleryRef = useRef<HTMLDivElement>(null);

  // Preload neighbors for smoother transitions using intersection observer
  useEffect(() => {
    if (!selectedImage) return;
    const index = assets.findIndex((a) => a.id === selectedImage);
    if (index === -1) return;

    // Preload next and previous images
    const next = assets[(index + 1) % assets.length];
    const prev = assets[(index - 1 + assets.length) % assets.length];
    const imagesToPreload: string[] = [];

    if (next?.type === "image") imagesToPreload.push(next.src);
    if (prev?.type === "image") imagesToPreload.push(prev.src);

    // Use intersection observer for progressive loading
    if (imagesToPreload.length > 0 && galleryRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Preload images when gallery enters viewport
              imagesToPreload.forEach((src) => {
                try {
                  const img = new Image();
                  img.src = src;
                } catch {}
              });
              // Unobserve after preloading to prevent redundant work
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "200px" },
      );
      observer.observe(galleryRef.current);
      return () => observer.disconnect();
    }
  }, [selectedImage, assets]);

  return (
    <div ref={galleryRef} className="top-2 flex min-w-0 flex-1 flex-col gap-2 xl:sticky md:h-[450px] md:min-w-[300px] tablet:min-w-[400px] xl:flex-row">
      <div className="hidden xl:block">
        <ThumbnailList
          assets={assets}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
        />
      </div>
      <SingleImage
        type={byId.get(selectedImage)?.type || "image"}
        src={byId.get(selectedImage)?.src || ""}
        thumb={byId.get(selectedImage)?.thumbnail || ""}
        alt={byId.get(selectedImage)?.alt || ""}
        goToNextImage={goToNextImage}
        goToPreviousImage={goToPreviousImage}
      />
      <div className="mt-4 md:mt-10 xl:hidden">
        <ThumbnailList
          assets={assets}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
        />
      </div>
    </div>
  );
}
