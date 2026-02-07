import { API_BASE_URL, ENDPOINTS } from "@/constants/api";
import logger from "@/utils/logger";
import { resolveAssetUrl } from "@/utils/resolveAssetUrl";

export interface CategoryImageFormats {
  thumbnail?: { url?: string; width?: number; height?: number };
  small?: { url?: string; width?: number; height?: number };
  medium?: { url?: string; width?: number; height?: number };
  large?: { url?: string; width?: number; height?: number };
}

export interface CategoryImageAttributes {
  url?: string;
  alternativeText?: string | null;
  width?: number | null;
  height?: number | null;
  formats?: CategoryImageFormats | null;
}

export interface CategoryImageField {
  data?: {
    attributes?: CategoryImageAttributes;
  } | null;
}

interface CategoryRelation {
  data?: { id: number } | null;
}

interface RawProductCategory {
  id: number;
  attributes?: {
    Title?: string;
    Slug?: string;
    Color?: string | null;
    Image?: CategoryImageField | null;
    parent?: CategoryRelation | null;
  };
  Title?: string;
  Slug?: string;
  Color?: string | null;
  Image?: CategoryImageField | null;
  parent?: CategoryRelation | null;
}

export interface ProductCategorySummary {
  id: number;
  name: string;
  slug: string;
  color: string | null;
  imageUrl: string | null;
  imageAlt: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
  parentId: number | null;
}

export interface FetchProductCategoriesOptions {
  parentOnly?: boolean;
  limit?: number;
  sort?: string;
  cache?: RequestCache;
  revalidate?: number;
}

const resolveCategoryImage = (image?: CategoryImageField | null) => {
  const attrs = image?.data?.attributes;
  if (!attrs) {
    return { url: null, alt: "", width: null, height: null };
  }

  const formats = attrs.formats || undefined;
  const url =
    formats?.medium?.url ||
    formats?.large?.url ||
    formats?.small?.url ||
    formats?.thumbnail?.url ||
    attrs.url ||
    "";

  return {
    url: url ? resolveAssetUrl(url) : null,
    alt: attrs.alternativeText || "",
    width: attrs.width ?? null,
    height: attrs.height ?? null,
  };
};

const normalizeHexColor = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) return trimmed;
  if (/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) return `#${trimmed}`;
  return trimmed;
};

export async function getProductCategories(
  options: FetchProductCategoriesOptions = {},
): Promise<ProductCategorySummary[]> {
  const params = new URLSearchParams();
  params.set("pagination[limit]", String(options.limit ?? -1));
  params.set("sort", options.sort || "Title:asc");
  params.append("fields[0]", "Title");
  params.append("fields[1]", "Slug");
  params.append("fields[2]", "Color");
  params.append("populate[0]", "Image");
  params.append("populate[1]", "parent");

  if (options.parentOnly) {
    params.append("filters[parent][id][$null]", "true");
  }

  const url = `${API_BASE_URL}${ENDPOINTS.PRODUCT.CATEGORY}?${params.toString()}`;

  const requestInit: RequestInit & { next?: { revalidate: number } } = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: options.cache ?? "no-store",
  };

  if (typeof window === "undefined" && typeof options.revalidate === "number") {
    requestInit.next = { revalidate: options.revalidate };
  }

  try {
    if (typeof window === "undefined") {
      logger.info("[ProductCategories] Fetching categories", {
        url: url.replace(API_BASE_URL, "[BASE_URL]"),
        parentOnly: !!options.parentOnly,
      });
    }

    const response = await fetch(url, requestInit);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      if (typeof window === "undefined") {
        logger.error("[ProductCategories] Failed to fetch categories", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
      }
      return [];
    }

    const json = await response.json();
    const items: RawProductCategory[] = Array.isArray(json?.data) ? json.data : [];

    const mapped = items
      .map((item) => {
        const attrs = item.attributes || item;
        const name = attrs.Title || attrs.Slug || String(item.id);
        const slug = attrs.Slug || String(item.id);
        const color = normalizeHexColor(attrs.Color);
        const parentId = attrs.parent?.data?.id ?? null;
        const image = resolveCategoryImage(attrs.Image);

        return {
          id: item.id,
          name,
          slug,
          color,
          imageUrl: image.url,
          imageAlt: image.alt || name,
          imageWidth: image.width,
          imageHeight: image.height,
          parentId,
        } as ProductCategorySummary;
      })
      .filter((item) => item.slug);

    if (options.parentOnly) {
      return mapped.filter((item) => !item.parentId);
    }

    return mapped;
  } catch (error) {
    if (typeof window === "undefined") {
      logger.error("[ProductCategories] Unexpected error fetching categories", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return [];
  }
}
