import React, { useState } from "react";
import Image from "next/image";
import imageLoader from "@/utils/imageLoader";
import DeleteIcon from "@/components/Kits/Icons/DeleteIcon";
import { IMAGE_BASE_URL } from "@/constants/api";
import UploadStatusBadge, { type UploadStatus } from "@/components/Product/add/UploadStatusBadge";
import { RefreshCcw } from "lucide-react";
import VideoPreviewModal from "../VideoPreviewModal";

export interface ImagePreviewProps {
  preview: string;
  onRemove: () => void;
  onRetry?: () => void;
  index: number;
  mimeType?: string;
  uploadStatus?: UploadStatus;
  uploadError?: string | null;
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

const PhotoUploaderImagePreview: React.FC<ImagePreviewProps> = ({
  preview,
  onRemove,
  onRetry,
  index,
  mimeType,
  uploadStatus,
  uploadError,
}) => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const isVideo =
    mimeType?.startsWith("video/") ||
    preview?.match(/\.(mp4|webm|ogg|mov)$/i) !== null ||
    (preview?.startsWith("blob:") && preview.includes("video"));

  return (
    <>
      <div className="group relative mb-5 flex aspect-square flex-col items-end justify-center overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg">
        {isVideo ? (
          <>
            <video
              src={resolveSrc(preview)}
              className="h-full w-full object-contain cursor-pointer"
              controls={false}
              muted
              playsInline
              preload="metadata"
              poster={resolveSrc(preview)}
              onClick={() => setIsVideoModalOpen(true)}
            />
            {/* Luxury play button overlay */}
            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/10 cursor-pointer"
            >
              <div className="flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="h-12 w-12 rounded-full bg-white/95 shadow-xl ring-2 ring-infinity-primary-lighter/50 transition-all duration-300 group-hover:scale-110">
                  <svg
                    className="relative left-[2px] top-1/2 h-5 w-5 -translate-y-1/2 text-infinity-primary"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </button>
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
        className="absolute inset-x-4 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs font-medium text-rose-600 shadow-sm transition hover:bg-white"
      >
        <RefreshCcw className="h-4 w-4" />
        تلاش مجدد
      </button>
    ) : null}

    <button
      onClick={onRemove}
      aria-label="حذف رسانه"
      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-infinity-primary text-white shadow-sm transition-opacity hover:bg-infinity-primary lg:h-8 lg:w-8 lg:opacity-0 lg:group-hover:opacity-100"
    >
      <DeleteIcon className="h-4 w-4" />
    </button>
    </div>

    {/* Video Preview Modal */}
    {isVideo && (
      <VideoPreviewModal
        videoUrl={preview}
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
    )}
    </>
  );
};

export default PhotoUploaderImagePreview;
