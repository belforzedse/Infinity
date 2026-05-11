// @ts-nocheck
/**
 * post-comment controller
 */

import { factories } from "@strapi/strapi";
import { fetchUserWithRole, roleIsAllowed } from "../../../utils/roles";
import { resolveUserDisplayName } from "../../../utils/blog-helpers";
import { normalizePopulateQuery } from "../../../utils/normalizePopulate";

const MANAGEMENT_ROLES = ["Superadmin", "Store manager"];

function relationId(value: any): number | string | null {
  if (!value) return null;
  if (typeof value === "number" || typeof value === "string") return value;
  if (value.id) return value.id;
  if (Array.isArray(value.connect) && value.connect.length > 0) {
    const first = value.connect[0];
    return typeof first === "object" ? first.id : first;
  }
  return null;
}

function safeCommentPopulate() {
  return normalizePopulateQuery({
    user: true,
    post: true,
    parent_comment: true,
  });
}

export default factories.createCoreController("api::post-comment.post-comment", ({ strapi }) => ({
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

  async hasManagementRole(user?: any) {
    const actorRoleName = await this.getActorRoleName(user?.id, user);
    return roleIsAllowed(actorRoleName, MANAGEMENT_ROLES);
  },

  async find(ctx) {
    if (!ctx.query) ctx.query = {};

    const user = (await this.resolveUserFromAuthHeader(ctx)) || ctx.state.user;
    const hasManagementRole = await this.hasManagementRole(user);

    if (!hasManagementRole) {
      ctx.query.filters = {
        ...ctx.query.filters,
        Status: "Approved",
      };
      ctx.query.populate = safeCommentPopulate();
    } else if (ctx.query?.populate) {
      ctx.query.populate = normalizePopulateQuery(ctx.query.populate);
    }

    return await super.find(ctx);
  },

  async findOne(ctx) {
    const user = (await this.resolveUserFromAuthHeader(ctx)) || ctx.state.user;
    const hasManagementRole = await this.hasManagementRole(user);
    const { id } = ctx.params;

    const comment = await strapi.entityService.findOne("api::post-comment.post-comment", id, {
      populate: ["user", "post", "parent_comment"],
    });

    if (!comment) {
      return ctx.notFound("Comment not found");
    }

    if (!hasManagementRole && comment.Status !== "Approved") {
      return ctx.notFound("Comment not found");
    }

    return { data: comment };
  },

  async create(ctx) {
    const { user } = ctx.state;
    if (!user) {
      return ctx.unauthorized("Authentication required");
    }

    const data = ctx.request.body?.data || {};
    if (!data.Content?.trim()) {
      return ctx.badRequest("Comment content is required");
    }

    const postId = relationId(data.post);
    if (!postId) {
      return ctx.badRequest("Post ID is required");
    }

    const post = await strapi.entityService.findOne("api::post.post", postId);
    if (!post) {
      return ctx.notFound("Post not found");
    }

    const parentCommentId = relationId(data.parent_comment);
    if (parentCommentId) {
      const parentComment = await strapi.entityService.findOne("api::post-comment.post-comment", parentCommentId, {
        populate: ["post"],
      });
      if (!parentComment) {
        return ctx.notFound("Parent comment not found");
      }
      if (String(parentComment.post?.id || parentComment.post) !== String(postId)) {
        return ctx.badRequest("Parent comment must belong to the same post");
      }
    }

    const populatedUser = await fetchUserWithRole(strapi, user.id);
    const commentAuthor = populatedUser || user;
    const resolvedName = resolveUserDisplayName(commentAuthor);

    const comment = await strapi.entityService.create("api::post-comment.post-comment", {
      data: {
        Content: data.Content,
        post: postId,
        parent_comment: parentCommentId || undefined,
        user: user.id,
        Date: new Date(),
        Status: "Pending",
        Name: resolvedName,
      },
      populate: ["user", "post", "parent_comment"],
    });

    return { data: comment };
  },

  async update(ctx) {
    const { user } = ctx.state;
    const { id } = ctx.params;

    if (!user) {
      return ctx.unauthorized("Authentication required");
    }

    const existingComment = await strapi.entityService.findOne("api::post-comment.post-comment", id, {
      populate: ["user"],
    });

    if (!existingComment) {
      return ctx.notFound("Comment not found");
    }

    const hasManagementRole = await this.hasManagementRole(user);
    const ownsComment = String(existingComment.user?.id) === String(user.id);

    if (!ownsComment && !hasManagementRole) {
      return ctx.forbidden("You can only edit your own comments");
    }

    const data = ctx.request.body?.data || {};
    if (!hasManagementRole && !data.Content?.trim()) {
      return ctx.badRequest("Comment content is required");
    }

    const updateData = hasManagementRole
      ? data
      : {
          Content: data.Content,
          Status: "Pending",
        };

    const comment = await strapi.entityService.update("api::post-comment.post-comment", id, {
      data: updateData,
      populate: ["user", "post", "parent_comment"],
    });

    return { data: comment };
  },

  async delete(ctx) {
    const { user } = ctx.state;
    const { id } = ctx.params;

    if (!user) {
      return ctx.unauthorized("Authentication required");
    }

    const existingComment = await strapi.entityService.findOne("api::post-comment.post-comment", id, {
      populate: ["user"],
    });

    if (!existingComment) {
      return ctx.notFound("Comment not found");
    }

    const hasManagementRole = await this.hasManagementRole(user);
    const ownsComment = String(existingComment.user?.id) === String(user.id);

    if (!ownsComment && !hasManagementRole) {
      return ctx.forbidden("You can only delete your own comments");
    }

    const comment = await strapi.entityService.delete("api::post-comment.post-comment", id);
    return { data: comment };
  },

  async findByPost(ctx) {
    const { postId } = ctx.params;
    const user = (await this.resolveUserFromAuthHeader(ctx)) || ctx.state.user;
    const hasManagementRole = await this.hasManagementRole(user);

    const filters: any = { post: postId };
    if (!hasManagementRole) {
      filters.Status = "Approved";
    }

    const comments = await strapi.entityService.findMany("api::post-comment.post-comment", {
      filters,
      sort: { createdAt: "desc" },
      populate: ["user", "post", "parent_comment"],
    });

    return { data: comments };
  },

  async approve(ctx) {
    const { user } = ctx.state;
    if (!(await this.hasManagementRole(user))) {
      return ctx.forbidden("You don't have permission to approve comments");
    }

    const { id } = ctx.params;
    const comment = await strapi.entityService.update("api::post-comment.post-comment", id, {
      data: { Status: "Approved" },
      populate: ["user", "post", "parent_comment"],
    });

    return { data: comment };
  },

  async reject(ctx) {
    const { user } = ctx.state;
    if (!(await this.hasManagementRole(user))) {
      return ctx.forbidden("You don't have permission to reject comments");
    }

    const { id } = ctx.params;
    const comment = await strapi.entityService.update("api::post-comment.post-comment", id, {
      data: { Status: "Rejected" },
      populate: ["user", "post", "parent_comment"],
    });

    return { data: comment };
  },
}));
