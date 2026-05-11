// @ts-nocheck
/**
 * post-like controller
 */

import { factories } from "@strapi/strapi";

function getPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export default factories.createCoreController("api::post-like.post-like", ({ strapi }) => ({
  async toggle(ctx) {
    try {
      const postId = ctx.request.body?.postId || ctx.request.body?.data?.post;
      if (!postId) {
        return ctx.badRequest("Post ID is required");
      }

      const pluginUserId = ctx.state.user?.id;
      if (!pluginUserId) {
        return ctx.unauthorized("Authentication required");
      }

      const post = await strapi.entityService.findOne("api::post.post", postId);
      if (!post) {
        return ctx.notFound("Post not found");
      }

      const existingLike = await strapi.db.query("api::post-like.post-like").findOne({
        where: {
          user: pluginUserId,
          post: postId,
        },
      });

      if (existingLike) {
        await strapi.entityService.delete("api::post-like.post-like", existingLike.id);
        return ctx.send({
          success: true,
          message: "Post like removed",
          isLiked: false,
        });
      }

      await strapi.entityService.create("api::post-like.post-like", {
        data: {
          user: pluginUserId,
          post: postId,
        },
      });

      return ctx.send({
        success: true,
        message: "Post liked",
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
      const pageSize = getPositiveInt(ctx.query?.pageSize, 25);
      const offset = (page - 1) * pageSize;

      const [postLikes, count] = await Promise.all([
        strapi.db.query("api::post-like.post-like").findMany({
          where: {
            user: pluginUserId,
          },
          populate: {
            post: {
              populate: {
                CoverImage: true,
                Media: true,
              },
            },
          },
          limit: pageSize,
          offset,
        }),
        strapi.db.query("api::post-like.post-like").count({
          where: {
            user: pluginUserId,
          },
        }),
      ]);

      return ctx.send({
        data: postLikes,
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
