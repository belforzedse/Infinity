"use client";

import { useEffect, useMemo, useState } from "react";
import ThumbnailList from "./ThumbnailList";
import SingleImage from "./SingleImage";

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

  // Preload neighbors for smoother transitions
  useEffect(() => {
    if (!selectedImage) return;
    const index = assets.findIndex((a) => a.id === selectedImage);
    if (index === -1) return;
    const preload = (src: string) => {
      try {
        const img = new Image();
        img.src = src;
      } catch {}
    };
    const next = assets[(index + 1) % assets.length];
    const prev = assets[(index - 1 + assets.length) % assets.length];
    if (next?.type === "image") preload(next.src);
    if (prev?.type === "image") preload(prev.src);
  }, [selectedImage, assets]);

  return (
    <div className="top-2 flex h-[500px] flex-1 flex-col-reverse gap-2 md:sticky md:min-w-[640px] md:flex-row">
      <ThumbnailList
        assets={assets}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
      />

      <SingleImage
        type={byId.get(selectedImage)?.type || "image"}
        src={byId.get(selectedImage)?.src || ""}
        thumb={byId.get(selectedImage)?.thumbnail || ""}
        alt={byId.get(selectedImage)?.alt || ""}
        goToNextImage={goToNextImage}
        goToPreviousImage={goToPreviousImage}
      />
    </div>
  );
}
