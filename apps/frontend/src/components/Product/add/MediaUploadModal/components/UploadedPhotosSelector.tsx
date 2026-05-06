import React from "react";
import Image from "next/image";
import { FilterSection } from "./FilterSection";

interface UploadedPhotosSelectorProps {
  onPhotoSelect: (photoId: string) => void;
  selectedPhotos?: string[];
}

export const UploadedPhotosSelector: React.FC<UploadedPhotosSelectorProps> = ({
  onPhotoSelect,
  selectedPhotos = [],
}) => {
  const photos = [
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
    "/images/clothes-sm.jpg",
  ];

  return (
    <div className="flex w-full flex-col">
      <FilterSection />

      <div className="grid max-h-[60vh] grid-cols-2 gap-1.5 overflow-y-auto sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {photos.map((photo, index) => (
          <div
            key={index}
            className={`relative cursor-pointer overflow-hidden rounded-md transition-all duration-200 hover:opacity-90 ${selectedPhotos.includes(photo) ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => onPhotoSelect(photo)}
          >
            <Image
              src={photo}
              alt={`Uploaded photo ${index + 1}`}
              width={300}
              height={300}
              className="aspect-square w-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
