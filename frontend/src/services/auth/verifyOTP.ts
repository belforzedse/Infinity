import { apiClient } from "../index";
import { ENDPOINTS } from "@/constants/api";

export interface Response {
  token: string;
}

export const verifyOTP = async (otp: string): Promise<Response> => {
  const endpoint = ENDPOINTS.AUTH.VERIFY_OTP;

  const response = await apiClient.post<Response>(endpoint, {
    otpToken: sessionStorage.getItem("otpToken"),
    otp: otp,
  });

  return response as any;
};
