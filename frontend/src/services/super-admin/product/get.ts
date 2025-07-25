import { apiClient } from "@/services";
import { ENDPOINTS, STRAPI_TOKEN } from "@/constants/api";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { paramCreator } from "@/utils/paramCreator";
import { TagAttributes } from "./tag/get";

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
  params: PopulateObject
): Promise<ApiResponse<Item>> => {
  const endpoint = `${ENDPOINTS.PRODUCT.PRODUCT}/${id}?${paramCreator(params)}`;
  const response = await apiClient.get<ApiResponse<Item>>(endpoint, {
    headers: {
      Authorization: `Bearer ${STRAPI_TOKEN}`,
    },
  });

  return response as any;
};
