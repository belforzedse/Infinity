/**
 * API Client
 * Base class for making API requests
 */

import { API_BASE_URL, REQUEST_TIMEOUT, ERROR_MESSAGES } from "@/constants/api";
import type { ApiRequestOptions, ApiResponse, ApiError } from "@/types/api";
import { handleAuthErrors } from "@/utils/auth";

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

    // Build URL with query parameters using URL and URLSearchParams APIs
    // Fix: new URL() with absolute paths (starting with /) replaces the base URL's pathname
    // So we need to manually join the paths to preserve /api prefix
    const baseUrlObj = new URL(this.baseUrl);
    // Remove leading slash from endpoint if present, then append to baseUrl pathname
    const endpointPath = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    // Ensure baseUrl pathname ends with / for proper joining
    const basePath = baseUrlObj.pathname.endsWith('/')
      ? baseUrlObj.pathname
      : `${baseUrlObj.pathname}/`;
    const fullPath = `${basePath}${endpointPath}`;
    const url = new URL(fullPath, `${baseUrlObj.protocol}//${baseUrlObj.host}`);

    // Append params from options.params if provided
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        // Skip undefined values
        if (value !== undefined) {
          // Convert to string (handles number, boolean, string)
          url.searchParams.set(key, String(value));
        }
      });
    }

    // Add cache-busting query parameter if cache is set to 'no-store'
    // This is added after params are merged to respect existing query string
    if (options?.cache === 'no-store') {
      url.searchParams.set('_cb', String(Date.now()));
    }

    const headers = this.getHeaders(options?.headers, options?.skipAuth);

    const config: RequestInit = {
      method,
      headers,
      credentials: options?.withCredentials ? "include" : "same-origin",
      body: data ? JSON.stringify(data) : undefined,
      cache: options?.cache || 'default', // Support cache option from RequestOptions
    };

    try {
      // Create an AbortController to handle request timeout
      const controller = new AbortController();
      // If caller provided a signal, abort our controller when theirs aborts
      const cleanupExternalAbort = options?.signal
        ? (() => {
            const onAbort = () => controller.abort();
            options.signal!.addEventListener("abort", onAbort);
            return () => options.signal!.removeEventListener("abort", onAbort);
          })()
        : undefined;
      const timeoutId = setTimeout(() => controller.abort(), options?.timeout || REQUEST_TIMEOUT);

      const response = await fetch(url.toString(), {
        ...config,
        signal: controller.signal,
      });

      // Clear the timeout and external abort listener
      clearTimeout(timeoutId);
      if (cleanupExternalAbort) cleanupExternalAbort();

      // Parse the response
      const responseData: unknown = await response.json();

      // Check if the response is successful
      if (!response.ok) {
        // For 400 errors, preserve the original error structure from the API
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

        // Handle auth errors here for centralized auth redirects
        if (!options?.suppressAuthRedirect) {
          // Call auth error handler with only the error object. The second
          // parameter is optional and tests expect a single-argument call.
          handleAuthErrors(error);

          // If it's a 403 error, refresh user data to catch role changes
          // This ensures that if a user's role was changed in the backend,
          // the frontend will get the updated role information
          // NOTE: We do NOT clear the access token - user stays logged in
          if (response.status === 403 && typeof window !== "undefined") {
            // Import dynamically to avoid circular dependencies
            import("@/lib/atoms/auth").then(({ currentUserAtom }) => {
              import("@/lib/jotaiStore").then(({ jotaiStore }) => {
                // Clear cached user data (but NOT the token - user remains logged in)
                jotaiStore.set(currentUserAtom, null);

                // If we're on an admin page, redirect immediately
                // The ClientLayout will also handle the redirect, but this is more immediate
                if (window.location.pathname.startsWith("/super-admin")) {
                  // Use a small delay to let the error handler finish
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

      // For Strapi API, just return the responseData directly
      // as it already has the format we need (data and meta properties)
      return responseData as ApiResponse<T>;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        throw this.handleError(408, { message: ERROR_MESSAGES.TIMEOUT });
      }

      // If error already has our expected structure, just rethrow it
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
