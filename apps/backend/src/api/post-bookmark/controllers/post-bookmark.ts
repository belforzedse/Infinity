// @ts-nocheck
/**
 * post-bookmark controller
 */

import { factories } from "@strapi/strapi";

function getPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export default factories.createCoreController("api::post-bookmark.post-bookmark", ({ strapi }) => ({
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

      const existingBookmark = await strapi.db.query("api::post-bookmark.post-bookmark").findOne({
        where: {
          user: pluginUserId,
          post: postId,
        },
      });

      if (existingBookmark) {
        await strapi.entityService.delete("api::post-bookmark.post-bookmark", existingBookmark.id);
        return ctx.send({
          success: true,
          message: "Post bookmark removed",
          isBookmarked: false,
        });
      }

      await strapi.entityService.create("api::post-bookmark.post-bookmark", {
        data: {
          user: pluginUserId,
          post: postId,
        },
      });

      return ctx.send({
        success: true,
        message: "Post bookmarked",
        isBookmarked: true,
      });
    } catch (error) {
      strapi.log.error(error);
      return ctx.internalServerError("An error occurred");
    }
  },

  async getUserBookmarks(ctx) {
    try {
      const pluginUserId = ctx.state.user?.id;
      if (!pluginUserId) {
        return ctx.unauthorized("Authentication required");
      }

      const page = getPositiveInt(ctx.query?.page, 1);
      const pageSize = getPositiveInt(ctx.query?.pageSize, 25);
      const offset = (page - 1) * pageSize;

      const [postBookmarks, count] = await Promise.all([
        strapi.db.query("api::post-bookmark.post-bookmark").findMany({
          where: {
            user: pluginUserId,
          },
          populate: {
            post: {
              populate: {
                CoverImage: true,
                Media: true,
                post_likes: {
                  count: true,
                },
                post_comments: {
                  count: true,
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          limit: pageSize,
          offset,
        }),
        strapi.db.query("api::post-bookmark.post-bookmark").count({
          where: {
            user: pluginUserId,
          },
        }),
      ]);

      return ctx.send({
        data: postBookmarks,
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
