import { API_BASE_URL, ENDPOINTS } from "@/constants/api";
import toast from "react-hot-toast";
import { getAccessToken } from "@/utils/auth";

export type ImageFormat = {
  ext: string;
  url: string;
  hash: string;
  mime: string;
  name: string;
  path: null;
  size: number;
  width: number;
  height: number;
  sizeInBytes: number;
};

export type UploadedImage = {
  id: number;
  name: string;
  alternativeText: null;
  caption: null;
  width: number;
  height: number;
  formats: {
    large: ImageFormat;
    small: ImageFormat;
    medium: ImageFormat;
    thumbnail: ImageFormat;
  };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: null;
  provider: string;
  provider_metadata: null;
  createdAt: string;
  updatedAt: string;
};

export type Response = UploadedImage[];

export const uploadFile = async (file: File): Promise<Response | undefined> => {
  const endpoint = ENDPOINTS.FILE.UPLOAD;

  try {
    const formData = new FormData();
    formData.append("files", file);

    const token = getAccessToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    const data = await response.json();
    const files = Array.isArray(data) ? data : data?.data;

    if (!files || !Array.isArray(files)) {
      throw new Error("Invalid upload response");
    }

    return files as Response;
  } catch (err) {
    console.error("Upload failed", err);
    toast.error("خطا در آپلود تصویر");
  }
};
