import React from "react";
import classNames from "classnames";
import PlusIcon from "@/components/User/Icons/PlusIcon";
import { useUpload } from "@/hooks/product/useUpload";
import { FileType } from "./FileUploader/types";

interface UploadButtonProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  fileType?: FileType;
  multiple?: boolean;
}

const UploadButton: React.FC<UploadButtonProps> = ({
  onUpload,
  className,
  fileType = "image",
  multiple = true,
}) => {
  const { uploadingState } = useUpload();
  const isLoading = uploadingState[fileType];

  return (
    <label
      className={classNames(
        "flex items-center px-3 py-2 bg-blue-50 border border-blue-600 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-200 transition-colors min-w-32 justify-between",
        isLoading && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )}
    >
      <span className="text-sm">
        {isLoading ? "در حال آپلود..." : "اضافه کردن"}
      </span>
      <PlusIcon
        className={classNames("w-4 h-4", isLoading && "animate-spin")}
      />
      <input
        type="file"
        multiple={multiple}
        onChange={(e) => onUpload(e)}
        className="hidden"
        disabled={isLoading}
      />
    </label>
  );
};

export default UploadButton;
