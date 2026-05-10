import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";
import { normalizePhoneNumber } from "@/utils/auth";

export interface SendOtpResponse {
  otpToken: string;
}

export const sendOTP = async (phoneNumber: string): Promise<SendOtpResponse> => {
  const endpoint = ENDPOINTS.AUTH.SEND_OTP;
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  const response = await apiClient.post<SendOtpResponse>(endpoint, {
    phone: normalizedPhone,
  });

  const data = response as unknown as SendOtpResponse;
  if (typeof window !== "undefined" && data?.otpToken) {
    sessionStorage.setItem("otpToken", data.otpToken);
  }

  return data;
};
