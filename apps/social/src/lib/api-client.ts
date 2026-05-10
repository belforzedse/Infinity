/**
 * Social app API client — shared transport via `@repo/api`.
 * Add `getAuthToken` / `onHttpError` / `apiCache` here when the app needs them.
 */

import {
  ApiClient,
  API_BASE_URL,
  ERROR_MESSAGES,
  REQUEST_TIMEOUT,
  RETRY_CONFIG,
} from "@repo/api";

export const apiClient = new ApiClient({
  baseUrl: API_BASE_URL,
  requestTimeout: REQUEST_TIMEOUT,
  retryConfig: RETRY_CONFIG,
  errorMessages: ERROR_MESSAGES,
});

export { ApiClient };
