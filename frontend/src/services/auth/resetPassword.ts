import { apiClient } from "../index";
import { ENDPOINTS } from "@/constants/api";
import { normalizePhoneNumber } from "@/utils/auth";

export interface ResetPasswordRequest {
  otp: string;
  newPassword: string;
  otpToken?: string | null;
  phone?: string;
}

export interface Response {
  message?: string;
  success?: boolean;
}

const resolveStoredOtpToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage.getItem("otpToken");
  } catch {
    return null;
  }
};

export const resetPassword = async (payload: ResetPasswordRequest): Promise<Response> => {
  const endpoint = ENDPOINTS.AUTH.RESET_PASSWORD;

  const otpToken = payload.otpToken ?? resolveStoredOtpToken();

  if (!otpToken) {
    throw new Error("Missing OTP token");
  }

  const normalizedPhone = payload.phone ? normalizePhoneNumber(payload.phone) : undefined;

  const response = await apiClient.post<Response>(endpoint, {
    otpToken,
    otp: payload.otp,
    newPassword: payload.newPassword,
    phone: normalizedPhone,
  });

  return response as any;
};
