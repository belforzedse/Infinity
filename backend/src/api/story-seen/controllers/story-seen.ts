/**
 * story-seen controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::story-seen.story-seen",
  ({ strapi }: { strapi: any }) => ({
    /**
     * POST /api/story-seens/mark
     * Body: { storyId: number }
     * Idempotent — safe to call multiple times for the same story.
     */
    async markSeen(ctx: any) {
      const pluginUserId: number | undefined = ctx.state.user?.id;
      if (!pluginUserId) {
        return ctx.unauthorized("برای ثبت مشاهده باید وارد حساب کاربری خود شوید.");
      }

      const { storyId } = ctx.request.body as { storyId?: unknown };

      if (!storyId || typeof storyId !== "number") {
        return ctx.badRequest("شناسه استوری معتبر نیست.");
      }

      const story = await strapi.entityService.findOne("api::story.story", storyId);
      if (!story) {
        return ctx.notFound("استوری یافت نشد.");
      }

      try {
        const storySeenService = strapi.service("api::story-seen.story-seen") as {
          markSeen: (userId: number, storyId: number) => Promise<{ created: boolean }>;
        };
        const result = await storySeenService.markSeen(pluginUserId, storyId);
        return ctx.send({ success: true, created: result.created });
      } catch (error) {
        strapi.log.error("Error marking story seen", {
          userId: pluginUserId,
          storyId,
          error: (error as Error)?.message,
        });
        return ctx.internalServerError("خطا در ثبت مشاهده. دوباره تلاش کنید.");
      }
    },

    /**
     * GET /api/story-seens/mine
     * Returns an array of story IDs the authenticated user has already seen.
     */
    async getMine(ctx: any) {
      const pluginUserId: number | undefined = ctx.state.user?.id;
      if (!pluginUserId) {
        return ctx.unauthorized("برای دریافت لیست استوری‌های مشاهده‌شده باید وارد شوید.");
      }

      try {
        const storySeenService = strapi.service("api::story-seen.story-seen") as {
          getSeenStoryIds: (userId: number) => Promise<number[]>;
        };
        const ids = await storySeenService.getSeenStoryIds(pluginUserId);
        return ctx.send({ data: ids });
      } catch (error) {
        strapi.log.error("Error fetching seen story ids", {
          userId: pluginUserId,
          error: (error as Error)?.message,
        });
        return ctx.internalServerError("خطا در دریافت استوری‌های مشاهده‌شده. دوباره تلاش کنید.");
      }
    },
  })
);
