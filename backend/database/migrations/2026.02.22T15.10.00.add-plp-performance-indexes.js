/**
 * Migration: add-plp-performance-indexes
 *
 * Adds targeted indexes for PLP (/products + /products/plp) query patterns.
 * Focuses on status/removal/category filters and variation stock/price filters.
 */

module.exports = {
  async up(knex) {
    const tableExists = async (tableName) => {
      try {
        return await knex.schema.hasTable(tableName);
      } catch {
        return false;
      }
    };

    const columnExists = async (tableName, columnName) => {
      try {
        const result = await knex.raw(
          `SELECT 1
             FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = ?
              AND column_name = ?
            LIMIT 1`,
          [tableName, columnName],
        );
        return result.rows.length > 0;
      } catch {
        return false;
      }
    };

    const indexExists = async (tableName, indexName) => {
      try {
        const result = await knex.raw(
          `SELECT 1
             FROM pg_indexes
            WHERE schemaname = current_schema()
              AND tablename = ?
              AND indexname = ?
            LIMIT 1`,
          [tableName, indexName],
        );
        return result.rows.length > 0;
      } catch {
        return false;
      }
    };

    if (await tableExists("products")) {
      const hasStatus = await columnExists("products", "status");
      const hasRemovedAt = await columnExists("products", "removed_at");
      const hasCreatedAt = await columnExists("products", "created_at");
      const hasMainCategory = await columnExists("products", "product_main_category_id");

      if (hasStatus && hasRemovedAt && hasCreatedAt && !(await indexExists("products", "idx_products_plp_status_removed_created"))) {
        await knex.raw(
          `CREATE INDEX IF NOT EXISTS idx_products_plp_status_removed_created
             ON products (status, removed_at, created_at DESC)`,
        );
        console.log("✓ Added idx_products_plp_status_removed_created");
      }

      if (hasMainCategory && hasStatus && hasRemovedAt && !(await indexExists("products", "idx_products_plp_category_status_removed"))) {
        await knex.raw(
          `CREATE INDEX IF NOT EXISTS idx_products_plp_category_status_removed
             ON products (product_main_category_id, status, removed_at)`,
        );
        console.log("✓ Added idx_products_plp_category_status_removed");
      }
    }

    if (await tableExists("product_variations")) {
      const hasProductId = await columnExists("product_variations", "product_id");
      const hasPublished = await columnExists("product_variations", "is_published");
      const hasPrice = await columnExists("product_variations", "price");
      const hasDiscountPrice = await columnExists("product_variations", "discount_price");

      if (hasProductId && hasPublished && hasPrice && !(await indexExists("product_variations", "idx_product_variations_plp_product_pub_price"))) {
        await knex.raw(
          `CREATE INDEX IF NOT EXISTS idx_product_variations_plp_product_pub_price
             ON product_variations (product_id, is_published, price)`,
        );
        console.log("✓ Added idx_product_variations_plp_product_pub_price");
      }

      if (hasProductId && hasDiscountPrice && !(await indexExists("product_variations", "idx_product_variations_plp_product_discount"))) {
        await knex.raw(
          `CREATE INDEX IF NOT EXISTS idx_product_variations_plp_product_discount
             ON product_variations (product_id, discount_price)`,
        );
        console.log("✓ Added idx_product_variations_plp_product_discount");
      }
    }

    if (await tableExists("product_stocks")) {
      const hasVariationId = await columnExists("product_stocks", "product_variation_id");
      const hasCount = await columnExists("product_stocks", "count");

      if (hasVariationId && hasCount && !(await indexExists("product_stocks", "idx_product_stocks_plp_variation_count"))) {
        await knex.raw(
          `CREATE INDEX IF NOT EXISTS idx_product_stocks_plp_variation_count
             ON product_stocks (product_variation_id, count)`,
        );
        console.log("✓ Added idx_product_stocks_plp_variation_count");
      }
    }

    console.log("✅ PLP performance indexes migration completed");
  },

  async down(knex) {
    const dropIndex = async (indexName) => {
      try {
        await knex.raw(`DROP INDEX IF EXISTS ${indexName}`);
        console.log(`✓ Dropped ${indexName}`);
      } catch (error) {
        console.log(`Error dropping ${indexName}: ${error.message}`);
      }
    };

    await dropIndex("idx_product_stocks_plp_variation_count");
    await dropIndex("idx_product_variations_plp_product_discount");
    await dropIndex("idx_product_variations_plp_product_pub_price");
    await dropIndex("idx_products_plp_category_status_removed");
    await dropIndex("idx_products_plp_status_removed_created");

    console.log("✅ PLP performance indexes rollback completed");
  },
};
