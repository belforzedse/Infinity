import type { ImageLoaderProps } from "next/image";

const BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "";

export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
  // Skip data URLs
  if (src.startsWith("data:")) return src;

  try {
    // Parse against BASE_URL to support relative paths like "/uploads/..."
    const base = BASE_URL || "http://localhost"; // safe SSR fallback
    const url = new URL(src, base);
    // Always include width so Next doesn't warn in dev
    url.searchParams.set("w", String(width));
    if (quality) url.searchParams.set("q", String(quality));
    return url.toString();
  } catch {
    // Fallback: append params directly
    const joiner = src.includes("?") ? "&" : "?";
    return `${src}${joiner}w=${width}${quality ? `&q=${quality}` : ""}`;
  }
}
