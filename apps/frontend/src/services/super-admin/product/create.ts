import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import type { ProductData } from "@/types/super-admin/products";
import { toast } from "react-hot-toast";

type RawRelationValue =
  | null
  | undefined
  | number
  | string
  | { id?: number | string; data?: { id?: number | string } | number | string | null };

const normalizeRelationId = (value: RawRelationValue): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === "object") {
    if (value.id !== undefined) {
      return normalizeRelationId(value.id as RawRelationValue);
    }
    if (value.data !== undefined) {
      if (typeof value.data === "object") {
        return normalizeRelationId((value.data as { id?: RawRelationValue }).id ?? null);
      }
      return normalizeRelationId(value.data as RawRelationValue);
    }
  }
  return null;
};

const normalizeRelationIds = (values?: RawRelationValue[]): number[] | undefined => {
  if (!Array.isArray(values) || values.length === 0) {
    return undefined;
  }
  const ids = values
    .map((item) => normalizeRelationId(item))
    .filter((id): id is number => typeof id === "number");
  return ids.length > 0 ? ids : undefined;
};

interface TransformedProductData
  extends Omit<
    ProductData,
    "product_main_category" | "product_tags" | "product_other_categories" | "CoverImage" | "Media" | "Files"
  > {
  product_main_category: number | null;
  product_tags: number[];
  product_other_categories: number[];
  CoverImage?: number | null;
  Media?: number[];
  Files?: number[];
}

function transformProductDataForApi(data: ProductData): TransformedProductData {
  const { CoverImage, Media, Files, ...rest } = data;

  const coverImageId = normalizeRelationId(CoverImage?.data ?? CoverImage);
  const mediaIds = normalizeRelationIds(Media as unknown as RawRelationValue[]);
  const fileIds = normalizeRelationIds(Files as unknown as RawRelationValue[]);

  return {
    ...rest,
    CoverImage: coverImageId ?? undefined,
    Media: mediaIds,
    Files: fileIds,
    product_main_category: rest.product_main_category?.id || null,
    product_tags: rest.product_tags.map((tag) => tag.id),
    product_other_categories: rest.product_other_categories.map((category) => category.id),
  };
}

export const createProduct = async (body: ProductData) => {
  try {
    const endpoint = `${ENDPOINTS.PRODUCT.PRODUCT}`;
    const transformedBody = transformProductDataForApi(body);

    const response = await apiClient.post(endpoint, {
      data: transformedBody,
    });

    return { success: true, data: response.data };
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message || "ساخت محصول با خطا مواجه شد";
    toast.error(errorMessage);
    return { success: false, error };
  }
};
