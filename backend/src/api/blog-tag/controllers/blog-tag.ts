/**
 * blog-tag controller
 */

import { factories } from "@strapi/strapi";
import { roleIsAllowed } from "../../../utils/roles";

export default factories.createCoreController("api::blog-tag.blog-tag", ({ strapi }) => ({
  // Create tag (Editor+ only)
  async create(ctx) {
    const { user } = ctx.state;
    
    if (!user || !roleIsAllowed(user.user_role?.Name, ["Superadmin", "Store manager", "Editor"])) {
      return ctx.forbidden("You don't have permission to create blog tags");
    }
    
    const { data, meta } = await super.create(ctx);
    return { data, meta };
  },

  // Update tag (Editor+ only)
  async update(ctx) {
    const { user } = ctx.state;
    
    if (!user || !roleIsAllowed(user.user_role?.Name, ["Superadmin", "Store manager", "Editor"])) {
      return ctx.forbidden("You don't have permission to update blog tags");
    }
    
    const { data, meta } = await super.update(ctx);
    return { data, meta };
  },

  // Delete tag (Editor+ only)
  async delete(ctx) {
    const { user } = ctx.state;
    
    if (!user || !roleIsAllowed(user.user_role?.Name, ["Superadmin", "Store manager", "Editor"])) {
      return ctx.forbidden("You don't have permission to delete blog tags");
    }
    
    const { data, meta } = await super.delete(ctx);
    return { data, meta };
  }
}));
