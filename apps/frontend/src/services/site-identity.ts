import { API_BASE_URL, getStrapiServerUrl, STRAPI_TOKEN } from "@/constants/api";
import type {
  IdentityContactNumber,
  IdentityPhone,
  IdentitySocialLink,
  IdentityStore,
  SiteIdentity,
} from "@/types/site-identity";

/**
 * Server-side fetcher for the `site-identity` single type.
 *
 * - Server Component friendly: tagged with `site-identity` for on-demand
 *   revalidation, with an ISR fallback window.
 * - Precise populate (no `populate=deep`).
 * - Returns safe defaults on 404/error so public pages never break.
 */

export const SITE_IDENTITY_TAG = "site-identity";

/**
 * Fallback identity mirrors the values the site used before this was CMS-driven
 * (see constants/footer.ts, config/site.ts and components/SEO/OrganizationSchema.tsx).
 * Used only when the database record is missing/unavailable.
 */
export const DEFAULT_SITE_IDENTITY: SiteIdentity = {
  siteName: "فروشگاه پوشاک اینفینیتی",
  brandDescription:
    "پوشاک اینفینیتی با عرضه پوشاک با بهترین قیمت و کیفیت همیشه سعی کرده است تا بهترین ها را برای شما به ارمغان بیاورد!",
  supportHours:
    "شنبه تا پنج شنبه (غیر از روزهای تعطیل) از ساعت9 صبح الی 17 پاسخگوی شما هستیم.",
  hasPhysicalStores: true,
  hasMultipleStores: true,
  stores: [
    {
      name: "گرگان",
      address: "گلستان، گرگان، بلوار ناهارخوران، نبش عدالت ۶۸، کد پستی ۴۹۱۶۹۷۳۳۸۱",
      phones: [{ label: "تلفن فروشگاه", number: "017-325-304-39" }],
      showInFooter: true,
      showInAbout: true,
      socialLinks: [],
    },
    {
      name: "گنبد کاووس",
      address: "گنبد کاووس، ابتدای بلوار دانشجو",
      phones: [],
      showInFooter: true,
      showInAbout: true,
      socialLinks: [],
    },
  ],
  socialLinks: [
    {
      platform: "instagram",
      url: "https://www.instagram.com/infinity.color_boutique/",
      label: "infinity.color_boutique",
    },
    { platform: "telegram", url: "https://t.me/InfinityColorShop", label: "InfinityColorShop" },
  ],
  contactNumbers: [
    { label: "تلفن", number: "017-325-304-39", type: "phone" },
    { label: "واتساپ", number: "0901-655-25-30", type: "whatsapp" },
  ],
};

/** Code fallback when the database site name is missing or empty. */
export const DEFAULT_SITE_NAME = DEFAULT_SITE_IDENTITY.siteName;

export function resolveSiteName(name?: string | null): string {
  return name?.trim() || DEFAULT_SITE_NAME;
}

export function blogMagTitle(siteName?: string | null): string {
  return `${resolveSiteName(siteName)} مگ`;
}

const POPULATE_QUERY =
  "populate[stores][populate]=phones,socialLinks&populate[socialLinks]=true&populate[contactNumbers]=true";

function toSocialLinks(raw: any): IdentitySocialLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && s.platform && s.url)
    .map((s) => ({ platform: s.platform, url: s.url, label: s.label ?? undefined }));
}

function toPhones(raw: any): IdentityPhone[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p) => p && p.number)
    .map((p) => ({ label: p.label ?? undefined, number: p.number }));
}

function toContactNumbers(raw: any): IdentityContactNumber[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c) => c && c.number)
    .map((c) => ({ label: c.label ?? undefined, number: c.number, type: c.type ?? undefined }));
}

function toStores(raw: any): IdentityStore[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => ({
    name: s.name ?? undefined,
    address: s.address ?? undefined,
    phones: toPhones(s.phones),
    wazeLink: s.wazeLink ?? undefined,
    neshanLink: s.neshanLink ?? undefined,
    baladLink: s.baladLink ?? undefined,
    googleMapsLink: s.googleMapsLink ?? undefined,
    showInFooter: s.showInFooter !== false,
    showInAbout: Boolean(s.showInAbout),
    socialLinks: toSocialLinks(s.socialLinks),
  }));
}

export function normalizeSiteIdentity(attributes: any): SiteIdentity {
  if (!attributes) return DEFAULT_SITE_IDENTITY;
  return {
    siteName: resolveSiteName(attributes.siteName),
    brandDescription: attributes.brandDescription ?? undefined,
    contactEmail: attributes.contactEmail ?? undefined,
    supportHours: attributes.supportHours ?? undefined,
    hasPhysicalStores: attributes.hasPhysicalStores !== false,
    hasMultipleStores: Boolean(attributes.hasMultipleStores),
    stores: toStores(attributes.stores),
    socialLinks: toSocialLinks(attributes.socialLinks),
    contactNumbers: toContactNumbers(attributes.contactNumbers),
  };
}

export async function getSiteIdentity(): Promise<SiteIdentity> {
  try {
    const baseUrl = typeof window === "undefined" ? getStrapiServerUrl() : API_BASE_URL;
    const response = await fetch(`${baseUrl}/site-identity?${POPULATE_QUERY}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
      },
      next: { tags: [SITE_IDENTITY_TAG], revalidate: 3600 },
    });

    if (response.status === 404) return DEFAULT_SITE_IDENTITY;
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const result = await response.json();
    return normalizeSiteIdentity(result?.data?.attributes);
  } catch (error) {
    console.warn("Site identity unavailable, using defaults:", error);
    return DEFAULT_SITE_IDENTITY;
  }
}
