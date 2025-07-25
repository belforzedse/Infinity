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
  return (
    <button
      className="w-40 h-32 aspect-video bg-slate-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={onUploadButtonClick}
    >
      {imagePreview ? (
        <div className="relative w-full h-full">
          <Image
            src={imagePreview}
            alt="Preview"
            layout="fill"
            objectFit="contain"
            className="rounded-lg"
          />
        </div>
      ) : (
        <CameraIcon className="lg:w-16 lg:h-16 w-14 h-14 text-gray-400" />
      )}

      {/* <MediaUploadModal isOpen={isOpen} onClose={() => setIsOpen(false)} /> */}
    </button>
  );
};

export default IndexPhotoUploaderImagePreview;
