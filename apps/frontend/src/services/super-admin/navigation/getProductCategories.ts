import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";

export interface ProductCategory {
  id: number;
  title: string;
  slug: string;
}

type RawCategory = {
  id: number;
  attributes?: {
    Title?: string | null;
    Slug?: string | null;
  };
  Title?: string | null;
  Slug?: string | null;
};

type CategoriesResponse = {
  data?: RawCategory[];
  meta?: {
    pagination?: {
      page?: number;
      pageCount?: number;
    };
  };
};
type CategoriesPayload = CategoriesResponse | RawCategory[];

const PAGE_SIZE = 100;

function normalizeCategory(category: RawCategory): ProductCategory {
  const attrs = category.attributes || category;
  const title = attrs.Title?.trim() || attrs.Slug?.trim() || String(category.id);
  const slug = attrs.Slug?.trim() || String(category.id);

  return {
    id: category.id,
    title,
    slug,
  };
}

function uniqueById(categories: ProductCategory[]) {
  const byId = new Map<number, ProductCategory>();

  categories.forEach((category) => {
    if (!byId.has(category.id)) {
      byId.set(category.id, category);
    }
  });

  return Array.from(byId.values());
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  const categories: ProductCategory[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const response = await apiClient.get<CategoriesPayload>(ENDPOINTS.PRODUCT.CATEGORY, {
      params: {
        "pagination[page]": page,
        "pagination[pageSize]": PAGE_SIZE,
        sort: "Title:asc",
        "fields[0]": "Title",
        "fields[1]": "Slug",
      },
      cache: "no-store",
    });

    const payload = response.data;
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    categories.push(...items.map(normalizeCategory).filter((category) => category.slug));
    pageCount = Array.isArray(payload) ? page : payload?.meta?.pagination?.pageCount || pageCount;
    page += 1;
  } while (page <= pageCount);

  return uniqueById(categories);
}
