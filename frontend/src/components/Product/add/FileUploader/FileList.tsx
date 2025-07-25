import React from "react";
import { FileListProps } from "./types";
import FileItem from "./FileItem";
import UploadButton from "../UploadButton";

const FileList: React.FC<FileListProps> = ({
  files,
  onDeleteFile,
  onUpload,
  title,
  fileType,
  iconSrc,
  multiple,
}) => {
  return (
    <div className="w-full bg-white flex flex-col gap-4 p-5 rounded-xl">
      <span className="text-base text-neutral-600">{title}</span>
      <div className="flex flex-wrap items-center gap-2.5 py-4 px-6 border border-dashed border-blue-600 rounded-xl">
        {files.map((file, index) => (
          <FileItem
            key={file.preview}
            file={file.file}
            onDelete={onDeleteFile}
            iconSrc={iconSrc}
            index={index}
            fileType={fileType}
          />
        ))}
        <UploadButton
          onUpload={onUpload}
          fileType={fileType}
          multiple={multiple}
        />
      </div>
    </div>
  );
};

export default FileList;
