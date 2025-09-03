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
    <div className="w-full flex flex-col">
      <FilterSection />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5 overflow-y-auto max-h-[60vh]">
        {photos.map((photo, index) => (
          <div
            key={index}
            className={`relative rounded-md overflow-hidden cursor-pointer transition-all duration-200 hover:opacity-90
              ${selectedPhotos.includes(photo) ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => onPhotoSelect(photo)}
          >
            <Image
              src={photo}
              alt={`Uploaded photo ${index + 1}`}
              width={300}
              height={300}
              className="w-full object-cover aspect-square"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
