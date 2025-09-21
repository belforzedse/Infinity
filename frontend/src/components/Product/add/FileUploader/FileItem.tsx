import React from "react";
import Image from "next/image";
import DeleteIcon from "@/components/Kits/Icons/DeleteIcon";
import type { FileItemProps } from "./types";

const FileItem: React.FC<FileItemProps> = ({ file, onDelete, iconSrc, index, fileType }) => (
  <div className="flex items-center gap-4 rounded-lg bg-blue-700 px-3 py-2.5 text-white">
    <div className="flex h-full items-center text-[10px]">
      <span className="flex items-center gap-2">{file.name}</span>
      <Image
        src={iconSrc || "/images/file-icon.png"}
        alt={file.name}
        width={24}
        height={24}
        className="rounded-full"
      />
    </div>
    <button onClick={() => onDelete(index, fileType)} className="text-white">
      <DeleteIcon className="h-5 w-5" />
    </button>
  </div>
);

export default FileItem;
