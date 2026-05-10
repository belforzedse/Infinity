import { IMAGE_BASE_URL } from "@repo/api/config";

export function buildStoryMediaUrl(url: string): string {
  if (url.startsWith("http")) return url;
  const base = (IMAGE_BASE_URL || "").replace(/\/+$/, "");
  const path = url.replace(/^\/+/, "");
  if (!base) return `/${path}`;
  return `${base}/${path}`;
}
