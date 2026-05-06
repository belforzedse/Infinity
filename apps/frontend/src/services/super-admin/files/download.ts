import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
// removed unused import: ApiResponse from "@/types/api"
import { toast } from "react-hot-toast";

interface FileFormat {
  ext: string;
  url: string;
  hash: string;
  mime: string;
  name: string;
  path: null | string;
  size: number;
  width: number;
  height: number;
  sizeInBytes: number;
}

interface FileFormats {
  thumbnail: FileFormat;
}

interface FileResponse {
  id: number;
  name: string;
  alternativeText: null | string;
  caption: null | string;
  width: number;
  height: number;
  formats: FileFormats;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: null | string;
  provider: string;
  provider_metadata: null | any;
  createdAt: string;
  updatedAt: string;
}

export const Download = async (id: string): Promise<FileResponse> => {
  try {
    const endpoint = `${ENDPOINTS.FILE.DOWNLOAD}/${id}`;

    const response = await apiClient.get<FileResponse>(endpoint);
    return response.data;
  } catch (error: any) {
    console.error("Error downloading file:", error);
    toast.error("خطا در دریافت فایل. لطفا دوباره تلاش کنید.");
    throw error;
  }
};
