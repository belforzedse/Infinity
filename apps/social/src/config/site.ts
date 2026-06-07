export const SITE_URL = "https://infinitygram.co";
export const SITE_NAME = "اینفینیتی گرام";

function resolveStorefrontUrl(raw: string | undefined): string {
  const fallback = "https://new.infinitycolor.co";
  if (!raw) return fallback;
  try {
    const url = new URL(raw);
    return url.origin !== "null" ? raw : fallback;
  } catch {
    return fallback;
  }
}

/** URL of the Infinity Store storefront. Configurable via NEXT_PUBLIC_STOREFRONT_URL. */
export const STOREFRONT_URL = resolveStorefrontUrl(
  process.env.NEXT_PUBLIC_STOREFRONT_URL,
);
