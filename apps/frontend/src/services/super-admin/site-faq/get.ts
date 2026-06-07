import { apiClient } from "@/services";
import type { SiteFaq, SiteFaqCategory, SiteFaqItem } from "@/types/site-identity";

const POPULATE = "populate[categories][populate]=items";

function statusOf(error: unknown): number | undefined {
  if (error && typeof error === "object") {
    if (
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response
    ) {
      return (error.response as { status: number }).status;
    }
    if ("status" in error) return (error as { status: number }).status;
  }
  return undefined;
}

/** Admin normalizer: keeps inactive items and original ordering for editing. */
function normalizeForAdmin(attributes: any): SiteFaq {
  if (!attributes || !Array.isArray(attributes.categories)) return { categories: [] };
  const categories: SiteFaqCategory[] = attributes.categories.map((c: any) => ({
    title: c?.title ?? "",
    description: c?.description ?? undefined,
    order: typeof c?.order === "number" ? c.order : 0,
    items: Array.isArray(c?.items)
      ? c.items.map(
          (i: any): SiteFaqItem => ({
            question: i?.question ?? "",
            answer: i?.answer ?? "",
            order: typeof i?.order === "number" ? i.order : 0,
            isActive: i?.isActive !== false,
          }),
        )
      : [],
  }));
  return { categories };
}

export async function getSuperAdminSiteFaq(): Promise<SiteFaq> {
  try {
    const res = await apiClient.get(`/site-faq?${POPULATE}`, { cache: "no-store" });
    const attributes = (res as { data?: { attributes?: unknown } })?.data?.attributes;
    return attributes ? normalizeForAdmin(attributes) : { categories: [] };
  } catch (error: unknown) {
    if (statusOf(error) === 404) return { categories: [] };
    throw error;
  }
}
