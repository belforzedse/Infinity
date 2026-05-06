import { API_BASE_URL, IMAGE_BASE_URL } from "@/constants/api";

/**
 * Resolve a Strapi asset path (e.g. "/uploads/…") to an absolute URL.
 * Falls back to the API origin when IMAGE_BASE_URL is not configured.
 */
export const resolveAssetUrl = (path?: string | null): string => {
  if (!path) return "";
  if (/^(?:https?:)?\/\//i.test(path) || path.startsWith("data:")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Local public assets - served by Next.js, stay on frontend origin
  if (path.startsWith("/images/") || path.startsWith("/blog/")) {
    return normalizedPath;
  }

  const imageBase = (IMAGE_BASE_URL || "").replace(/\/$/, "");
  const apiBase = (API_BASE_URL || "").replace(/\/$/, "").replace(/\/api$/, "");

  if (imageBase) return `${imageBase}${normalizedPath}`;
  if (apiBase) return `${apiBase}${normalizedPath}`;
  return normalizedPath;
};

export default resolveAssetUrl;
