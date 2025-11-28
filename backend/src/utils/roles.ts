import { Strapi } from "@strapi/strapi";

export const ROLE_NAMES = {
  SUPERADMIN: "Superadmin",
  STORE_MANAGER: "Store manager",
  EDITOR: "Editor",
  CUSTOMER: "Customer",
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

const ROLE_ALIAS_MAP: Record<string, RoleName> = {
  superadmin: ROLE_NAMES.SUPERADMIN,
  superadministrator: ROLE_NAMES.SUPERADMIN,
  manager: ROLE_NAMES.STORE_MANAGER,
  storemanager: ROLE_NAMES.STORE_MANAGER,
  "store-manager": ROLE_NAMES.STORE_MANAGER,
  editor: ROLE_NAMES.EDITOR,
  customer: ROLE_NAMES.CUSTOMER,
};

export const MANAGEMENT_ROLES: RoleName[] = [
  ROLE_NAMES.SUPERADMIN,
  ROLE_NAMES.STORE_MANAGER,
  ROLE_NAMES.EDITOR,
];

export function normalizeRoleName(name?: string | null): RoleName | null {
  if (!name) {
    return null;
  }

  const compactKey = name.trim().toLowerCase().replace(/[\s_-]+/g, "");
  const aliasMatch = ROLE_ALIAS_MAP[compactKey];
  if (aliasMatch) {
    return aliasMatch;
  }

  // If the incoming role already matches our canonical names (case-insensitive), preserve casing
  const canonical = Object.values(ROLE_NAMES).find(
    (role) => role.toLowerCase().replace(/\s+/g, "") === compactKey,
  );

  return canonical ?? (name.trim() as RoleName);
}

export function roleIsAllowed(roleName: string | null | undefined, allowed: string[]): boolean {
  const normalizedRole = normalizeRoleName(roleName || null);
  if (!normalizedRole) {
    return false;
  }

  const normalizedAllowed = allowed
    .map((role) => normalizeRoleName(role) || role)
    .filter(Boolean) as RoleName[];

  if (normalizedAllowed.length === 0) {
    return false;
  }

  return normalizedAllowed.includes(normalizedRole);
}

/**
 * Fetches a user by ID and returns the user record with role-related relations populated.
 *
 * @param userId - The ID of the user to fetch; if not provided, the function returns `null`.
 * @returns The user record with `role`, `user_role`, and `user_info` populated, or `null` if `userId` was not provided or the user does not exist.
 */
export async function fetchUserWithRole(strapi: Strapi, userId?: number) {
  if (!userId) {
    return null;
  }

  return strapi
    .query("plugin::users-permissions.user")
    .findOne({
      where: { id: userId },
      populate: ["role", "user_role", "user_info"],
    });
}

/**
 * Retrieve a Strapi role by its canonical name.
 *
 * @param roleName - The canonical role name to look up
 * @returns The role record matching `roleName`, or `null` if no matching role is found
 */
export async function fetchRoleByName(strapi: Strapi, roleName: RoleName) {
  return strapi
    .query("plugin::users-permissions.role")
    .findOne({ where: { name: roleName } });
}