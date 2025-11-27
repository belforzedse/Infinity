/**
 * blog-comment controller
 */

import { factories } from "@strapi/strapi";
import { fetchUserWithRole, roleIsAllowed } from "../../../utils/roles";

export default factories.createCoreController("api::blog-comment.blog-comment", ({ strapi }) => ({
  // Resolve user even when auth middleware is disabled (auth: false)
  async resolveUserFromAuthHeader(ctx) {
    if (ctx.state?.user) return ctx.state.user;

    const authHeader = ctx.request?.header?.authorization || ctx.request?.headers?.authorization;
    const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) return null;

    try {
      const payload = await strapi.plugin("users-permissions").service("jwt").verify(token);
      const userId = Number(payload?.id || payload?.userId);
      if (!userId || Number.isNaN(userId)) return null;

      const user = await strapi.entityService.findOne("plugin::users-permissions.user", userId, {
        populate: ["role", "user_role", "user_info"],
      });

      if (user) {
        ctx.state.user = user;
      }
      return user;
    } catch {
      return null;
    }
  },

  async getActorRoleName(userId?: number, fallback?: any) {
    if (!userId) {
      return fallback?.user_role?.Title || fallback?.user_role?.Name || fallback?.role?.name || null;
    }

    const userWithRole = await fetchUserWithRole(strapi, userId);
    return (
      userWithRole?.user_role?.Title ||
      userWithRole?.user_role?.Name ||
      userWithRole?.role?.name ||
      null
    );
  },

  // Override find to filter by status for public users
  async find(ctx) {
    const user = (await this.resolveUserFromAuthHeader(ctx)) || ctx.state.user;
    const actorRoleName = await this.getActorRoleName(user?.id, user);
    const hasEditorRole = roleIsAllowed(actorRoleName, ["Superadmin", "Store manager", "Editor"]);

    // If not Editor+, only show approved comments
    if (!hasEditorRole) {
      ctx.query.filters = {
        ...ctx.query.filters,
        Status: "Approved"
      };
    }

    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },

  // Create comment (authenticated users only)
  async create(ctx) {
    const { user } = ctx.state;

    if (!user) {
      return ctx.unauthorized("Authentication required");
    }

    const { data } = ctx.request.body;

    // Set user and date automatically
    const commentData = {
      ...data,
      user: user.id,
      Date: new Date(),
      Status: "Pending" // All comments start as pending
    };

    const comment = await strapi.entityService.create("api::blog-comment.blog-comment", {
      data: commentData,
      populate: ["user", "blog_post"]
    });

    return { data: comment };
  },

  // Update comment (only own comments)
  async update(ctx) {
    const { user } = ctx.state;
    const { id } = ctx.params;

    if (!user) {
      return ctx.unauthorized("Authentication required");
    }

    // Get existing comment
    const existingComment = await strapi.entityService.findOne("api::blog-comment.blog-comment", id, {
      populate: ["user"]
    });

    if (!existingComment) {
      return ctx.notFound("Comment not found");
    }

    // Check if user owns the comment or has Editor+ role
    const hasEditorRole = user?.role?.name &&
      ["Superadmin", "Store manager", "Editor"].includes(user.role.name);

    if (existingComment.user.id !== user.id && !hasEditorRole) {
      return ctx.forbidden("You can only edit your own comments");
    }

    const { data } = ctx.request.body;

    // Regular users can only update content, editors can update status
    const updateData = hasEditorRole ? data : { Content: data.Content };

    const comment = await strapi.entityService.update("api::blog-comment.blog-comment", id, {
      data: updateData,
      populate: ["user", "blog_post"]
    });

    return { data: comment };
  },

  // Delete comment (only own comments or Editor+)
  async delete(ctx) {
    const { user } = ctx.state;
    const { id } = ctx.params;

    if (!user) {
      return ctx.unauthorized("Authentication required");
    }

    // Get existing comment
    const existingComment = await strapi.entityService.findOne("api::blog-comment.blog-comment", id, {
      populate: ["user"]
    });

    if (!existingComment) {
      return ctx.notFound("Comment not found");
    }

    // Check if user owns the comment or has Editor+ role
    const hasEditorRole = user?.role?.name &&
      ["Superadmin", "Store manager", "Editor"].includes(user.role.name);

    if (existingComment.user.id !== user.id && !hasEditorRole) {
      return ctx.forbidden("You can only delete your own comments");
    }

    const comment = await strapi.entityService.delete("api::blog-comment.blog-comment", id);

    return { data: comment };
  },

  // Get comments for a specific blog post
  async findByPost(ctx) {
    const { postId } = ctx.params;
    const user = (await this.resolveUserFromAuthHeader(ctx)) || ctx.state.user;
    const actorRoleName = await this.getActorRoleName(user?.id, user);
    const hasEditorRole = roleIsAllowed(actorRoleName, ["Superadmin", "Store manager", "Editor"]);

    const filters: any = { blog_post: postId };

    // If not Editor+, only show approved comments
    if (!hasEditorRole) {
      filters.Status = "Approved";
    }

    const comments = await strapi.entityService.findMany("api::blog-comment.blog-comment", {
      filters,
      sort: { createdAt: "desc" },
      populate: ["user", "blog_post"]
    });

    return { data: comments };
  },

  // Approve comment (Editor+ only)
  async approve(ctx) {
    const { user } = ctx.state;

    const hasEditorRole = user?.role?.name &&
      ["Superadmin", "Store manager", "Editor"].includes(user.role.name);

    if (!hasEditorRole) {
      return ctx.forbidden("You don't have permission to approve comments");
    }

    const { id } = ctx.params;

    const comment = await strapi.entityService.update("api::blog-comment.blog-comment", id, {
      data: { Status: "Approved" },
      populate: ["user", "blog_post"]
    });

    return { data: comment };
  },

  // Reject comment (Editor+ only)
  async reject(ctx) {
    const { user } = ctx.state;

    const hasEditorRole = user?.role?.name &&
      ["Superadmin", "Store manager", "Editor"].includes(user.role.name);

    if (!hasEditorRole) {
      return ctx.forbidden("You don't have permission to reject comments");
    }

    const { id } = ctx.params;

    const comment = await strapi.entityService.update("api::blog-comment.blog-comment", id, {
      data: { Status: "Rejected" },
      populate: ["user", "blog_post"]
    });

    return { data: comment };
  }
}));
