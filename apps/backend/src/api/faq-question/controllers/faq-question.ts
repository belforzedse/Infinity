/**
 * faq-question controller
 */

import { factories } from "@strapi/strapi";
import { fetchUserWithRole, roleIsAllowed } from "../../../utils/roles";

export default factories.createCoreController("api::faq-question.faq-question" as any, ({ strapi }) => ({
  async getActorRoleName(userId?: number, fallback?: any): Promise<string | null> {
    if (!userId) {
      return fallback?.user_role?.Name || fallback?.role?.name || null;
    }

    const userWithRole = await fetchUserWithRole(strapi, userId);
    return userWithRole?.role?.name || userWithRole?.user_role?.Name || null;
  },

  // Create question (Superadmin+ or API token)
  async create(ctx) {
    const user = ctx.state.user;

    // Allow API tokens (no user) or users with proper roles
    if (user) {
      const actorRoleName: string | null = await this.getActorRoleName(user?.id, user);
      if (!roleIsAllowed(actorRoleName, ["Superadmin", "Store manager"])) {
        return ctx.forbidden("You don't have permission to create FAQ questions");
      }
    }

    const { data, meta } = await super.create(ctx);
    return { data, meta };
  },

  // Update question (Superadmin+ or API token)
  async update(ctx) {
    const user = ctx.state.user;

    // Allow API tokens (no user) or users with proper roles
    if (user) {
      const actorRoleName: string | null = await this.getActorRoleName(user?.id, user);
      if (!roleIsAllowed(actorRoleName, ["Superadmin", "Store manager"])) {
        return ctx.forbidden("You don't have permission to update FAQ questions");
      }
    }

    const { data, meta } = await super.update(ctx);
    return { data, meta };
  },

  // Delete question (Superadmin+ only)
  async delete(ctx) {
    const user = ctx.state.user;
    const actorRoleName: string | null = await this.getActorRoleName(user?.id, user);
    if (!user || !roleIsAllowed(actorRoleName, ["Superadmin", "Store manager"])) {
      return ctx.forbidden("You don't have permission to delete FAQ questions");
    }
    
    const { data, meta } = await super.delete(ctx);
    return { data, meta };
  }
}));
