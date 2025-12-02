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
  const { images, handleFileUpload, removeFile } = useUpload({
    initialImages,
    isEditMode,
  });

  return (
    <div className="w-full rounded-xl bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-base text-neutral-600">تصاویر</span>
        <UploadButton onUpload={(e) => handleFileUpload(e, "image")} />
      </div>
      <PhotoUploaderImageGrid
        previews={images.map((image) => image.preview)}
        onRemoveFile={removeFile}
      />
    </div>
  );
};

export default PhotoUploader;
