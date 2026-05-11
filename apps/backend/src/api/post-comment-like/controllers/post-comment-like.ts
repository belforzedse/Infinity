// @ts-nocheck
/**
 * post-comment-like controller
 */

import { factories } from "@strapi/strapi";

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

      const comment = await strapi.entityService.findOne("api::post-comment.post-comment", commentId);
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
}));
