"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";

/**
 * Minimal session probe for story “seen” sync — same token + `/auth/self` pattern as storefront.
 */
export function useCurrentUser() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
      try {
        await apiClient.get(ENDPOINTS.USER.ME, { cache: "no-store" });
        if (!cancelled) setIsAuthenticated(true);
      } catch {
        if (!cancelled) setIsAuthenticated(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { isAuthenticated };
}
