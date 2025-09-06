import type { ImageLoaderProps } from "next/image";

const BASE_URL =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "https://api.infinity.rgbgroup.ir";

export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
  let url = src;

  try {
    const parsed = new URL(src);
    if (parsed.hostname === "uploads") {
      url = `${BASE_URL}${parsed.pathname}`;
    }
  } catch {
    if (src.startsWith("/")) {
      url = `${BASE_URL}${src}`;
    } else {
      url = `${BASE_URL}/${src}`;
    }
  }

  const params = [`w=${width}`];
  if (quality) params.push(`q=${quality}`);
  return `${url}?${params.join("&")}`;
}
