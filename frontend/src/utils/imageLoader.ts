import type { ImageLoaderProps } from "next/image";

export default function imageLoader({ src, width, quality = 75 }: ImageLoaderProps) {
  // Skip data URLs and empty sources
  if (!src || src.startsWith("data:")) return src;

  try {
    // Parse against BASE_URL to support relative paths like "/uploads/..."
    const envBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "";
    const base = envBaseUrl || "http://localhost"; // safe SSR fallback
    const url = new URL(src, base);

    // Always include width so Next doesn't warn in dev
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality));

    // Add format parameter for modern image formats
    url.searchParams.set("f", "webp");

    return url.toString();
  } catch {
    // Fallback: append params directly
    const joiner = src.includes("?") ? "&" : "?";
    return `${src}${joiner}w=${width}&q=${quality}&f=webp`;
  }
}
