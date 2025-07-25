import { apiClient } from "../index";
import { ENDPOINTS } from "@/constants/api";

export interface Response {
  message: string;
}

export const register = async (
  firstName: string,
  lastName: string,
  password: string
): Promise<Response> => {
  const endpoint = ENDPOINTS.AUTH.REGISTER;

  const response = await apiClient.post<Response>(
    endpoint,
    {
      firstName,
      lastName,
      password,
    },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    }
  );

  return response as any;
};
