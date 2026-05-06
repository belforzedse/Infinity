import React from "react";
import Image from "next/image";
import CameraIcon from "../../Icons/CameraIcon";

interface ImagePreviewProps {
  imagePreview: string | null;
  onUploadButtonClick: () => void;
}

const IndexPhotoUploaderImagePreview: React.FC<ImagePreviewProps> = ({
  imagePreview,
  onUploadButtonClick,
}) => {
  const isVideo = imagePreview?.startsWith("blob:") 
    ? false // Blob URLs from FileReader are always images for preview
    : imagePreview?.match(/\.(mp4|webm|ogg|mov)$/i) !== null;

  return (
    <button
      className="flex aspect-video h-32 w-40 cursor-pointer flex-col items-center justify-center rounded-2xl bg-slate-100 transition-colors hover:bg-gray-100"
      onClick={onUploadButtonClick}
    >
      {imagePreview ? (
        <div className="relative h-full w-full">
          {isVideo ? (
            <video
              src={imagePreview}
              className="h-full w-full rounded-lg object-contain"
              controls={false}
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <Image
              src={imagePreview}
              alt="Preview"
              fill
              className="rounded-lg object-contain"
            />
          )}
        </div>
      ) : (
        <CameraIcon className="h-14 w-14 text-gray-400 lg:h-16 lg:w-16" />
      )}

      {/* <MediaUploadModal isOpen={isOpen} onClose={() => setIsOpen(false)} /> */}
    </button>
  );
};

export default IndexPhotoUploaderImagePreview;
