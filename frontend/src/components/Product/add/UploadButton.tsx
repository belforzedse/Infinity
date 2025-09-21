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
        "flex min-w-32 cursor-pointer items-center justify-between rounded-lg border border-blue-600 bg-blue-50 px-3 py-2 text-blue-600 transition-colors hover:bg-blue-200",
        isLoading && "pointer-events-none cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span className="text-sm">{isLoading ? "در حال آپلود..." : "اضافه کردن"}</span>
      <PlusIcon className={classNames("h-4 w-4", isLoading && "animate-spin")} />
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
