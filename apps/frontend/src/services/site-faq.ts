import { API_BASE_URL, getStrapiServerUrl, STRAPI_TOKEN } from "@/constants/api";
import type { SiteFaq, SiteFaqCategory, SiteFaqItem } from "@/types/site-identity";

/**
 * Server-side fetcher for the `site-faq` single type.
 * Tagged with `faq` for on-demand revalidation; safe empty default on error.
 */

export const SITE_FAQ_TAG = "faq";

export const DEFAULT_SITE_FAQ: SiteFaq = { categories: [] };

const POPULATE_QUERY = "populate[categories][populate]=items";

function toItems(raw: any): SiteFaqItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((i) => i && i.question)
    .map((i) => ({
      question: i.question,
      answer: i.answer ?? "",
      order: typeof i.order === "number" ? i.order : 0,
      isActive: i.isActive !== false,
    }))
    .filter((i) => i.isActive)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function normalizeSiteFaq(attributes: any): SiteFaq {
  if (!attributes || !Array.isArray(attributes.categories)) return DEFAULT_SITE_FAQ;
  const categories: SiteFaqCategory[] = attributes.categories
    .filter((c: any) => c && c.title)
    .map((c: any) => ({
      title: c.title,
      description: c.description ?? undefined,
      order: typeof c.order === "number" ? c.order : 0,
      items: toItems(c.items),
    }))
    .sort((a: SiteFaqCategory, b: SiteFaqCategory) => (a.order ?? 0) - (b.order ?? 0));
  return { categories };
}

export async function getSiteFaq(): Promise<SiteFaq> {
  try {
    const baseUrl = typeof window === "undefined" ? getStrapiServerUrl() : API_BASE_URL;
    const response = await fetch(`${baseUrl}/site-faq?${POPULATE_QUERY}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
      },
      next: { tags: [SITE_FAQ_TAG], revalidate: 3600 },
    });

    if (response.status === 404) return DEFAULT_SITE_FAQ;
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const result = await response.json();
    return normalizeSiteFaq(result?.data?.attributes);
  } catch (error) {
    console.warn("Site FAQ unavailable, using defaults:", error);
    return DEFAULT_SITE_FAQ;
  }
}
