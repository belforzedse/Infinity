/**
 * Migration `add-product-seen-count`
 *
 * Adds indexes to product_views table for efficient 24h queries
 * Note: SeenCount field is added automatically by Strapi schema sync in development.
 * This migration ensures indexes exist and sets defaults for existing records in production.
 */

module.exports = {
  async up(knex) {
    // Ensure SeenCount field exists and has default value (for production deployments)
    // In development, Strapi auto-syncs schema changes, but production needs explicit migration
    const productsTableExists = await knex.schema.hasTable("products");
    if (productsTableExists) {
      const hasSeenCount = await knex.schema.hasColumn("products", "seen_count");
      if (!hasSeenCount) {
        try {
          await knex.schema.table("products", (table) => {
            table.integer("seen_count").defaultTo(0).notNullable();
          });
          console.log("✓ Added seen_count field to products table (production migration)");
        } catch (error) {
          console.log("Error adding seen_count field:", error.message);
        }
      } else {
        // Field exists, just ensure existing records have default value
        try {
          await knex("products").update({ seen_count: 0 }).whereNull("seen_count");
          console.log("✓ Ensured default seen_count = 0 for existing products");
        } catch (error) {
          console.log("Error setting default seen_count:", error.message);
        }
      }
    }

    // Add indexes to product_views table
    const productViewsTableExists = await knex.schema.hasTable("product_views");
    if (!productViewsTableExists) {
      console.warn(
        "Skipping product_views indexes migration because product_views table does not exist."
      );
      return;
    }

    // Helper function to check if index exists (PostgreSQL)
    const indexExists = async (indexName) => {
      const result = await knex.raw(
        `SELECT 1 FROM pg_indexes WHERE indexname = ? LIMIT 1`,
        [indexName]
      );
      return result.rows.length > 0;
    };

    // Add index on product_id for efficient product lookups
    if (!(await indexExists("product_views_product_id_idx"))) {
      try {
        await knex.schema.table("product_views", (table) => {
          table.index(["product_id"], "product_views_product_id_idx");
        });
        console.log("✓ Added index on product_views.product_id");
      } catch (error) {
        console.log("Index product_views_product_id_idx already exists or error:", error.message);
      }
    }

    // Add index on viewed_at for efficient 24h queries
    if (!(await indexExists("product_views_viewed_at_idx"))) {
      try {
        await knex.schema.table("product_views", (table) => {
          table.index(["viewed_at"], "product_views_viewed_at_idx");
        });
        console.log("✓ Added index on product_views.viewed_at");
      } catch (error) {
        console.log("Index product_views_viewed_at_idx already exists or error:", error.message);
      }
    }

    // Add composite index on product_id + viewed_at for efficient 24h product queries
    if (!(await indexExists("product_views_product_viewed_at_idx"))) {
      try {
        await knex.schema.table("product_views", (table) => {
          table.index(["product_id", "viewed_at"], "product_views_product_viewed_at_idx");
        });
        console.log("✓ Added composite index on product_views (product_id, viewed_at)");
      } catch (error) {
        console.log("Index product_views_product_viewed_at_idx already exists or error:", error.message);
      }
    }
  },

  async down(knex) {
    // Remove indexes from product_views table
    const productViewsTableExists = await knex.schema.hasTable("product_views");
    if (productViewsTableExists) {
      try {
        await knex.schema.table("product_views", (table) => {
          table.dropIndex([], "product_views_product_viewed_at_idx");
          table.dropIndex([], "product_views_viewed_at_idx");
          table.dropIndex([], "product_views_product_id_idx");
        });
        console.log("✓ Removed product_views indexes");
      } catch (error) {
        console.log("Error removing indexes:", error.message);
      }
    }

    // Note: Don't remove seen_count field in down migration - let Strapi handle schema changes
    // Only remove indexes
  },
};
