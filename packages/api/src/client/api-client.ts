/**
 * Fetch-based API client with retries, optional browser cache (SWR + ETag), and injectable auth.
 */

import type { ApiRequestOptions, ApiResponse, ApiError } from "../types/api";
import {
  ERROR_MESSAGES,
  REQUEST_TIMEOUT,
  RETRY_CONFIG,
  type ErrorMessages,
} from "../config/public";
import type { ApiCache } from "../cache/api-cache";

interface ErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
  error?: {
    message?: string;
  };
}

class NotModifiedError extends Error {
  constructor() {
    super("304_NOT_MODIFIED");
    this.name = "NotModifiedError";
    Object.setPrototypeOf(this, NotModifiedError.prototype);
  }
}

export interface ApiClientConfig {
  baseUrl: string;
  requestTimeout?: number;
  retryConfig?: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    retryableStatusCodes: readonly number[];
  };
  errorMessages?: ErrorMessages;
  /** If set, used for Bearer token; otherwise reads localStorage key below (browser only). */
  getAuthToken?: () => string | null;
  accessTokenStorageKey?: string;
  /**
   * Called for failed responses before throw, unless suppressAuthRedirect is true.
   * Use for session cleanup, toasts, redirects, etc.
   */
  onHttpError?: (
    error: ApiError,
    context: { status: number; options?: ApiRequestOptions },
  ) => void;
  /**
   * Optional browser cache: SWR + ETag for eligible GETs, and in-flight deduplication
   * for GET only. POST/PUT/PATCH/DELETE always run independently (never share pending).
   */
  apiCache?: ApiCache;
}

const defaultRetryConfig = {
  maxRetries: RETRY_CONFIG.maxRetries,
  baseDelay: RETRY_CONFIG.baseDelay,
  maxDelay: RETRY_CONFIG.maxDelay,
  retryableStatusCodes: [...RETRY_CONFIG.retryableStatusCodes],
};

export class ApiClient {
  private readonly baseUrl: string;
  private readonly requestTimeout: number;
  private readonly retryConfig: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    retryableStatusCodes: readonly number[];
  };
  private readonly errorMessages: ErrorMessages;
  private readonly getAuthToken?: () => string | null;
  private readonly accessTokenStorageKey: string;
  private readonly onHttpError?: ApiClientConfig["onHttpError"];
  private readonly apiCache?: ApiCache;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.requestTimeout = config.requestTimeout ?? REQUEST_TIMEOUT;
    this.retryConfig = config.retryConfig ?? defaultRetryConfig;
    this.errorMessages = config.errorMessages ?? ERROR_MESSAGES;
    this.getAuthToken = config.getAuthToken;
    this.accessTokenStorageKey = config.accessTokenStorageKey ?? "accessToken";
    this.onHttpError = config.onHttpError;
    this.apiCache = config.apiCache;
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = this.retryConfig.maxRetries,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await requestFn();
      } catch (error: unknown) {
        lastError = error;

        if (error instanceof NotModifiedError) {
          throw error;
        }

        if (attempt >= retries) {
          break;
        }

        const status =
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          typeof (error as { status: unknown }).status === "number"
            ? (error as { status: number }).status
            : undefined;

        if (status !== undefined && !this.retryConfig.retryableStatusCodes.includes(status)) {
          break;
        }

        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, attempt),
          this.retryConfig.maxDelay,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("GET", endpoint, undefined, options);
  }

  async getPublic<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("GET", endpoint, undefined, {
      ...options,
      skipAuth: true,
    });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>("POST", endpoint, data, options);
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", endpoint, data, options);
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", endpoint, data, options);
  }

  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", endpoint, undefined, options);
  }

  private handleError(status: number, data: ErrorResponse): ApiError {
    return {
      message: data.error?.message || data.message || this.errorMessages.DEFAULT,
      status,
      errors: data.errors,
    };
  }

  private async parseResponseData(response: Response): Promise<unknown> {
    if (response.status === 204 || response.status === 205) {
      return {};
    }

    if (typeof response.text === "function") {
      const text = await response.text();
      if (!text.trim()) {
        return {};
      }

      try {
        return JSON.parse(text);
      } catch {
        return { message: text };
      }
    }

    if (typeof response.json === "function") {
      return response.json();
    }

    return {};
  }

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

    const baseUrlObj = new URL(this.baseUrl);
    const endpointPath = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
    const basePath = baseUrlObj.pathname.endsWith("/")
      ? baseUrlObj.pathname
      : `${baseUrlObj.pathname}/`;
    const fullPath = `${basePath}${endpointPath}`;
    const url = new URL(fullPath, `${baseUrlObj.protocol}//${baseUrlObj.host}`);

    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    if (options?.cache === "no-store") {
      url.searchParams.set("_cb", String(Date.now()));
    }

    const urlString = url.toString();
    const retries = options?.retries ?? this.retryConfig.maxRetries;
    const isGet = method.toUpperCase() === "GET";

    const cache = this.apiCache;
    const cacheKey = cache ? cache.generateKey(method, urlString, data) : "";

    // In-flight dedupe only for GET: mutating requests must not share one promise by URL/body.
    if (cache && isGet) {
      const pendingRequest = cache.getPending<{ data: ApiResponse<T>; headers: Headers }>(cacheKey);
      if (pendingRequest) {
        return pendingRequest.then((response) => response.data);
      }
    }

    const enableCache =
      typeof window !== "undefined" &&
      !!cache &&
      cache.shouldCache(method, urlString) &&
      options?.cache !== "no-store";

    const cacheConfig = enableCache && cache ? cache.getCacheConfig(urlString) : null;

    if (enableCache && cache && cacheConfig && isGet) {
      const cached = cache.get<ApiResponse<T>>(cacheKey);

      if (cached) {
        const bgRefreshKey = `bg-${cacheKey}`;
        if (!cache.getPending(bgRefreshKey)) {
          const bgPromise = this.retryRequest(
            () => this.executeRequest<T>(method, urlString, data, options, cached.etag),
            retries,
          )
            .then((response) => {
              const etag = this.extractETag(response.headers);
              cache.set(cacheKey, response.data, etag, cacheConfig);
            })
            .catch((error: unknown) => {
              if (
                typeof error === "object" &&
                error !== null &&
                "message" in error &&
                (error as { message: unknown }).message === "304_NOT_MODIFIED"
              ) {
                return;
              }
            });
          cache.setPending(bgRefreshKey, bgPromise);
        }

        return Promise.resolve(cached.data);
      }
    }

    const requestPromise = this.retryRequest(
      () => this.executeRequest<T>(method, urlString, data, options, null),
      retries,
    );

    if (cache && isGet) {
      cache.setPending(cacheKey, requestPromise);
    }

    try {
      const response = await requestPromise;

      if (enableCache && cache && cacheConfig && isGet && response) {
        const etag = this.extractETag(response.headers);
        cache.set(cacheKey, response.data, etag, cacheConfig);
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  private async executeRequest<T>(
    method: string,
    url: string,
    requestData: unknown,
    options: ApiRequestOptions | undefined,
    etag: string | null,
  ): Promise<{ data: ApiResponse<T>; headers: Headers }> {
    let headers = this.buildHeaders(options?.headers, options?.skipAuth);

    if (etag && method.toUpperCase() === "GET") {
      (headers as Record<string, string>)["If-None-Match"] = etag;
    }

    const config: RequestInit = {
      method,
      headers,
      credentials: options?.withCredentials ? "include" : "same-origin",
      body: requestData ? JSON.stringify(requestData) : undefined,
      cache: options?.cache || "default",
    };

    const controller = new AbortController();
    const cleanupExternalAbort = options?.signal
      ? (() => {
          const onAbort = () => controller.abort();
          options.signal!.addEventListener("abort", onAbort);
          return () => options.signal!.removeEventListener("abort", onAbort);
        })()
      : undefined;
    const timeoutId = setTimeout(
      () => controller.abort(),
      options?.timeout ?? this.requestTimeout,
    );

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (cleanupExternalAbort) cleanupExternalAbort();

      if (response.status === 304) {
        throw new NotModifiedError();
      }

      const responseData = await this.parseResponseData(response);

      if (!response.ok) {
        if (response.status === 400) {
          const parsed = responseData as { error?: { message?: string } };
          const error: ApiError = {
            status: response.status,
            message: parsed.error?.message || this.errorMessages.DEFAULT,
            error: parsed.error || responseData,
          };
          throw error;
        }

        const error = this.handleError(response.status, responseData as ErrorResponse);

        if (!options?.suppressAuthRedirect) {
          this.onHttpError?.(error, { status: response.status, options });
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

      if (error instanceof NotModifiedError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw this.handleError(408, { message: this.errorMessages.TIMEOUT });
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        ("message" in error || "error" in error)
      ) {
        throw error;
      }

      throw this.handleError(500, { message: this.errorMessages.DEFAULT });
    }
  }

  private extractETag(headers: Headers): string | null {
    return headers.get("etag") || null;
  }

  private buildHeaders(
    customHeaders?: Record<string, string>,
    skipAuth?: boolean,
  ): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...customHeaders,
    };

    if (!skipAuth && !customHeaders?.Authorization) {
      const token = this.resolveAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private resolveAuthToken(): string | null {
    if (this.getAuthToken) {
      return this.getAuthToken();
    }
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem(this.accessTokenStorageKey);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export default ApiClient;
