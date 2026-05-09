/**
 * API Types
 * Shared types for HTTP client and responses (Strapi-oriented naming is OK for headless CMS consumers).
 */

export interface ApiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
  error?: unknown;
}

export interface ApiRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
  retries?: number;
  withCredentials?: boolean;
  skipAuth?: boolean;
  suppressAuthRedirect?: boolean;
  signal?: AbortSignal;
  cache?: RequestCache;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface StrapiErrorResponse {
  error: {
    status: number;
    name: string;
    message: string;
    details?: unknown;
  };
}
