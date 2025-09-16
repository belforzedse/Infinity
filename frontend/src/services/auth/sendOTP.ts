import { apiClient } from "../index";
import { ENDPOINTS } from "@/constants/api";

export interface Response {
  otpToken: string;
}

export const sendOTP = async (phoneNumber: string): Promise<Response> => {
  const endpoint = ENDPOINTS.AUTH.SEND_OTP;

  const response = await apiClient.post<Response>(endpoint, {
    phone: phoneNumber,
  });

  sessionStorage.setItem("otpToken", (response as any)?.otpToken);

  return response as any;
};
