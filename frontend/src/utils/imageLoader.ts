import type { ImageLoaderProps } from "next/image";

const BASE_URL =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "https://api.infinity.rgbgroup.ir";

export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
  try {
    const parsed = new URL(src);
    if (parsed.hostname === "uploads") {
      const params = [`w=${width}`];
      if (quality) params.push(`q=${quality}`);
      return `${BASE_URL}${parsed.pathname}?${params.join("&")}`;
    }
  } catch {
    // Invalid URL or relative path - return as is
  }

  return src;
}
