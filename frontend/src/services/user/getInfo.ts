import { apiClient } from "../index";
import { ENDPOINTS } from "@/constants/api";
export type Response = {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user: number;
  bio: string;
  birth_date: string;
  email: string;
  gender: string;
  profile_picture_id: number;
};

export const getInfo = async (id: string): Promise<Response> => {
  const endpoint = `${ENDPOINTS.USER.GET_INFO}?value=${id}`;
  const accessToken = localStorage.getItem("accessToken");

  const response = await apiClient.get<Response>(endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response as any;
};
