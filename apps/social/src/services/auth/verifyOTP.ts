import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";

export interface VerifyOtpResponse {
  token: string;
}

export const verifyOTP = async (otp: string): Promise<VerifyOtpResponse> => {
  const endpoint = ENDPOINTS.AUTH.VERIFY_OTP;

  const response = await apiClient.post<VerifyOtpResponse>(
    endpoint,
    {
      otpToken: typeof window !== "undefined" ? sessionStorage.getItem("otpToken") : null,
      otp,
    },
    { suppressAuthRedirect: true },
  );

  return response as unknown as VerifyOtpResponse;
};
