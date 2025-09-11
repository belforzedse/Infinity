import { apiClient } from "@/services";
import { ENDPOINTS, STRAPI_TOKEN } from "@/constants/api";
import { PaginatedResponse } from "@/types/api";

export interface TagAttributes {
  Title: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagResponseType {
  id: number;
  attributes: TagAttributes;
}

export const getTags = async (): Promise<
  PaginatedResponse<TagResponseType>
> => {
  const endpoint = `${ENDPOINTS.PRODUCT.TAG}`;
  //const accessToken = localStorage.getItem("accessToken");

  const response = await apiClient.get<PaginatedResponse<TagResponseType>>(
    endpoint,
    {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
    },
  );

  return response.data;
};
