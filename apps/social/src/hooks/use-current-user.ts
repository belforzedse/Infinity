"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";
import { normalizeMeResponse } from "@/services/user/me";

const SUPER_ADMIN_ROLE = "superadmin";
const STORE_MANAGER_ROLE = "store manager";

type CurrentUserState = {
  isAuthenticated: boolean;
  firstName: string | null;
  roleName: string | null;
  isAdmin: boolean;
};

const INITIAL_STATE: CurrentUserState = {
  isAuthenticated: false,
  firstName: null,
  roleName: null,
  isAdmin: false,
};

/**
 * Session probe + first name + role flags for UI (same token + `/auth/self` as storefront).
 * Role normalization mirrors `apps/frontend/src/hooks/useCurrentUser.ts`.
 */
export function useCurrentUser() {
  const [state, setState] = useState<CurrentUserState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setState(INITIAL_STATE);
        return;
      }
      try {
        const response = await apiClient.get(ENDPOINTS.USER.ME, { cache: "no-store" });
        const user = normalizeMeResponse(response);
        if (!cancelled) {
          setState({
            isAuthenticated: true,
            firstName: typeof user.FirstName === "string" ? user.FirstName : "",
            roleName: typeof user.roleName === "string" ? user.roleName : null,
            isAdmin: user.isAdmin === true,
          });
        }
      } catch {
        if (!cancelled) {
          setState(INITIAL_STATE);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedRole = (state.roleName ?? "").toLowerCase().trim();
  const isSuperAdmin = normalizedRole === SUPER_ADMIN_ROLE;
  const isStoreManager = normalizedRole === STORE_MANAGER_ROLE;

  return {
    isAuthenticated: state.isAuthenticated,
    firstName: state.firstName,
    roleName: state.roleName,
    isAdmin: state.isAdmin,
    isSuperAdmin,
    isStoreManager,
    /** Convenience flag for surfaces that grant authoring controls to managers / super admins. */
    canCreatePost: isSuperAdmin || isStoreManager,
  };
}
