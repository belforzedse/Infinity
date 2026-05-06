import React from "react";
import PhotoUploaderImageGrid from "../PhotoUploader/ImageGrid";
import UploadButton from "../UploadButton";
import { useUpload } from "@/hooks/product/useUpload";

interface VideoUploaderProps {
  initialVideos?: string[];
  isEditMode?: boolean;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({
  initialVideos = [],
  isEditMode = false,
}) => {
  const { videos, handleFileUpload, removeFile } = useUpload({
    initialVideos,
    isEditMode,
  });

  return (
    <div className="w-full rounded-xl bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-base text-neutral-600">ویدیو</span>
        <UploadButton onUpload={(e) => handleFileUpload(e, "video")} accept="video/*" fileType="video" />
      </div>
      <PhotoUploaderImageGrid
        previews={videos.map((video) => video.preview)}
        onRemoveFile={(index) => removeFile(index, "video")}
      />
    </div>
  );
};

export default VideoUploader;
