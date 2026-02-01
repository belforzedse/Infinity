import React from "react";
import Image from "next/image";
import imageLoader from "@/utils/imageLoader";
import DeleteIcon from "@/components/Kits/Icons/DeleteIcon";
import { IMAGE_BASE_URL } from "@/constants/api";

export interface ImagePreviewProps {
  preview: string;
  onRemove: () => void;
  index: number;
}

const resolveSrc = (preview: string): string => {
  if (!preview) return "/images/placeholder.png";
  const trimmed = preview.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `${IMAGE_BASE_URL}${trimmed}`;
  }
  try {
    // try constructing absolute URL; if it fails, fall back
    return new URL(trimmed, IMAGE_BASE_URL).toString();
  } catch {
    return `${IMAGE_BASE_URL}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
  }
};

const PhotoUploaderImagePreview: React.FC<ImagePreviewProps> = ({ preview, onRemove, index }) => {
  const isVideo = preview?.match(/\.(mp4|webm|ogg|mov)$/i) !== null || 
                 (preview?.startsWith("blob:") && preview.includes("video"));

  return (
    <div className="group relative mb-5 flex aspect-square flex-col items-end justify-center overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg">
      {isVideo ? (
        <>
          <video
            src={resolveSrc(preview)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            controls={false}
            muted
            playsInline
            preload="metadata"
            poster={resolveSrc(preview)}
          />
          {/* Luxury play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/10">
            <div className="flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="h-12 w-12 rounded-full bg-white/95 backdrop-blur-sm shadow-xl ring-2 ring-pink-200/50 transition-all duration-300 group-hover:scale-110">
                <svg
                  className="relative left-[2px] top-1/2 h-5 w-5 -translate-y-1/2 text-pink-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        </>
      ) : (
        <Image
          src={resolveSrc(preview)}
          alt={`Uploaded image ${index + 1}`}
          fill
          className="rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
          loader={imageLoader}
        />
      )}

    <button
      onClick={onRemove}
      className="absolute right-1 top-1 hidden rounded-full bg-pink-500 p-1 text-white transition-colors hover:bg-pink-600 lg:flex"
    >
      <DeleteIcon className="h-4 w-4" />
    </button>

    <button
      onClick={onRemove}
      className="absolute -bottom-5 right-1/2 z-50 flex translate-x-1/2 items-center gap-1"
    >
      <span className="text-sm whitespace-nowrap text-actions-primary">حذف</span>
      <DeleteIcon className="h-4 w-4 text-actions-primary" />
    </button>
    </div>
  );
};

export default PhotoUploaderImagePreview;
