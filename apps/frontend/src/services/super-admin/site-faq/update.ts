import { apiClient } from "@/services";
import type { SiteFaq } from "@/types/site-identity";

const POPULATE = "populate[categories][populate]=items";

export async function updateSuperAdminSiteFaq(faq: SiteFaq): Promise<SiteFaq> {
  const data = {
    categories: (faq.categories ?? [])
      .filter((c) => c.title?.trim())
      .map((c, ci) => ({
        title: c.title.trim(),
        description: c.description?.trim() || null,
        order: typeof c.order === "number" ? c.order : ci,
        items: (c.items ?? [])
          .filter((i) => i.question?.trim())
          .map((i, ii) => ({
            question: i.question.trim(),
            answer: i.answer ?? "",
            order: typeof i.order === "number" ? i.order : ii,
            isActive: i.isActive !== false,
          })),
      })),
  };

  await apiClient.put(`/site-faq?${POPULATE}`, { data });

  // Return the validated/normalized input shape (description null -> undefined).
  return {
    categories: data.categories.map((c) => ({
      title: c.title,
      description: c.description ?? undefined,
      order: c.order,
      items: c.items,
    })),
  };
}
