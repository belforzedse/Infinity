import type { ImageLoaderProps } from "next/image";

export default function imageLoader({ src, width, quality = 75 }: ImageLoaderProps) {
  // Skip data URLs and empty sources
  if (!src || src.startsWith("data:")) return src;

  // Ensure width is a valid number (required by Next.js)
  const validWidth = width && width > 0 ? width : 1920; // Default to a large size if width is invalid
  const applyParams = (url: URL) => {
    // Next.js requires custom loaders to account for width.
    url.searchParams.set("w", String(validWidth));
    url.searchParams.set("q", String(quality));
    // Prefer AVIF, fallback to WebP
    url.searchParams.set("f", "avif");
    return url.toString();
  };

  // 1) Strapi uploads: `/uploads/...` => use Strapi base, no extra params
  const envBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL?.trim();
  const strapiBase = envBaseUrl || "http://localhost:1337";

  if (src.startsWith("/uploads/")) {
    try {
      const url = new URL(src, strapiBase);
      return applyParams(url);
    } catch {
      return src;
    }
  }

  // 2) Public assets: `/images/...`, `/blog/...`, etc. => stay on frontend domain
  if (src.startsWith("/")) {
    try {
      const url = new URL(src, "http://localhost");
      return `${url.pathname}${url.search ? `${url.search}&` : "?"}w=${validWidth}&q=${quality}&f=avif`;
    } catch {
      return src;
    }
  }

  // 3) Absolute external URLs: `https://...`
  if (/^https?:\/\//i.test(src)) {
    try {
      const url = new URL(src);
      return applyParams(url);
    } catch {
      return src;
    }
  }

  // 4) Fallback: treat as relative to Strapi (rare)
  try {
    const url = new URL(src, strapiBase);
    return applyParams(url);
  } catch {
    return src;
  }
}
