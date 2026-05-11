/**
 * Multipart upload service for `POST /upload` (Strapi default media endpoint).
 *
 * Ported from the storefront `apps/frontend/src/services/super-admin/files/upload.ts`
 * pattern, but uses `fetch` against `API_BASE_URL` (the shared `apiClient` is JSON-only
 * and serialises bodies — it would corrupt `FormData`). Auth is the same Bearer
 * scheme used elsewhere in the social app (`localStorage.accessToken`).
 *
 * Image files are run through `browser-image-compression` first (matches storefront)
 * to convert to WebP and clamp dimensions; videos / non-images pass through untouched.
 */

import imageCompression from "browser-image-compression";
import { API_BASE_URL } from "@repo/api";
import { ENDPOINTS } from "@/lib/api-endpoints";

export type StrapiImageFormat = {
  ext: string;
  url: string;
  hash: string;
  mime: string;
  name: string;
  path: string | null;
  size: number;
  width: number;
  height: number;
  sizeInBytes: number;
};

export type StrapiUploadedFile = {
  id: number;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  formats: {
    large?: StrapiImageFormat;
    medium?: StrapiImageFormat;
    small?: StrapiImageFormat;
    thumbnail?: StrapiImageFormat;
  } | null;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  provider_metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

const MAX_DIMENSION = 2560;
const LARGE_FILE_THRESHOLD = 8 * 1024 * 1024;

/**
 * Hard client-side cap for video uploads. The Strapi `upload` plugin is
 * configured with `sizeLimit: 0` (no enforced limit), but huge files still
 * choke the user's network and the platform's request-body parser, so we
 * bounce them in the browser with a Persian-friendly toast.
 */
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

/**
 * MIME-type prefix check. We rely on the browser-reported type because
 * extensions are unreliable (renamed files, mobile pickers, etc.) and
 * Strapi's allowedTypes rules match against MIME classifications too.
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/");
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("accessToken");
  } catch {
    return null;
  }
}

async function compressImageToWebP(file: File): Promise<File> {
  if (!isImageFile(file)) return file;
  if (file.size < LARGE_FILE_THRESHOLD && file.type === "image/webp") return file;

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 20,
      maxWidthOrHeight: MAX_DIMENSION,
      fileType: "image/webp",
      initialQuality: 0.82,
      useWebWorker: true,
    });

    const filename = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([compressed], filename, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn("Image compression failed, sending original file", error);
    return file;
  }
}

/**
 * Upload a single file to Strapi. Resolves with the uploaded file record(s)
 * Strapi returns (always an array; we keep the original shape so callers
 * can pick `[0]` for single uploads or spread for multi).
 *
 * Throws on transport or server failures so the caller (component / hook)
 * can surface a domain-appropriate toast.
 */
export async function uploadFile(file: File): Promise<StrapiUploadedFile[]> {
  const processed = await compressImageToWebP(file);
  const formData = new FormData();
  formData.append("files", processed);

  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.FILE.UPLOAD}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  const json: unknown = await response.json();
  const list = Array.isArray(json)
    ? json
    : (json as { data?: unknown })?.data;

  if (!Array.isArray(list)) {
    throw new Error("ساختار پاسخ آپلود نامعتبر است.");
  }

  return list as StrapiUploadedFile[];
}

/**
 * Upload many files in parallel and return their ids in the *same order* as the
 * input array (useful when the caller cares about gallery sort order).
 */
export async function uploadFiles(files: readonly File[]): Promise<number[]> {
  const uploaded = await Promise.all(files.map((f) => uploadFile(f)));
  return uploaded.map((records, idx) => {
    const first = records[0];
    if (!first) throw new Error(`فایل شماره ${idx + 1} آپلود نشد.`);
    return first.id;
  });
}

export const UploadService = {
  uploadFile,
  uploadFiles,
};
