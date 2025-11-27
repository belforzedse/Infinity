/**
 * blog-post controller
 */

import { factories } from "@strapi/strapi";
import { fetchUserWithRole, roleIsAllowed } from "../../../utils/roles";
import { validateBlogSlug, generateUniqueBlogSlug } from "../../../utils/slugValidation";
import { enrichBlogPostsWithAuthorNames } from "../../../utils/blog-helpers";
import { normalizePopulateQuery } from "../../../utils/normalizePopulate";

const blogPostController = factories.createCoreController("api::blog-post.blog-post" as any, ({ strapi }: { strapi: any }) => ({
  ensureDefaultPopulate(ctx: any, _populate?: any) {
    const defaultPopulate = {
      blog_category: true,
      blog_tags: true,
      blog_author: {
        populate: {
          Avatar: true,
        },
      },
      FeaturedImage: true,
    };
    if (!ctx.query) ctx.query = {};
    // Always ensure blog_author fields (including avatar) are available
    const mergedPopulate = {
      ...defaultPopulate,
      ...(ctx.query.populate || {}),
      blog_author: {
        populate: {
          Avatar: true,
        },
      },
    };
    ctx.query.populate = normalizePopulateQuery(mergedPopulate);
  },

  async resolveUserFromAuthHeader(ctx: any) {
    if (ctx.state?.user) return ctx.state.user;

    const authHeader = ctx.request?.header?.authorization || ctx.request?.headers?.authorization;
    const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) return null;

    try {
      const payload = await strapi.plugin("users-permissions").service("jwt").verify(token);
      const userId = Number(payload?.id || payload?.userId);
      if (!userId || Number.isNaN(userId)) return null;

      const user = await strapi.entityService.findOne("plugin::users-permissions.user", userId, {
        populate: ["role", "user_role", "user_info"],
      });
      if (user) {
        ctx.state.user = user;
      }
      return user;
    } catch {
      return null;
    }
  },

  async getOrCreateAuthorForUser(user: any): Promise<any> {
    if (!user) return null;


    // Get the user's actual name from user_info (same as other admin interfaces)
    const firstName = user.user_info?.FirstName ?? "";
    const lastName = user.user_info?.LastName ?? "";
    const fullName = `${firstName} ${lastName}`.trim();

    // Use the actual name, fallback to username if no name
    const authorName = fullName || user.username || user.email || `user-${user.id}`;


    // Try to find an existing blog-author by users_permissions_user relation
    const existing = await strapi.entityService.findMany("api::blog-author.blog-author", {
      filters: {
        users_permissions_user: user.id,
      },
      populate: {
        users_permissions_user: {
          populate: {
            user_info: "*",
          },
        },
      },
      limit: 1,
    });


    if (existing && existing.length > 0) {
      const existingAuthor = existing[0];
      // Update the Name if it's different from the user's actual name
      if (fullName && existingAuthor.Name !== fullName) {

        await strapi.entityService.update("api::blog-author.blog-author", existingAuthor.id, {
          data: {
            Name: fullName,
            Email: user.email,
          } as any,
        });
        existingAuthor.Name = fullName;
      }


      return existingAuthor;
    }

    // Create a new author entry with proper users_permissions_user relation

    try {
      const newAuthor = await strapi.entityService.create("api::blog-author.blog-author", {
        data: {
          Name: authorName,
          Email: user.email,
          users_permissions_user: user.id, // Link to users-permissions user, not local_user
        },
        populate: {
          users_permissions_user: {
            populate: {
              user_info: "*",
            },
          },
        },
      });


      return newAuthor;
    } catch (error) {
      throw error;
    }
  },

  async getActorRoleName(userId?: number, fallback?: any): Promise<string | null> {
    if (!userId) {
      return fallback?.user_role?.Title || fallback?.user_role?.Name || fallback?.role?.name || null;
    }

    const userWithRole = await fetchUserWithRole(strapi, userId);
    return (
      userWithRole?.user_role?.Title ||
      userWithRole?.user_role?.Name ||
      userWithRole?.role?.name ||
      null
    );
  },

  // Override find to filter by status for public users
  async find(ctx: any) {
    (this as any).ensureDefaultPopulate(ctx);

    const user = (await (this as any).resolveUserFromAuthHeader(ctx)) || ctx.state.user;

    console.log("🔍 Original populate from frontend:", JSON.stringify(ctx.query.populate, null, 2));

    const actorRoleName = await this.getActorRoleName(user?.id, user);
    const hasEditorRole = roleIsAllowed(actorRoleName, ["Superadmin", "Store manager", "Editor"]);

    // If not Editor+, only show published posts
    if (!hasEditorRole) {
      ctx.query.filters = {
        ...ctx.query.filters,
        Status: "Published"
      };
    }

    const sanitizedQuery = await (this as any).sanitizeQuery(ctx);

    // Use entityService directly to bypass sanitization issues
    const results = await strapi.entityService.findMany("api::blog-post.blog-post", {
      ...sanitizedQuery,
      populate: ctx.query.populate,
    });

    // Calculate pagination manually since we're using entityService
    const total = await strapi.entityService.count("api::blog-post.blog-post", {
      filters: sanitizedQuery.filters,
    });

    const page = sanitizedQuery.pagination?.page || 1;
    const pageSize = sanitizedQuery.pagination?.pageSize || 25;
    const pageCount = Math.ceil(total / pageSize);

    const pagination = {
      page,
      pageSize,
      pageCount,
      total,
    };

    const enrichedResults = enrichBlogPostsWithAuthorNames(results);

    const response = await (this as any).transformResponse(enrichedResults, {
      pagination,
    }) as any;

    const postsCount = response?.data?.length || 0;
    console.log("📊 Blog post find result:", postsCount, "posts");
    if (postsCount > 0) {
      const firstPost = response.data?.[0];
      const firstAuthor = firstPost?.attributes?.blog_author || firstPost?.blog_author;
      console.log("👤 Author in response:", firstAuthor ? "EXISTS" : "MISSING");
      if (firstAuthor) {
        console.log("📝 Author name:", firstAuthor.ResolvedAuthorName || firstAuthor.Name);
      }
    }

    return response;
  },

  // Override findOne to filter by status for public users
  async findOne(ctx: any) {
    const user = (await (this as any).resolveUserFromAuthHeader(ctx)) || ctx.state.user;
    const { id } = ctx.params;
    (this as any).ensureDefaultPopulate(ctx);

    const actorRoleName = await this.getActorRoleName(user?.id, user);
    const hasEditorRole = roleIsAllowed(actorRoleName, ["Superadmin", "Store manager", "Editor"]);

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

    // Increment view count for published posts (only for non-admin users)
    if (post.Status === "Published" && !hasEditorRole) {
      await strapi.entityService.update("api::blog-post.blog-post", id, {
        data: { ViewCount: (post.ViewCount || 0) + 1 } as any
      });
    }

    return { data: post };
  },

  // Create post (Editor+ only)
  async create(ctx: any) {
    const { user } = ctx.state;

    const actorRoleName = await this.getActorRoleName(user?.id, user);
    if (!user || !roleIsAllowed(actorRoleName, ["Superadmin", "Store manager", "Editor"])) {
      return ctx.forbidden("You don't have permission to create blog posts");
    }

    // Fetch user with user_info populated
    const fullUser = await strapi.entityService.findOne("plugin::users-permissions.user", user.id, {
      populate: {
        user_info: "*",
        role: true,
      },
    });

    if (!fullUser) {
      return ctx.forbidden("User not found");
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
    if (!data.blog_author) {
      const author = await (this as any).getOrCreateAuthorForUser(fullUser);
      if (author) {
        data.blog_author = author.id;
      }
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
  async update(ctx: any) {
    const { user } = ctx.state;
    const { id } = ctx.params;

    const actorRoleName = await this.getActorRoleName(user?.id, user);
    if (!user || !roleIsAllowed(actorRoleName, ["Superadmin", "Store manager", "Editor"])) {
      return ctx.forbidden("You don't have permission to update blog posts");
    }

    // Fetch user with user_info populated
    const fullUser = await strapi.entityService.findOne("plugin::users-permissions.user", user.id, {
      populate: {
        user_info: "*",
        role: true,
      },
    });

    if (!fullUser) {
      return ctx.forbidden("User not found");
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

    // Auto-assign author if missing
    if (!data.blog_author) {
      const author = await (this as any).getOrCreateAuthorForUser(fullUser);
      if (author) {
        data.blog_author = author.id;
      }
    }

    const post = await strapi.entityService.update("api::blog-post.blog-post", id, {
      data,
      populate: ["blog_category", "blog_tags", "blog_author", "FeaturedImage"]
    });

    return { data: post };
  },

  // Delete post (Editor+ only)
  async delete(ctx: any) {
    const { user } = ctx.state;

    const actorRoleName = await this.getActorRoleName(user?.id, user);
    if (!user || !roleIsAllowed(actorRoleName, ["Superadmin", "Store manager", "Editor"])) {
      return ctx.forbidden("You don't have permission to delete blog posts");
    }

    const { id } = ctx.params;
    const post = await strapi.entityService.delete("api::blog-post.blog-post", id);

    return { data: post };
  },


  // Get post by slug
  async findBySlug(ctx: any) {
    const { slug } = ctx.params;
    const user = (await (this as any).resolveUserFromAuthHeader(ctx)) || ctx.state.user;

    const actorRoleName = await this.getActorRoleName(user?.id, user);
    const hasEditorRole = roleIsAllowed(actorRoleName, ["Superadmin", "Store manager", "Editor"]);

    const posts = await strapi.entityService.findMany("api::blog-post.blog-post", {
      filters: { Slug: slug },
      populate: {
        blog_category: true,
        blog_tags: true,
        blog_author: {
          populate: {
            Avatar: true,
          },
        },
        FeaturedImage: true,
      },
    });

    const post = posts[0];

    if (!post) {
      return ctx.notFound("Post not found");
    }

    // If not Editor+ and post is not published, deny access
    if (!hasEditorRole && post.Status !== "Published") {
      return ctx.notFound("Post not found");
    }

    // Increment view count for published posts (only for non-admin users)
    if (post.Status === "Published" && !hasEditorRole) {
      await strapi.entityService.update("api::blog-post.blog-post", post.id, {
        data: { ViewCount: (post.ViewCount || 0) + 1 } as any
      });
    }

    return { data: post };
  }
}));

export default blogPostController;
