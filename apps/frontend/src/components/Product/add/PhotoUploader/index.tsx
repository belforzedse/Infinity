import React from "react";
import PhotoUploaderImageGrid from "./ImageGrid";
import UploadButton from "../UploadButton";
import { useUpload } from "@/hooks/product/useUpload";

interface PhotoUploaderProps {
  initialImages?: string[];
  isEditMode?: boolean;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  initialImages = [],
  isEditMode = false,
}) => {
  const { images, handleFileUpload, removeFile, retryFile, reorderImages } = useUpload({
    initialImages,
    isEditMode,
  });

  return (
    <div className="w-full rounded-xl bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-base text-neutral-600">تصاویر</span>
        <UploadButton onUpload={(e) => handleFileUpload(e, "image")} accept="image/*" />
      </div>
      <PhotoUploaderImageGrid
        items={images}
        onRemoveFile={(index) => removeFile(index, "image")}
        onRetryFile={(index) => retryFile(index, "image")}
        onReorder={reorderImages}
      />
    </div>
  );
};

export default PhotoUploader;
