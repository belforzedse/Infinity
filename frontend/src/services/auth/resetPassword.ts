import { apiClient } from "../index";
import { ENDPOINTS } from "@/constants/api";

export interface Response {
  message: string;
}

export const resetPassword = async (
  otp: string,
  password: string,
): Promise<Response> => {
  const endpoint = ENDPOINTS.AUTH.RESET_PASSWORD;

  try {
    const response = await apiClient.post<Response>(endpoint, {
      otpToken: sessionStorage.getItem("otpToken"),
      otp,
      newPassword: password,
    });

    return response as any;
  } catch (error) {
    return {
      message: "",
    };
  }
};

