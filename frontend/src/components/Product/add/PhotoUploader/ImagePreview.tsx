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

const PhotoUploaderImagePreview: React.FC<ImagePreviewProps> = ({ preview, onRemove, index }) => (
  <div className="relative mb-5 flex aspect-square flex-col items-end justify-center">
    <Image
      src={IMAGE_BASE_URL + preview}
      alt={`Uploaded image ${index + 1}`}
      fill
      className="rounded-lg object-cover"
      loader={imageLoader}
    />

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
      <span className="text-sm whitespace-nowrap text-actions-primary">حذف تصویر</span>
      <DeleteIcon className="h-4 w-4 text-actions-primary" />
    </button>
  </div>
);

export default PhotoUploaderImagePreview;
