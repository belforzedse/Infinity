/**
 * blog-author controller
 */

import { factories } from "@strapi/strapi";
import { roleIsAllowed } from "../../../utils/roles";

export default factories.createCoreController("api::blog-author.blog-author", ({ strapi }) => ({
  // Create author (Superadmin/Store manager or API token)
  async create(ctx) {
    const { user } = ctx.state;

    // Allow API tokens (no user) or users with proper roles
    if (user) {
      if (!roleIsAllowed(user.user_role?.Name, ["Superadmin", "Store manager"])) {
        return ctx.forbidden("You don't have permission to create blog authors");
      }
    }

    const { data, meta } = await super.create(ctx);
    return { data, meta };
  },

  // Update author (Superadmin/Store manager or API token)
  async update(ctx) {
    const { user } = ctx.state;

    // Allow API tokens (no user) or users with proper roles
    if (user) {
      if (!roleIsAllowed(user.user_role?.Name, ["Superadmin", "Store manager"])) {
        return ctx.forbidden("You don't have permission to update blog authors");
      }
    }

    const { data, meta } = await super.update(ctx);
    return { data, meta };
  },

  // Delete author (Superadmin/Store manager only)
  async delete(ctx) {
    const { user } = ctx.state;
    
    if (!user || !roleIsAllowed(user.user_role?.Name, ["Superadmin", "Store manager"])) {
      return ctx.forbidden("You don't have permission to delete blog authors");
    }
    
    const { data, meta } = await super.delete(ctx);
    return { data, meta };
  }
}));
