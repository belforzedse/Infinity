/**
 * product controller
 */

import { factories } from "@strapi/strapi";
import { roleIsAllowed, MANAGEMENT_ROLES } from "../../../utils/roles";

/**
 * Check if the user is an admin (superadmin, store manager, or editor)
 * Supports both plugin::users-permissions.user roles and local-user roles
 * @param user - The user object from ctx.state.user
 * @returns true if user is an admin, false otherwise
 */
function isAdminUser(user: any): boolean {
  if (!user) return false;
  
  // Check explicit isAdmin flag (set by auth/self endpoint)
  if (user?.isAdmin === true) {
    return true;
  }
  
  // Check local-user role (role ID 2 is admin)
  const userRoleId = user?.user_role?.id;
  if (userRoleId === 2) {
    return true;
  }
  
  // Check plugin::users-permissions role using existing utilities
  const roleName = user?.role?.name;
  if (roleName) {
    // Use existing role matching utility with MANAGEMENT_ROLES
    if (roleIsAllowed(roleName, MANAGEMENT_ROLES)) {
      return true;
    }
  }
  
  return false;
}

const PRODUCT_POPULATE = {
  CoverImage: true,
  Media: true,
  Files: true,
  product_main_category: true,
  product_other_categories: true,
  product_tags: true,
  product_reviews: {
    populate: {
      user: {
        fields: ["id", "username", "phone", "email"],
        populate: {
          user_info: {
            fields: ["FirstName", "LastName"],
          },
        },
      },
    },
  },
  product_variations: {
    populate: {
      product_variation_color: true,
      product_variation_size: true,
      product_variation_model: true,
      product_stock: true,
    },
  },
  product_faqs: true,
  product_size_helper: {
    populate: {
      Image: true,
    },
  },
} as const;

export default factories.createCoreController(
  "api::product.product",
  ({ strapi }) => ({
    /**
     * Search products by query string
     * @param {Object} ctx - The context
     * @returns {Object} The search results
     */
    async search(ctx) {
      try {
        const { q } = ctx.query;

        if (!q) {
          return ctx.badRequest("Search query (q) is required");
        }

        // Check if user is admin - admins can see all products including drafts
        const user = ctx.state.user;
        const isAdmin = isAdminUser(user);

        // Call the search service with the query parameter and admin status
        const { results, pagination } = await strapi
          .service("api::product.product")
          .search(q, { ...ctx.query, isAdmin });

        return {
          data: results,
          meta: { pagination },
        };
      } catch (error) {
        return ctx.badRequest("An error occurred while searching products", {
          error: (error as Error).message,
        });
      }
    },

    /**
     * Find a product by its slug
     * @param {Object} ctx - The context
     * @returns {Object} The product data
     */
    async findBySlug(ctx) {
      try {
        const { slug } = ctx.params;

        if (!slug) {
          return ctx.badRequest("Slug parameter is required");
        }

        // Decode the slug in case it contains Persian characters
        // Handle both encoded and already-decoded slugs
        let decodedSlug = slug;
        try {
          decodedSlug = decodeURIComponent(slug);
        } catch (e) {
          // If decoding fails, use the slug as-is (might already be decoded)
          decodedSlug = slug;
        }

        // Log for debugging
        strapi.log.info(`[Product.findBySlug] Looking up product with slug/ID: "${decodedSlug}" (original: "${slug}")`);

        // Check if user is admin - admins can see all products including drafts
        const user = ctx.state.user;
        const isAdmin = isAdminUser(user);

        // Build filters - exclude trashed products, conditionally filter by Status
        const filters: any = {
          Slug: decodedSlug,
          removedAt: { $null: true }, // Exclude trashed products
        };
        
        // Only filter by Active status for non-admin users
        if (!isAdmin) {
          filters.Status = "Active";
        }

        // Find product by slug - try exact match first
        let products = await strapi.entityService.findMany("api::product.product", {
          filters,
          populate: PRODUCT_POPULATE,
          pagination: { limit: 1 },
        });

        let product = (products as unknown[])[0];

        // If not found, try using raw SQL query for better Persian character handling
        if (!product) {
          strapi.log.info(`[Product.findBySlug] No exact match for slug: "${decodedSlug}", trying raw SQL query...`);
          try {
            const knex = strapi.db.connection;
            let rawQuery = knex('products')
              .where('slug', decodedSlug)
              .whereNull('removed_at');
            
            // Only filter by Active status for non-admin users
            if (!isAdmin) {
              rawQuery = rawQuery.where('status', 'Active');
            }
            
            const rawProducts = await rawQuery.limit(1);

            if (rawProducts.length > 0) {
              const productId = rawProducts[0].id;
              const foundFilters: any = { id: productId };
              
              // Only filter by Active status for non-admin users
              if (!isAdmin) {
                foundFilters.Status = "Active";
              }
              
              const foundProducts = await strapi.entityService.findMany("api::product.product", {
                filters: foundFilters,
                populate: PRODUCT_POPULATE,
                pagination: { limit: 1 },
              });
              product = (foundProducts as unknown[])[0];
              if (product) {
                strapi.log.info(`[Product.findBySlug] Found product via raw SQL query: ${productId}`);
              }
            }
          } catch (sqlError) {
            strapi.log.warn(`[Product.findBySlug] Raw SQL query failed:`, sqlError);
          }
        }

        if (!product) {
          strapi.log.info(`[Product.findBySlug] No product found with slug: "${decodedSlug}", trying ID fallback...`);

          // Try to find by ID as fallback for backwards compatibility
          // Use findMany to ensure consistent response format with slug lookup
          const idMatch = decodedSlug.match(/^\d+$/);
          if (idMatch) {
            const productId = parseInt(decodedSlug, 10);
            strapi.log.info(`[Product.findBySlug] Attempting ID-based lookup for product ID: ${productId}`);
            
            // Build filters for ID lookup
            const idFilters: any = {
              id: productId,
              removedAt: { $null: true }, // Exclude trashed products
            };
            
            // Only filter by Active status for non-admin users
            if (!isAdmin) {
              idFilters.Status = "Active";
            }
            
            const productsById = await strapi.entityService.findMany("api::product.product", {
              filters: idFilters,
              populate: PRODUCT_POPULATE,
              pagination: { limit: 1 },
            });

            const productById = (productsById as unknown[])[0];

            if (productById) {
              strapi.log.info(`[Product.findBySlug] Found product by ID: ${productId}`);
              return {
                data: productById,
              };
            } else {
              strapi.log.warn(`[Product.findBySlug] Product with ID ${productId} not found or is trashed`);
            }
          } else {
            strapi.log.warn(`[Product.findBySlug] Slug "${decodedSlug}" is not numeric, cannot use ID fallback`);
          }

          strapi.log.error(`[Product.findBySlug] Product not found for slug/ID: ${decodedSlug}`);
          return ctx.notFound("Product not found");
        }

        const productData = product as { id: number; Title?: string };
        strapi.log.info(`[Product.findBySlug] Successfully found product: ${productData.id} (${productData.Title || 'N/A'})`);
        return {
          data: product,
        };
      } catch (error) {
        strapi.log.error("[Product.findBySlug] Error finding product by slug:", error);
        return ctx.badRequest("An error occurred while finding the product", {
          error: (error as Error).message,
        });
      }
    },
  })
);
