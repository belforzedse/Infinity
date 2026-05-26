import React from "react";
import Image from "next/image";
import DeleteIcon from "@/components/Kits/Icons/DeleteIcon";
import type { FileItemProps } from "./types";
import UploadStatusBadge from "@/components/Product/add/UploadStatusBadge";
import { RefreshCcw } from "lucide-react";

const FileItem: React.FC<FileItemProps> = ({ file, onDelete, onRetry, iconSrc, index, fileType }) => (
  <div className="flex items-center gap-3 rounded-lg bg-blue-700 px-3 py-2.5 text-white">
    <div className="flex h-full items-center gap-2 text-[10px]">
      <span className="max-w-44 truncate">{file.file.name}</span>
      <Image
        src={iconSrc || "/images/file-icon.png"}
        alt={file.file.name}
        width={24}
        height={24}
        className="rounded-full"
      />
      <UploadStatusBadge status={file.uploadStatus} className="shadow-none" />
    </div>
    {file.uploadStatus === "failed" && onRetry ? (
      <button
        type="button"
        onClick={() => onRetry(index, fileType)}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
        title="تلاش مجدد"
      >
        <RefreshCcw className="h-4 w-4" />
      </button>
    ) : null}
    <button onClick={() => onDelete(index, fileType)} className="text-white">
      <DeleteIcon className="h-5 w-5" />
    </button>
  </div>
);

export default FileItem;
