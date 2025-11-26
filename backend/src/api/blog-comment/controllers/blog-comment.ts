/**
 * blog-comment controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController("api::blog-comment.blog-comment", ({ strapi }) => ({
  // Override find to filter by status for public users
  async find(ctx) {
    const { user } = ctx.state;

    // Check if user has Editor+ role
    const hasEditorRole = user?.role?.name &&
      ["Superadmin", "Store manager", "Editor"].includes(user.role.name);

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
    const { user } = ctx.state;

    // Check if user has Editor+ role
    const hasEditorRole = user?.role?.name &&
      ["Superadmin", "Store manager", "Editor"].includes(user.role.name);

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
