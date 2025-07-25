"use client";

import { useState } from "react";
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

  const [selectedImage, setSelectedImage] = useState<string>(assets[0].id);

  function goToNextImage() {
    const currentIndex = assets.findIndex(
      (asset) => asset.id === selectedImage
    );
    const nextIndex = (currentIndex + 1) % assets.length;
    setSelectedImage(assets[nextIndex].id);
  }

  function goToPreviousImage() {
    const currentIndex = assets.findIndex(
      (asset) => asset.id === selectedImage
    );
    const previousIndex = (currentIndex - 1 + assets.length) % assets.length;
    setSelectedImage(assets[previousIndex].id);
  }

  return (
    <div className="flex-1 gap-2 md:sticky top-2 md:min-w-[640px] h-[500px] flex flex-col-reverse md:flex-row">
      <ThumbnailList
        assets={assets}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
      />

      <SingleImage
        type={
          assets.find((asset) => asset.id === selectedImage)?.type || "image"
        }
        src={assets.find((asset) => asset.id === selectedImage)?.src || ""}
        alt={assets.find((asset) => asset.id === selectedImage)?.alt || ""}
        goToNextImage={goToNextImage}
        goToPreviousImage={goToPreviousImage}
      />
    </div>
  );
}
