// @ts-nocheck
/**
 * post-comment-like controller
 */

import { factories } from "@strapi/strapi";
import { fetchUserWithRole } from "../../../utils/roles";
import { resolveUserDisplayName } from "../../../utils/blog-helpers";

function getPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export default factories.createCoreController("api::post-comment-like.post-comment-like", ({ strapi }) => ({
  async toggle(ctx) {
    try {
      const commentId = ctx.request.body?.commentId || ctx.request.body?.postCommentId || ctx.request.body?.data?.post_comment;
      if (!commentId) {
        return ctx.badRequest("Comment ID is required");
      }

      const pluginUserId = ctx.state.user?.id;
      if (!pluginUserId) {
        return ctx.unauthorized("Authentication required");
      }

      const comment = await strapi.entityService.findOne("api::post-comment.post-comment", commentId, {
        populate: ["user", "post"],
      });
      if (!comment) {
        return ctx.notFound("Comment not found");
      }
      if (comment.Status !== "Approved") {
        return ctx.notFound("Comment not found");
      }

      const existingLike = await strapi.db.query("api::post-comment-like.post-comment-like").findOne({
        where: {
          user: pluginUserId,
          post_comment: commentId,
        },
      });

      if (existingLike) {
        await strapi.entityService.delete("api::post-comment-like.post-comment-like", existingLike.id);
        return ctx.send({
          success: true,
          message: "Comment like removed",
          isLiked: false,
        });
      }

      await strapi.entityService.create("api::post-comment-like.post-comment-like", {
        data: {
          user: pluginUserId,
          post_comment: commentId,
        },
      });

      if (comment?.user?.id && comment?.post?.id) {
        const populatedLiker = await fetchUserWithRole(strapi, pluginUserId);
        const likerName = resolveUserDisplayName(populatedLiker || ctx.state.user);
        await strapi.service("api::notification.notification").createCommentLiked({
          recipientId: Number(comment.user.id),
          actorId: Number(pluginUserId),
          actorName: likerName,
          postId: Number(comment.post.id),
        });
      }

      return ctx.send({
        success: true,
        message: "Comment liked",
        isLiked: true,
      });
    } catch (error) {
      strapi.log.error(error);
      return ctx.internalServerError("An error occurred");
    }
  },

  async getUserLikes(ctx) {
    try {
      const pluginUserId = ctx.state.user?.id;
      if (!pluginUserId) {
        return ctx.unauthorized("Authentication required");
      }

      const page = getPositiveInt(ctx.query?.page, 1);
      const pageSize = getPositiveInt(ctx.query?.pageSize, 100);
      const offset = (page - 1) * pageSize;

      const [commentLikes, count] = await Promise.all([
        strapi.db.query("api::post-comment-like.post-comment-like").findMany({
          where: {
            user: pluginUserId,
          },
          populate: {
            post_comment: true,
          },
          limit: pageSize,
          offset,
        }),
        strapi.db.query("api::post-comment-like.post-comment-like").count({
          where: {
            user: pluginUserId,
          },
        }),
      ]);

      return ctx.send({
        data: commentLikes,
        meta: {
          pagination: {
            page,
            pageSize,
            pageCount: Math.ceil(count / pageSize),
            total: count,
          },
        },
      });
    } catch (error) {
      strapi.log.error(error);
      return ctx.internalServerError("An error occurred");
    }
  },
}));
