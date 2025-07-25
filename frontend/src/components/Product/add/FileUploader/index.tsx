import React from "react";
import { FileType } from "./types";
import FileList from "./FileList";
import { useUpload } from "@/hooks/product/useUpload";

interface FileUploaderProps {
  title: string;
  fileType: FileType;
  iconSrc: string;
  multiple?: boolean;
  initialFiles?: string[];
  isEditMode?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  title,
  fileType,
  iconSrc,
  multiple = true,
  initialFiles = [],
  isEditMode = false,
}) => {
  const { images, videos, files, handleFileUpload, removeFile } = useUpload({
    initialImages: fileType === "image" ? initialFiles : [],
    initialVideos: fileType === "video" ? initialFiles : [],
    initialFiles: fileType === "other" ? initialFiles : [],
    isEditMode,
  });

  const getFilesByType = () => {
    switch (fileType) {
      case "image":
        return images;
      case "video":
        return videos;
      case "other":
        return files;
      default:
        return files;
    }
  };

  return (
    <FileList
      files={getFilesByType()}
      onDeleteFile={removeFile}
      onUpload={(e) => handleFileUpload(e, fileType)}
      title={title}
      fileType={fileType}
      iconSrc={iconSrc}
      multiple={multiple}
    />
  );
};

export default FileUploader;
