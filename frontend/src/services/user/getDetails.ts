import { apiClient } from "../index";
import { ENDPOINTS, STRAPI_TOKEN } from "@/constants/api";

export interface GetUserResponse {
  data: {
    id: number;
    attributes: {
      Phone: string;
      IsVerified: boolean;
      createdAt: string;
      updatedAt: string;
      IsActive: boolean;
      removedAt: null | string;
      user_role: {
        data: {
          id: number;
        };
      };
      user_info: {
        data: {
          id: number;
          attributes: {
            FirstName: string;
            LastName: string;
            createdAt: string;
            updatedAt: string;
            NationalCode: string | null;
            BirthDate: string | null;
            Sex: string | null;
            Bio: string | null;
          };
        };
      };
    };
  };
}

export const getDetails = async (id: string): Promise<GetUserResponse["data"]> => {
  const endpoint = `${ENDPOINTS.USER.GET_DETAILS}/${id}?populate[0]=user_info&populate[1]=user_role`;

  const response = await apiClient.get<GetUserResponse>(endpoint, {
    headers: {
      Authorization: `Bearer ${STRAPI_TOKEN}`,
    },
  });

  return (response as any).data;
};
