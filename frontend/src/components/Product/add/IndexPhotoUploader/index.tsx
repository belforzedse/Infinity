"use client";

import React from "react";
import IndexPhotoUploaderImagePreview from "./ImagePreview";
import IndexPhotoUploaderActionButtons from "./ActionButtons";
import useIndexImageUpload from "../../../../hooks/useIndexImageUpload";

interface IndexPhotoUploaderProps {
  onImageUpload?: (file: File) => void;
  onImageDelete?: () => void;
  isEditMode?: boolean;
}

const IndexPhotoUploader: React.FC<IndexPhotoUploaderProps> = ({
  onImageUpload,
  onImageDelete,
  isEditMode = false,
}) => {
  const {
    imagePreview,
    fileInputRef,
    handleImageUpload,
    handleDelete,
    handlePreviewClick,
  } = useIndexImageUpload({ onImageUpload, onImageDelete, isEditMode });

  return (
    <div className="flex flex-col items-center gap-2 bg-white py-5 rounded-xl">
      <div
        className="text-sm text-neutral-600 mb-0.5"
        style={{ direction: "rtl" }}
      >
        تصویر شاخص
      </div>

      <IndexPhotoUploaderImagePreview
        imagePreview={imagePreview}
        onUploadButtonClick={() => fileInputRef.current?.click()}
      />

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />

      <IndexPhotoUploaderActionButtons
        onPreviewClick={handlePreviewClick}
        onDeleteClick={handleDelete}
        onEditClick={() => fileInputRef.current?.click()}
      />

      <span className="text-xs mt-3 text-neutral-400">
        اینجا تصویر اصلی محصول را بارگذاری کنید.
      </span>
    </div>
  );
};

export default IndexPhotoUploader;
