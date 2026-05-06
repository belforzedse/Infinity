/**
 * story-seen service
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreService("api::story-seen.story-seen", ({ strapi }: { strapi: any }) => ({
  /**
   * Idempotent mark-seen: creates a record only if one does not already exist
   * for this (user, story) pair. Returns { created: boolean }.
   */
  async markSeen(userId: number, storyId: number): Promise<{ created: boolean }> {
    const existing = await strapi.db.query("api::story-seen.story-seen").findOne({
      where: {
        user: userId,
        story: storyId,
      },
    });

    if (existing) {
      return { created: false };
    }

    await strapi.entityService.create("api::story-seen.story-seen", {
      data: {
        user: userId,
        story: storyId,
        SeenAt: new Date(),
      },
    });

    return { created: true };
  },

  /**
   * Returns the list of story IDs the given user has already seen.
   */
  async getSeenStoryIds(userId: number): Promise<number[]> {
    const rows = await strapi.db.query("api::story-seen.story-seen").findMany({
      where: { user: userId },
      populate: { story: { select: ["id"] } },
    });

    return rows
      .map((row: { story?: { id?: number } }) => row.story?.id)
      .filter((id: number | undefined): id is number => typeof id === "number");
  },
}));
