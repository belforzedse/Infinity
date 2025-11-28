import type { ImageLoaderProps } from "next/image";

export default function imageLoader({ src, width, quality = 75 }: ImageLoaderProps) {
  // Skip data URLs and empty sources
  if (!src || src.startsWith("data:")) return src;

  // 1) Strapi uploads: `/uploads/...` => use Strapi base, no extra params
  const envBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL?.trim();
  const strapiBase = envBaseUrl || "http://localhost:1337";

  if (src.startsWith("/uploads/")) {
    try {
      const url = new URL(src, strapiBase);
      // Strapi already handles formats/sizes, so no `w` / `q` params here
      return url.toString();
    } catch {
      return src;
    }
  }

  // 2) Public assets: `/images/...`, `/blog/...`, etc. => stay on frontend domain
  if (src.startsWith("/")) {
    const params = new URLSearchParams();
    params.set("w", String(width));
    params.set("q", String(quality));
    params.set("f", "webp");

    // This path will be resolved by the frontend origin (Next.js server)
    return `${src}?${params.toString()}`;
  }

  // 3) Absolute external URLs: `https://...`
  if (/^https?:\/\//i.test(src)) {
    try {
      const url = new URL(src);

      // If it's NOT a Strapi upload path, we can add params
      if (!url.pathname.includes("/uploads/")) {
        url.searchParams.set("w", String(width));
        url.searchParams.set("q", String(quality));
        url.searchParams.set("f", "webp");
      }

      return url.toString();
    } catch {
      return src;
    }
  }

  // 4) Fallback: treat as relative to Strapi (rare)
  try {
    const url = new URL(src, strapiBase);
    if (!url.pathname.includes("/uploads/")) {
      url.searchParams.set("w", String(width));
      url.searchParams.set("q", String(quality));
      url.searchParams.set("f", "webp");
    }
    return url.toString();
  } catch {
    return src;
  }
}
