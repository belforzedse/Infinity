/**
 * API Client
 * Base class for making API requests
 */

import { API_BASE_URL, REQUEST_TIMEOUT, RETRY_CONFIG, ERROR_MESSAGES } from "@/constants/api";
import type { ApiRequestOptions, ApiResponse, ApiError } from "@/types/api";
import { handleAuthErrors } from "@/utils/auth";
import { apiCache, shouldCache, getCacheConfig } from "./api-cache";

interface ErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = `${API_BASE_URL}`) {
    this.baseUrl = baseUrl;
  }

  /**
   * Retry a request with exponential backoff
   */
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = RETRY_CONFIG.maxRetries,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await requestFn();
      } catch (error: any) {
        lastError = error;

        // Don't retry on final attempt
        if (attempt >= retries) {
          break;
        }

        // Only retry on configured retryable status codes
        if (error?.status && !RETRY_CONFIG.retryableStatusCodes.includes(error.status)) {
          break;
        }

        // Calculate exponential backoff delay
        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
          RETRY_CONFIG.maxDelay,
        );

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Make a GET request
   */
  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("GET", endpoint, undefined, options);
  }

  /**
   * Make a GET request without authentication (for public endpoints)
   */
  async getPublic<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("GET", endpoint, undefined, {
      ...options,
      skipAuth: true,
    });
  }

  /**
   * Make a POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>("POST", endpoint, data, options);
  }

  /**
   * Make a PUT request
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", endpoint, data, options);
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", endpoint, data, options);
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", endpoint, undefined, options);
  }

  /**
   * Make a request with the given method, endpoint, and data
   * Includes caching, deduplication, ETag support, and retry logic
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    if (!this.baseUrl || this.baseUrl === "undefined") {
      throw this.handleError(500, {
        message: "API base URL is not configured",
      });
    }

    // Build URL with query parameters
    const baseUrlObj = new URL(this.baseUrl);
    const endpointPath = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const basePath = baseUrlObj.pathname.endsWith('/')
      ? baseUrlObj.pathname
      : `${baseUrlObj.pathname}/`;
    const fullPath = `${basePath}${endpointPath}`;
    const url = new URL(fullPath, `${baseUrlObj.protocol}//${baseUrlObj.host}`);

    // Append params from options.params if provided
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    // Add cache-busting query parameter if cache is set to 'no-store'
    if (options?.cache === 'no-store') {
      url.searchParams.set('_cb', String(Date.now()));
    }

    const urlString = url.toString();

    // Generate cache key for request deduplication and caching
    const cacheKey = apiCache.generateKey(method, urlString, data);

    // Request deduplication: if same request is pending, share the promise
    const pendingRequest = apiCache.getPending<{ data: ApiResponse<T>; headers: Headers }>(cacheKey);
    if (pendingRequest) {
      // Transform to match return type (extract data from response)
      return pendingRequest.then(response => response.data);
    }

    // Check if caching is enabled for this endpoint
    const enableCache = typeof window !== "undefined" &&
                       shouldCache(method, urlString) &&
                       options?.cache !== 'no-store';

    // Get cache config if caching is enabled
    const cacheConfig = enableCache ? getCacheConfig(urlString) : null;

    // Check cache for GET requests
    if (enableCache && cacheConfig && method.toUpperCase() === "GET") {
      const cached = apiCache.get<ApiResponse<T>>(cacheKey);

      if (cached) {
        // Always fetch fresh in background (stale-while-revalidate pattern)
        // Check if background refresh is already in progress to prevent duplicates
        const bgRefreshKey = `bg-${cacheKey}`;
        if (!apiCache.getPending(bgRefreshKey)) {
          // Track background refresh to prevent duplicates
          const bgPromise = this.retryRequest(() =>
            this.executeRequest<T>(method, urlString, data, options, cached.etag)
          )
            .then(response => {
              // Update cache with fresh response
              const etag = this.extractETag(response.headers);
              apiCache.set(cacheKey, response.data, etag, cacheConfig);
            })
            .catch((error: any) => {
              // Ignore 304 errors (cache still valid) and other errors in background refresh
              if (error?.message === "304_NOT_MODIFIED") {
                // Cache is still valid, just update timestamp if needed
                return;
              }
              // Ignore other errors - cached data is still valid
            });
          apiCache.setPending(bgRefreshKey, bgPromise);
        }

        // Return cached data immediately (stale-while-revalidate)
        return Promise.resolve(cached.data);
      }
    }

    // Execute request with retry logic
    const requestPromise = this.retryRequest(() =>
      this.executeRequest<T>(method, urlString, data, options, null)
    );

    // Track pending request (store the full requestPromise, not just data)
    // This ensures the cached pending value matches the method contract (Promise<ApiResponse<T>>)
    apiCache.setPending(cacheKey, requestPromise);

    try {
      const response = await requestPromise;

      // Cache successful GET responses
      if (enableCache && cacheConfig && method.toUpperCase() === "GET" && response) {
        const etag = this.extractETag(response.headers);
        apiCache.set(cacheKey, response.data, etag, cacheConfig);
      }

      // Return just the data (extract from ApiResponse)
      return response.data;
    } catch (error) {
      // Re-throw error after cleanup
      throw error;
    }
  }

  /**
   * Execute the actual HTTP request
   */
  private async executeRequest<T>(
    method: string,
    url: string,
    data: unknown,
    options: ApiRequestOptions | undefined,
    etag: string | null,
  ): Promise<{ data: ApiResponse<T>; headers: Headers }> {
    let headers = this.getHeaders(options?.headers, options?.skipAuth);

    // Add If-None-Match header for conditional request (ETag support)
    if (etag && method.toUpperCase() === "GET") {
      (headers as Record<string, string>)["If-None-Match"] = etag;
    }

    const config: RequestInit = {
      method,
      headers,
      credentials: options?.withCredentials ? "include" : "same-origin",
      body: data ? JSON.stringify(data) : undefined,
      cache: options?.cache || 'default',
    };

    // Create an AbortController to handle request timeout
    const controller = new AbortController();
    const cleanupExternalAbort = options?.signal
      ? (() => {
          const onAbort = () => controller.abort();
          options.signal!.addEventListener("abort", onAbort);
          return () => options.signal!.removeEventListener("abort", onAbort);
        })()
      : undefined;
    const timeoutId = setTimeout(() => controller.abort(), options?.timeout || REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      // Clear the timeout and external abort listener
      clearTimeout(timeoutId);
      if (cleanupExternalAbort) cleanupExternalAbort();

      // Handle 304 Not Modified (conditional request)
      // If we get 304, it means cached data is still valid
      // We'll let the caller handle this (should not happen in normal flow since we return cached first)
      if (response.status === 304) {
        // For 304, we don't have response body, so throw to indicate we should use cache
        throw new Error("304_NOT_MODIFIED");
      }

      // Parse the response
      const responseData: unknown = await response.json();

      // Check if the response is successful
      if (!response.ok) {
        if (response.status === 400) {
          const parsed = responseData as { error?: { message?: string } };
          const error = {
            status: response.status,
            message: parsed.error?.message || ERROR_MESSAGES.DEFAULT,
            error: parsed.error || responseData,
          };
          throw error;
        }

        const error = this.handleError(response.status, responseData as ErrorResponse);

        // Handle auth errors
        if (!options?.suppressAuthRedirect) {
          handleAuthErrors(error);

          if (response.status === 403 && typeof window !== "undefined") {
            import("@/lib/atoms/auth").then(({ currentUserAtom }) => {
              import("@/lib/jotaiStore").then(({ jotaiStore }) => {
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

        throw error;
      }

      return {
        data: responseData as ApiResponse<T>,
        headers: response.headers,
      };
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (cleanupExternalAbort) cleanupExternalAbort();

      if (error instanceof Error && error.name === "AbortError") {
        throw this.handleError(408, { message: ERROR_MESSAGES.TIMEOUT });
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        ("message" in error || "error" in error)
      ) {
        throw error;
      }

      throw this.handleError(500, { message: ERROR_MESSAGES.DEFAULT });
    }
  }

  /**
   * Extract ETag from response headers
   */
  private extractETag(headers: Headers): string | null {
    const etag = headers.get("etag");
    return etag || null;
  }

  /**
   * Get headers for the request
   */
  private getHeaders(customHeaders?: Record<string, string>, skipAuth?: boolean): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...customHeaders,
    };

    // Add authorization header if token exists, skipAuth is not true, and customHeaders doesn't already have Authorization
    if (!skipAuth && !customHeaders?.Authorization) {
      const token = this.getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Get the authentication token from localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  }

  /**
   * Handle API errors
   */
  private handleError(status: number, data: ErrorResponse): ApiError {
    return {
      message: data.message || ERROR_MESSAGES.DEFAULT,
      status,
      errors: data.errors,
    };
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();

export default ApiClient;
