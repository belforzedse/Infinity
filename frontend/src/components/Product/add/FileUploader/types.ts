import type { FileWithPreview } from "@/hooks/product/useUpload";

export type FileType = "image" | "video" | "other";

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: FileType;
}

export interface FileItemProps {
  file: File;
  onDelete: (index: number, type: FileType) => void;
  iconSrc?: string;
  index: number;
  fileType: FileType;
}

export interface FileListProps {
  files: FileWithPreview[];
  onDeleteFile: (index: number, type: FileType) => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  title: string;
  fileType: FileType;
  iconSrc?: string;
  multiple?: boolean;
  isLoading?: boolean;
}
