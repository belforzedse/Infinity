import { apiClient } from "../index";
import { ENDPOINTS } from "@/constants/api";
import { normalizePhoneNumber } from "@/utils/auth";

export interface Response {
  otpToken: string;
}

export const sendOTP = async (phoneNumber: string): Promise<Response> => {
  const endpoint = ENDPOINTS.AUTH.SEND_OTP;
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  const response = await apiClient.post<Response>(endpoint, {
    phone: normalizedPhone,
  });

  sessionStorage.setItem("otpToken", (response as any)?.otpToken);

  return response as any;
};
