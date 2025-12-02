import React from "react";
import type { FileListProps } from "./types";
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
    <div className="flex w-full flex-col gap-4 rounded-xl bg-white p-5">
      <span className="text-base text-neutral-600">{title}</span>
      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-dashed border-blue-600 px-6 py-4">
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
        <UploadButton onUpload={onUpload} fileType={fileType} multiple={multiple} />
      </div>
    </div>
  );
};

export default FileList;
