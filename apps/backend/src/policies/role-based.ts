import { Strapi } from "@strapi/strapi";
import { fetchUserWithRole, normalizeRoleName, roleIsAllowed, ROLE_NAMES } from "../utils/roles";

type RoleBasedPolicyConfig = {
  roles?: string[];
};

export default async (policyContext, config: RoleBasedPolicyConfig = {}, { strapi }: { strapi: Strapi }) => {
  const ctx = policyContext;
  const allowedRoles = config.roles && config.roles.length > 0 ? config.roles : [ROLE_NAMES.SUPERADMIN];

  const tokenUser = ctx.state?.user;
  if (!tokenUser?.id) {
    return ctx.unauthorized?.("Authentication required");
  }

  let roleName = normalizeRoleName(tokenUser.role?.name);
  let fullUser = tokenUser;

  if (!roleName) {
    fullUser = await fetchUserWithRole(strapi, tokenUser.id);
    roleName = normalizeRoleName(fullUser?.role?.name);
  }

  if (!roleName) {
    return ctx.forbidden?.("User role is missing");
  }

  if (!roleIsAllowed(roleName, allowedRoles)) {
    return ctx.forbidden?.("You do not have permission to perform this action");
  }

  // Ensure downstream handlers always have the fully populated user object
  ctx.state.user = fullUser;

  return true;
};
