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

export default factories.createCoreController("api::post.post", () => ({
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
}));
