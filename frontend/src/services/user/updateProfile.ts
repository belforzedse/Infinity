import { apiClient } from "../index";
import { ENDPOINTS } from "@/constants/api";
import { MeResponse } from "./me";

export interface UpdateProfileRequest {
  FirstName?: string;
  LastName?: string;
  NationalCode?: string;
  Phone?: string;
  BirthDate?: string;
  Sex?: string;
}

export const updateProfile = async (data: UpdateProfileRequest): Promise<MeResponse> => {
  const endpoint = `${ENDPOINTS.USER.ME}`;
  const accessToken = localStorage.getItem("accessToken");

  const response = await apiClient.put(endpoint, data, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response as any;
};
