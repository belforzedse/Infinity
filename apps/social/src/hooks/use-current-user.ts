"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";
import { normalizeMeResponse } from "@/services/user/me";

/**
 * Session probe + first name for UI (same token + `/auth/self` as storefront).
 */
export function useCurrentUser() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsAuthenticated(false);
        setFirstName(null);
        return;
      }
      try {
        const response = await apiClient.get(ENDPOINTS.USER.ME, { cache: "no-store" });
        const user = normalizeMeResponse(response);
        if (!cancelled) {
          setIsAuthenticated(true);
          setFirstName(typeof user.FirstName === "string" ? user.FirstName : "");
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
          setFirstName(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { isAuthenticated, firstName };
}
