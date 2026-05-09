/**
 * Storefront API client: composes `@repo/api` transport with app auth + cache rules.
 */

import {
  ApiClient,
  API_BASE_URL,
  ERROR_MESSAGES,
  REQUEST_TIMEOUT,
  RETRY_CONFIG,
} from "@repo/api";
import type { ApiError, ApiRequestOptions } from "@repo/api/types";
import { handleAuthErrors } from "@/utils/auth";
import { apiCache } from "./api-cache";

function onHttpError(
  error: ApiError,
  context: { status: number; options?: ApiRequestOptions },
): void {
  handleAuthErrors(error);
  if (context.status === 403 && typeof window !== "undefined") {
    void import("@/lib/atoms/auth").then(({ currentUserAtom }) => {
      void import("@/lib/jotaiStore").then(({ jotaiStore }) => {
        jotaiStore.set(currentUserAtom, null);
        if (window.location.pathname.startsWith("/super-admin")) {
          setTimeout(() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = "/";
            }
          }, 100);
        }
      });
    });
  }
}

export const apiClient = new ApiClient({
  baseUrl: API_BASE_URL,
  requestTimeout: REQUEST_TIMEOUT,
  retryConfig: RETRY_CONFIG,
  errorMessages: ERROR_MESSAGES,
  apiCache,
  onHttpError,
});

export { ApiClient };
