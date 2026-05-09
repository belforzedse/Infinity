"use client";

/**
 * Access token persistence helpers for browser clients.
 * Centralizes storage key and emits a custom event for same-tab listeners.
 */

export const ACCESS_TOKEN_STORAGE_KEY = "accessToken";
export const ACCESS_TOKEN_EVENT = "auth-access-token-changed";

type AccessTokenDetail = {
  token: string | null;
};

const dispatchAccessTokenChange = (token: string | null) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AccessTokenDetail>(ACCESS_TOKEN_EVENT, {
      detail: { token },
    }),
  );
};

export const setAccessToken = (token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  dispatchAccessTokenChange(token);
};

export const clearAccessToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  dispatchAccessTokenChange(null);
};
