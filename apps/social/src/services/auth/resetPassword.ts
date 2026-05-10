import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";
import { normalizePhoneNumber } from "@/utils/auth";

export interface ResetPasswordRequest {
  otp: string;
  newPassword: string;
  otpToken?: string | null;
  phone?: string;
}

export interface ResetPasswordResponse {
  message?: string;
  success?: boolean;
}

const resolveStoredOtpToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.sessionStorage.getItem("otpToken");
  } catch {
    return null;
  }
};

export const resetPassword = async (
  payload: ResetPasswordRequest,
): Promise<ResetPasswordResponse> => {
  const endpoint = ENDPOINTS.AUTH.RESET_PASSWORD;

  const otpToken = payload.otpToken ?? resolveStoredOtpToken();

  if (!otpToken) {
    throw new Error("Missing OTP token");
  }

  const normalizedPhone = payload.phone ? normalizePhoneNumber(payload.phone) : undefined;

  const response = await apiClient.post<ResetPasswordResponse>(endpoint, {
    otpToken,
    otp: payload.otp,
    newPassword: payload.newPassword,
    phone: normalizedPhone,
  });

  return response as unknown as ResetPasswordResponse;
};
