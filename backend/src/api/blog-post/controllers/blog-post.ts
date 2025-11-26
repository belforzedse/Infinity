/**
 * blog-post controller
 */

import { factories } from "@strapi/strapi";
import { roleIsAllowed } from "../../../utils/roles";
import { validateBlogSlug, generateUniqueBlogSlug } from "../../../utils/slugValidation";

export default factories.createCoreController("api::blog-post.blog-post", ({ strapi }) => ({
  // Override find to filter by status for public users
  async find(ctx) {
    const { user } = ctx.state;
    
    // Check if user has Editor+ role
    const hasEditorRole = user && roleIsAllowed(user.user_role?.Name, ["Superadmin", "Store manager", "Editor"]);
    
    // If not Editor+, only show published posts
    if (!hasEditorRole) {
      ctx.query.filters = {
        ...ctx.query.filters,
        Status: "Published"
      };
    }
    
    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },

  // Override findOne to filter by status for public users
  async findOne(ctx) {
    const { user } = ctx.state;
    const { id } = ctx.params;
    
    // Check if user has Editor+ role
    const hasEditorRole = user && roleIsAllowed(user.user_role?.Name, ["Superadmin", "Store manager", "Editor"]);
    
    // Get the post
    const post = await strapi.entityService.findOne("api::blog-post.blog-post", id, {
      populate: ctx.query.populate || ["blog_category", "blog_tags", "blog_author", "FeaturedImage"]
    });
    
    if (!post) {
      return ctx.notFound("Post not found");
    }
    
    // If not Editor+ and post is not published, deny access
    if (!hasEditorRole && post.Status !== "Published") {
      return ctx.notFound("Post not found");
    }
    
    // Increment view count for published posts
    if (post.Status === "Published") {
      await strapi.entityService.update("api::blog-post.blog-post", id, {
        data: { ViewCount: (post.ViewCount || 0) + 1 }
      });
    }
    
    return { data: post };
  },

  // Create post (Editor+ only)
  async create(ctx) {
    const { user } = ctx.state;
    
    if (!user || !roleIsAllowed(user.user_role?.Name, ["Superadmin", "Store manager", "Editor"])) {
      return ctx.forbidden("You don't have permission to create blog posts");
    }
    
    const { data } = ctx.request.body;
    
    // Validate or generate slug
    if (data.Slug) {
      const slugValidation = await validateBlogSlug(strapi, data.Slug);
      if (!slugValidation.isValid) {
        return ctx.badRequest(`Invalid slug: ${slugValidation.error}`);
      }
    } else if (data.Title) {
      // Generate unique slug from title
      data.Slug = await generateUniqueBlogSlug(strapi, data.Title);
    } else {
      return ctx.badRequest("Title is required to generate slug");
    }
    
    // Set author automatically if not provided
    if (!data.blog_author && user.blog_author) {
      data.blog_author = user.blog_author.id;
    }
    
    // Set published date if status is Published
    if (data.Status === "Published" && !data.PublishedAt) {
      data.PublishedAt = new Date();
    }
    
    const post = await strapi.entityService.create("api::blog-post.blog-post", {
      data,
      populate: ["blog_category", "blog_tags", "blog_author", "FeaturedImage"]
    });
    
    return { data: post };
  },

  // Update post (Editor+ only)
  async update(ctx) {
    const { user } = ctx.state;
    const { id } = ctx.params;
    
    if (!user || !roleIsAllowed(user.user_role?.Name, ["Superadmin", "Store manager", "Editor"])) {
      return ctx.forbidden("You don't have permission to update blog posts");
    }
    
    const { data } = ctx.request.body;
    
    // Validate slug if it's being changed
    if (data.Slug) {
      const slugValidation = await validateBlogSlug(strapi, data.Slug, parseInt(id));
      if (!slugValidation.isValid) {
        return ctx.badRequest(`Invalid slug: ${slugValidation.error}`);
      }
    }
    
    // Set published date if status is changing to Published
    if (data.Status === "Published" && !data.PublishedAt) {
      data.PublishedAt = new Date();
    }
    
    const post = await strapi.entityService.update("api::blog-post.blog-post", id, {
      data,
      populate: ["blog_category", "blog_tags", "blog_author", "FeaturedImage"]
    });
    
    return { data: post };
  },

  // Delete post (Editor+ only)
  async delete(ctx) {
    const { user } = ctx.state;
    
    if (!user || !roleIsAllowed(user.user_role?.Name, ["Superadmin", "Store manager", "Editor"])) {
      return ctx.forbidden("You don't have permission to delete blog posts");
    }
    
    const { id } = ctx.params;
    const post = await strapi.entityService.delete("api::blog-post.blog-post", id);
    
    return { data: post };
  },

  // Get post by slug
  async findBySlug(ctx) {
    const { slug } = ctx.params;
    const { user } = ctx.state;
    
    // Check if user has Editor+ role
    const hasEditorRole = user && roleIsAllowed(user.user_role?.Name, ["Superadmin", "Store manager", "Editor"]);
    
    const posts = await strapi.entityService.findMany("api::blog-post.blog-post", {
      filters: { Slug: slug },
      populate: ["blog_category", "blog_tags", "blog_author", "FeaturedImage"]
    });
    
    const post = posts[0];
    
    if (!post) {
      return ctx.notFound("Post not found");
    }
    
    // If not Editor+ and post is not published, deny access
    if (!hasEditorRole && post.Status !== "Published") {
      return ctx.notFound("Post not found");
    }
    
    // Increment view count for published posts
    if (post.Status === "Published") {
      await strapi.entityService.update("api::blog-post.blog-post", post.id, {
        data: { ViewCount: (post.ViewCount || 0) + 1 }
      });
    }
    
    return { data: post };
  }
}));
