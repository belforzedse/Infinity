import { API_BASE_URL, ENDPOINTS } from "@/constants/api";
import imageCompression from "browser-image-compression";
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

const MAX_DIMENSION = 2560;
const HERO_MAX_DIMENSION = 2720;
const LARGE_FILE_THRESHOLD = 8 * 1024 * 1024;

export type UploadFileOptions = {
  highQuality?: boolean;
};

async function compressImageToWebP(file: File, options?: UploadFileOptions): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const highQuality = options?.highQuality === true;
  if (highQuality && file.size <= 20 * 1024 * 1024) {
    return file;
  }

  if (!highQuality && file.size < LARGE_FILE_THRESHOLD && file.type === "image/webp") {
    return file;
  }

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: highQuality ? 30 : 20,
      maxWidthOrHeight: highQuality ? HERO_MAX_DIMENSION : MAX_DIMENSION,
      fileType: "image/webp",
      initialQuality: highQuality ? 0.95 : 0.82,
      useWebWorker: true,
    });

    const filename = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([compressed], filename, { type: "image/webp", lastModified: Date.now() });
  } catch (e) {
    console.warn("Image compression failed, sending original", e);
    return file;
  }
}

export const uploadFile = async (
  file: File,
  options?: UploadFileOptions,
): Promise<Response | undefined> => {
  const endpoint = ENDPOINTS.FILE.UPLOAD;

  try {
    const formData = new FormData();
    const processed = await compressImageToWebP(file, options);
    formData.append("files", processed);

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
