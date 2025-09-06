/**
 * API Client
 * Base class for making API requests
 */

import { API_BASE_URL, REQUEST_TIMEOUT, ERROR_MESSAGES } from "@/constants/api";
import { ApiRequestOptions, ApiResponse, ApiError } from "@/types/api";
import { handleAuthErrors } from "@/utils/auth";

interface ErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

// Export auth service
export { default as AuthService } from "./auth";
// Export user service
export { default as UserService } from "./user";
// Export cart service
export { default as CartService } from "./cart";
// Export order service
export { default as OrderService } from "./order";
// Export product like service
export { default as ProductLikeService } from "./product/product-like";

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}`;
  }

  /**
   * Make a GET request
   */
  async get<T>(
    endpoint: string,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>("GET", endpoint, undefined, options);
  }

  /**
   * Make a GET request without authentication (for public endpoints)
   */
  async getPublic<T>(
    endpoint: string,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
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
  async delete<T>(
    endpoint: string,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
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

    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders(options?.headers, options?.skipAuth);

    const config: RequestInit = {
      method,
      headers,
      credentials: options?.withCredentials ? "include" : "same-origin",
      body: data ? JSON.stringify(data) : undefined,
    };

    try {
      // Create an AbortController to handle request timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options?.timeout || REQUEST_TIMEOUT,
      );

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      // Clear the timeout
      clearTimeout(timeoutId);

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

        const error = this.handleError(
          response.status,
          responseData as ErrorResponse,
        );

        // Handle auth errors here for centralized auth redirects
        handleAuthErrors(error);

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
        // Handle auth errors here for centralized auth redirects
        handleAuthErrors(error as ApiError);
        throw error;
      }

      throw this.handleError(500, { message: ERROR_MESSAGES.DEFAULT });
    }
  }

  /**
   * Get headers for the request
   */
  private getHeaders(
    customHeaders?: Record<string, string>,
    skipAuth?: boolean,
  ): HeadersInit {
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
