/**
 * API Utilities — re-exports shared helpers; `handleApiError` binds storefront messages.
 */

import { handleApiError as handleApiErrorBase } from "@repo/api/utils";
import { ERROR_MESSAGES } from "@/constants/api";
import type { ApiError } from "@/types/api";

export {
  formatQueryParams,
  parseJwt,
  isTokenExpired,
  type JwtPayload,
} from "@repo/api/utils";

export const handleApiError = (error: unknown): ApiError =>
  handleApiErrorBase(error, ERROR_MESSAGES);
