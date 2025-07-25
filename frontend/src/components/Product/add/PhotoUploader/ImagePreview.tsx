import React from "react";
import Image from "next/image";
import DeleteIcon from "@/components/Kits/Icons/DeleteIcon";
import { IMAGE_BASE_URL } from "@/constants/api";

export interface ImagePreviewProps {
  preview: string;
  onRemove: () => void;
  index: number;
}

const PhotoUploaderImagePreview: React.FC<ImagePreviewProps> = ({
  preview,
  onRemove,
  index,
}) => (
  <div className="relative aspect-square flex flex-col items-end justify-center mb-5">
    <Image
      src={IMAGE_BASE_URL + preview}
      alt={`Uploaded image ${index + 1}`}
      fill
      className="object-cover rounded-lg"
    />

    <button
      onClick={onRemove}
      className="absolute lg:flex hidden top-1 right-1 p-1 bg-pink-500 rounded-full hover:bg-pink-600 transition-colors text-white"
    >
      <DeleteIcon className="w-4 h-4" />
    </button>

    <button
      onClick={onRemove}
      className="z-50 flex items-center gap-1 absolute -bottom-5 right-1/2 translate-x-1/2"
    >
      <span className="text-sm text-actions-primary whitespace-nowrap">
        حذف تصویر
      </span>
      <DeleteIcon className="w-4 h-4 text-actions-primary" />
    </button>
  </div>
);

export default PhotoUploaderImagePreview;
