import { apiClient } from "../index";
import { ENDPOINTS, STRAPI_TOKEN } from "@/constants/api";

export interface GetAllUserResponse {
  data: {
    id: number;
    attributes: {
      FirstName: string;
      LastName: string;
      Phone: string;
      IsActive: boolean;
      IsVerified: boolean;
      createdAt: string;
      updatedAt: string;
    };
  }[];
}

export const getAll = async (): Promise<GetAllUserResponse> => {
  const endpoint = `${ENDPOINTS.USER.GET_ALL}`;
  const accessToken = STRAPI_TOKEN;

  const response = await apiClient.get<GetAllUserResponse>(endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
};
