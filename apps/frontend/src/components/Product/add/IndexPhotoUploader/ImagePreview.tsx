import React from "react";
import Image from "next/image";
import CameraIcon from "../../Icons/CameraIcon";
import UploadStatusBadge, { type UploadStatus } from "@/components/Product/add/UploadStatusBadge";
import { RefreshCcw } from "lucide-react";

interface ImagePreviewProps {
  imagePreview: string | null;
  onUploadButtonClick: () => void;
  onRetry?: () => void;
  mimeType?: string;
  uploadStatus?: UploadStatus;
  uploadError?: string | null;
}

const IndexPhotoUploaderImagePreview: React.FC<ImagePreviewProps> = ({
  imagePreview,
  onUploadButtonClick,
  onRetry,
  mimeType,
  uploadStatus,
  uploadError,
}) => {
  const isVideo =
    mimeType?.startsWith("video/") || imagePreview?.match(/\.(mp4|webm|ogg|mov)$/i) !== null;

  return (
    <div className="relative">
      <button
        type="button"
        className="flex aspect-video h-32 w-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl bg-slate-100 transition-colors hover:bg-gray-100"
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

      <div className="absolute bottom-2 left-2 z-10 flex flex-col items-start gap-1">
        <UploadStatusBadge status={uploadStatus} />
        {uploadStatus === "failed" && uploadError ? (
          <span className="max-w-36 rounded-md bg-white/95 px-2 py-1 text-[10px] text-rose-700 shadow-sm">
            {uploadError}
          </span>
        ) : null}
      </div>

      {uploadStatus === "failed" && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="absolute inset-x-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs font-medium text-rose-600 shadow-sm transition hover:bg-white"
        >
          <RefreshCcw className="h-4 w-4" />
          تلاش مجدد
        </button>
      ) : null}
    </div>
  );
};

export default IndexPhotoUploaderImagePreview;
