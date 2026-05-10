import type { ApiError } from "@repo/api/types";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";
import type { MeResponse } from "@/types/user-me";
import { handleAuthErrors } from "@/utils/auth";

const ME_TIMEOUT_MS = 10000;
const ME_MAX_RETRIES = 1;

type MaybeApiResponse<T> = T | { data: T };

function hasData<T>(p: unknown): p is { data: T } {
  return typeof p === "object" && p !== null && "data" in (p as Record<string, unknown>);
}

export type { MeResponse };

export const me = async (): Promise<MeResponse> => {
  const endpoint = ENDPOINTS.USER.ME;
  const accessToken =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  try {
    const response = await apiClient.get<MeResponse>(endpoint, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      cache: "default",
      timeout: ME_TIMEOUT_MS,
      retries: ME_MAX_RETRIES,
    });

    const payload = response as MaybeApiResponse<MeResponse>;
    return hasData<MeResponse>(payload) ? payload.data : (payload as MeResponse);
  } catch (error: unknown) {
    handleAuthErrors(error as ApiError);
    throw error;
  }
};
