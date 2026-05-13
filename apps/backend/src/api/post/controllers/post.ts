/**
 * post controller
 */

import { factories } from "@strapi/strapi";

function hasRelationValue(value: any): boolean {
  if (value === undefined) return false;
  if (value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    if (Array.isArray(value.connect)) return value.connect.length > 0;
    if (Array.isArray(value.set)) return value.set.length > 0;
    if (value.id) return true;
  }
  return Boolean(value);
}

function isExplicitlyEmptyRelation(value: any): boolean {
  if (value === null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") {
    if (Array.isArray(value.set)) return value.set.length === 0;
    if (Array.isArray(value.connect) && value.connect.length === 0) return true;
  }
  return false;
}

function toArray(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.data)) return value.data;
  return [value.data || value];
}

function relationId(value: any): number | null {
  if (!value) return null;
  const raw = typeof value === "object" ? value.id : value;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

function collectPostMediaIds(post: any): number[] {
  const ids = new Set<number>();
  const coverId = relationId(post?.CoverImage);
  if (coverId != null) ids.add(coverId);

  toArray(post?.Media).forEach((media) => {
    const id = relationId(media);
    if (id != null) ids.add(id);
  });

  return [...ids];
}

async function deleteByIds(strapi: any, uid: string, ids: number[]) {
  if (ids.length === 0) return;
  await strapi.db.query(uid).deleteMany({ where: { id: { $in: ids } } });
}

async function deleteUploadFiles(strapi: any, mediaIds: number[]) {
  if (mediaIds.length === 0) return;
  const uploadService = strapi.plugin("upload").service("upload");

  for (const mediaId of mediaIds) {
    try {
      const file = await strapi.entityService.findOne("plugin::upload.file", mediaId);
      if (file) {
        await uploadService.remove(file);
      }
    } catch (error) {
      strapi.log.error("Failed to delete post upload file", { mediaId, error });
    }
  }
}

export default factories.createCoreController("api::post.post", ({ strapi }) => ({
  async create(ctx: any) {
    const data = ctx.request.body?.data || {};

    if (!data.Title?.trim()) {
      return ctx.badRequest("Post title is required");
    }
    if (!data.Slug?.trim()) {
      return ctx.badRequest("Post slug is required");
    }
    if (!data.Description?.trim()) {
      return ctx.badRequest("Post description is required");
    }
    if (!data.Size) {
      return ctx.badRequest("Post size is required");
    }
    if (!hasRelationValue(data.CoverImage)) {
      return ctx.badRequest("Post cover image is required");
    }
    if (!hasRelationValue(data.Media)) {
      return ctx.badRequest("Post media is required");
    }

    return await super.create(ctx);
  },

  async update(ctx: any) {
    const data = ctx.request.body?.data || {};

    if (typeof data.Title === "string" && !data.Title.trim()) {
      return ctx.badRequest("Post title cannot be empty");
    }
    if (typeof data.Slug === "string" && !data.Slug.trim()) {
      return ctx.badRequest("Post slug cannot be empty");
    }
    if (typeof data.Description === "string" && !data.Description.trim()) {
      return ctx.badRequest("Post description cannot be empty");
    }
    if (Object.prototype.hasOwnProperty.call(data, "CoverImage") && isExplicitlyEmptyRelation(data.CoverImage)) {
      return ctx.badRequest("Post cover image is required");
    }
    if (Object.prototype.hasOwnProperty.call(data, "Media") && isExplicitlyEmptyRelation(data.Media)) {
      return ctx.badRequest("Post media is required");
    }

    return await super.update(ctx);
  },

  async delete(ctx: any) {
    const id = Number(ctx.params?.id);
    if (!Number.isFinite(id)) {
      return ctx.badRequest("Post ID is invalid");
    }

    const post = await strapi.entityService.findOne("api::post.post", id, {
      populate: ["CoverImage", "Media"],
    });

    if (!post) {
      return ctx.notFound("Post not found");
    }

    const mediaIds = collectPostMediaIds(post);

    const comments = await strapi.entityService.findMany("api::post-comment.post-comment", {
      filters: { post: { id } },
      fields: ["id"],
      pagination: { page: 1, pageSize: 10000 },
    });
    const commentIds = comments.map((comment: any) => comment.id).filter(Boolean);

    if (commentIds.length > 0) {
      const commentLikes = await strapi.entityService.findMany(
        "api::post-comment-like.post-comment-like",
        {
          filters: { post_comment: { id: { $in: commentIds } } },
          fields: ["id"],
          pagination: { page: 1, pageSize: 10000 },
        },
      );
      await deleteByIds(
        strapi,
        "api::post-comment-like.post-comment-like",
        commentLikes.map((like: any) => like.id).filter(Boolean),
      );
      await deleteByIds(strapi, "api::post-comment.post-comment", commentIds);
    }

    const postLikes = await strapi.entityService.findMany("api::post-like.post-like", {
      filters: { post: { id } },
      fields: ["id"],
      pagination: { page: 1, pageSize: 10000 },
    });
    await deleteByIds(
      strapi,
      "api::post-like.post-like",
      postLikes.map((like: any) => like.id).filter(Boolean),
    );

    const postBookmarks = await strapi.entityService.findMany("api::post-bookmark.post-bookmark", {
      filters: { post: { id } },
      fields: ["id"],
      pagination: { page: 1, pageSize: 10000 },
    });
    await deleteByIds(
      strapi,
      "api::post-bookmark.post-bookmark",
      postBookmarks.map((bookmark: any) => bookmark.id).filter(Boolean),
    );

    const deletedPost = await strapi.entityService.delete("api::post.post", id);
    await deleteUploadFiles(strapi, mediaIds);

    return { data: deletedPost };
  },
}));
