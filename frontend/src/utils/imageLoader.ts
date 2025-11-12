import type { ImageLoaderProps } from "next/image";

export default function imageLoader({ src, width, quality = 75 }: ImageLoaderProps) {
  // Skip data URLs and empty sources
  if (!src || src.startsWith("data:")) return src;

  try {
    // Parse against BASE_URL to support relative paths like "/uploads/..."
    const envBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "";
    const base = envBaseUrl || "http://localhost"; // safe SSR fallback
    const url = new URL(src, base);

    // For Strapi uploads, don't add query parameters - Strapi handles optimization internally
    // and returns pre-optimized formats
    if (!url.pathname.includes("/uploads/")) {
      // For non-Strapi URLs, add Next.js optimization parameters
      url.searchParams.set("w", String(width));
      url.searchParams.set("q", String(quality));
      url.searchParams.set("f", "webp");
    }

    return url.toString();
  } catch {
    // Fallback: return src as-is
    return src;
  }
}
