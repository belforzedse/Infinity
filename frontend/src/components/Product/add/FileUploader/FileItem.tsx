import React from "react";
import Image from "next/image";
import DeleteIcon from "@/components/Kits/Icons/DeleteIcon";
import { FileItemProps } from "./types";

const FileItem: React.FC<FileItemProps> = ({
  file,
  onDelete,
  iconSrc,
  index,
  fileType,
}) => (
  <div className="flex items-center gap-4 bg-blue-700 text-white px-3 py-2.5 rounded-lg">
    <div className="flex items-center text-[10px] h-full">
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
      <DeleteIcon className="w-5 h-5" />
    </button>
  </div>
);

export default FileItem;
