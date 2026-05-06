/**
 * story controller
 */

import { factories } from "@strapi/strapi";
import { fetchUserWithRole, roleIsAllowed } from "../../../utils/roles";

async function getActorRoleName(strapi: any, userId?: number): Promise<string | null> {
  if (!userId) return null;
  const userWithRole = await fetchUserWithRole(strapi, userId);
  return (
    userWithRole?.user_role?.Title ||
    userWithRole?.user_role?.Name ||
    userWithRole?.role?.name ||
    null
  );
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateUniqueStorySlug(
  strapi: any,
  title: string,
  excludeId?: number
): Promise<string> {
  const baseSlug = slugify(title) || "story";
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await strapi.db.query("api::story.story").findOne({
      where: {
        Slug: candidate,
        ...(excludeId ? { id: { $ne: excludeId } } : {}),
      },
      select: ["id"],
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export default factories.createCoreController("api::story.story", ({ strapi }: { strapi: any }) => ({

  async find(ctx: any) {
    const { user } = ctx.state;
    const actorRoleName = await getActorRoleName(strapi, user?.id);
    const hasAdminRole = roleIsAllowed(actorRoleName, ["Superadmin", "Store manager"]);

    if (!hasAdminRole) {
      ctx.query.filters = {
        ...ctx.query.filters,
        IsActive: true,
      };
    }

    return await super.find(ctx);
  },

  async findOne(ctx: any) {
    const { user } = ctx.state;
    const { id } = ctx.params;
    const actorRoleName = await getActorRoleName(strapi, user?.id);
    const hasAdminRole = roleIsAllowed(actorRoleName, ["Superadmin", "Store manager"]);

    const story = await strapi.entityService.findOne("api::story.story", id, {
      populate: { Media: true, Thumbnail: true },
    });

    if (!story) {
      return ctx.notFound("استوری یافت نشد.");
    }

    if (!hasAdminRole && !story.IsActive) {
      return ctx.notFound("استوری یافت نشد.");
    }

    return { data: story };
  },

  async create(ctx: any) {
    const { user } = ctx.state;
    if (user) {
      const actorRoleName = await getActorRoleName(strapi, user.id);
      if (!roleIsAllowed(actorRoleName, ["Superadmin", "Store manager"])) {
        return ctx.forbidden("شما مجاز به ایجاد استوری نیستید.");
      }
    }

    const data = ctx.request?.body?.data as { Title?: string; Slug?: string } | undefined;
    if (!data?.Title?.trim()) {
      return ctx.badRequest("عنوان استوری الزامی است.");
    }
    if (!data.Slug) {
      data.Slug = await generateUniqueStorySlug(strapi, data.Title);
    }

    return await super.create(ctx);
  },

  async update(ctx: any) {
    const { user } = ctx.state;
    if (user) {
      const actorRoleName = await getActorRoleName(strapi, user.id);
      if (!roleIsAllowed(actorRoleName, ["Superadmin", "Store manager"])) {
        return ctx.forbidden("شما مجاز به ویرایش استوری نیستید.");
      }
    }

    const storyId = Number(ctx.params?.id);
    const data = ctx.request?.body?.data as { Title?: string; Slug?: string } | undefined;
    if (data && !data.Slug && data.Title?.trim()) {
      data.Slug = await generateUniqueStorySlug(strapi, data.Title, storyId);
    }

    return await super.update(ctx);
  },

  async delete(ctx: any) {
    const { user } = ctx.state;
    const actorRoleName = await getActorRoleName(strapi, user?.id);
    if (!user || !roleIsAllowed(actorRoleName, ["Superadmin", "Store manager"])) {
      return ctx.forbidden("شما مجاز به حذف استوری نیستید.");
    }
    return await super.delete(ctx);
  },

  /**
   * GET /api/stories/active
   * Returns active stories within their scheduled window, sorted by SortOrder.
   */
  async getActive(ctx: any) {
    try {
      const now = new Date();

      const stories = await strapi.entityService.findMany("api::story.story", {
        filters: {
          IsActive: true,
          $or: [
            { StartAt: { $null: true } },
            { StartAt: { $lte: now } },
          ],
          $and: [
            {
              $or: [
                { EndAt: { $null: true } },
                { EndAt: { $gte: now } },
              ],
            },
          ],
        },
        populate: { Media: true, Thumbnail: true },
        sort: { SortOrder: "asc" },
        limit: 50,
      });

      return ctx.send({ data: stories });
    } catch (error) {
      strapi.log.error("Error fetching active stories", { error: (error as Error)?.message });
      return ctx.internalServerError("خطا در دریافت استوری‌ها. دوباره تلاش کنید.");
    }
  },
}));
