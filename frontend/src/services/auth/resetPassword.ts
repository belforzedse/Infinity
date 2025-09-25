import { apiClient } from "../index";
import { ENDPOINTS } from "@/constants/api";

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

  const response = await apiClient.post<Response>(endpoint, {
    otpToken,
    otp: payload.otp,
    newPassword: payload.newPassword,
    phone: payload.phone,
  });

  return response as Response;
};
