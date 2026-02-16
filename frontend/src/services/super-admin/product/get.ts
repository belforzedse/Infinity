import { apiClient } from "@/services";
import { ENDPOINTS, IMAGE_BASE_URL } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import { paramCreator } from "@/utils/paramCreator";
import type { TagAttributes } from "./tag/get";

type PopulateObject = {
  [key: string]: boolean | PopulateObject;
};

interface Item {
  id: number;
  attributes: ProductDataResponse;
}

export interface MediaAttributes {
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  formats: any | null;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  provider_metadata: any | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaDataItem {
  id: number;
  attributes: MediaAttributes;
}

export interface MediaField {
  data: MediaDataItem[];
}

export interface CoverImageField {
  data: {
    id: number;
    attributes: MediaAttributes;
  } | null;
}

export interface GenericRelation<T> {
  data: T | null;
}

export interface GenericRelationArray<T> {
  data: T[];
}

export interface ProductDataResponse {
  Title: string;
  Description: string;
  Status: string;
  Weight?: number;
  AverageRating: number | null;
  RatingCount: number | null;
  createdAt: string;
  updatedAt: string;
  CleaningTips: string | null;
  ReturnConditions: string | null;
  removedAt: string | null;
  Files: MediaField;
  Media: MediaField;
  CoverImage: CoverImageField;
  product_main_category: GenericRelation<unknown>;
  product_tags: GenericRelationArray<TagAttributes>;
  product_variations: GenericRelationArray<unknown>;
  product_other_categories: GenericRelationArray<unknown>;
}

export const getProduct = async (
  id: string,
  params: PopulateObject,
): Promise<ApiResponse<Item>> => {
  const endpoint = `${ENDPOINTS.PRODUCT.PRODUCT}/${id}?${paramCreator(params)}`;
  // Use no-store cache for super-admin pages to ensure fresh data
  const response = await apiClient.get<ApiResponse<Item>>(endpoint, {
    cache: "no-store",
  });

  return response as any;
};

export type ProductSummary = {
  id: number;
  title: string;
  image?: string;
};

/**
 * Fetch minimal product data (id, title, image) by IDs for display in pickers.
 * Preserves order of requested ids in the result.
 */
export async function getProductSummariesByIds(ids: number[]): Promise<ProductSummary[]> {
  if (ids.length === 0) return [];
  const params = new URLSearchParams();
  ids.forEach((id, i) => params.set(`filters[id][$in][${i}]`, String(id)));
  params.set("populate[0]", "CoverImage");
  params.set("fields[0]", "Title");
  params.set("fields[1]", "id");
  const endpoint = `${ENDPOINTS.PRODUCT.PRODUCT}?${params.toString()}`;
  const res = (await apiClient.get(endpoint, { cache: "no-store" })) as any;
  const list = res?.data ?? [];
  const idToIndex = new Map(ids.map((id, i) => [id, i]));
  const withOrder = list.map((raw: any) => {
    const id = raw.id;
    const attrs = raw.attributes ?? {};
    const title = typeof attrs.Title === "string" ? attrs.Title : `محصول #${id}`;
    let image: string | undefined;
    const cover = attrs.CoverImage as CoverImageField | undefined;
    if (cover?.data?.attributes?.url) {
      const url = cover.data.attributes.url;
      image = url.startsWith("http") ? url : `${IMAGE_BASE_URL}${url}`;
    }
    return { id, title, image, order: idToIndex.get(id) ?? 0 };
  });
  withOrder.sort((a: any, b: any) => a.order - b.order);
  return withOrder.map(({ id, title, image }: any) => ({ id, title, image }));
}
