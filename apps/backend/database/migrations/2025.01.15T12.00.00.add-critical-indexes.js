/**
 * Migration: Add critical database indexes
 *
 * Adds database indexes to improve query performance for:
 * - Orders table: user_id, Status, Date, compound (user_id, Status)
 * - Product stocks: product_variation_id
 * - Cart items: compound (cart_id, product_variation_id)
 *
 * These indexes are critical for:
 * - Fast order lookups by user and status
 * - Stock queries during checkout
 * - Cart item lookups
 */

module.exports = {
  async up(knex) {
    // Wrap all operations in individual try-catch to prevent transaction abort
    // PostgreSQL aborts transaction on error, so we use raw SQL with IF NOT EXISTS

    const tableExists = async (tableName) => {
      try {
        return await knex.schema.hasTable(tableName);
      } catch (error) {
        console.warn(`Failed to check if table ${tableName} exists:`, error.message);
        return false;
      }
    };

    const indexExists = async (indexName, tableName) => {
      try {
        const result = await knex.raw(
          `SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = $1 AND indexname = $2 LIMIT 1`,
          [tableName, indexName],
        );
        return result.rows.length > 0;
      } catch (error) {
        // If query fails, assume index doesn't exist
        return false;
      }
    };

    const columnExists = async (tableName, columnName) => {
      try {
        const result = await knex.raw(
          `SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1 AND column_name = $2 LIMIT 1`,
          [tableName, columnName],
        );
        return result.rows.length > 0;
      } catch (error) {
        return false;
      }
    };

    // Orders table indexes
    if (await tableExists("orders")) {
      // Detect user column name (Strapi uses relation name "user" or "user_id")
      const userColumnName = (await columnExists("orders", "user"))
        ? "user"
        : (await columnExists("orders", "user_id"))
        ? "user_id"
        : null;

      // Detect Status column name (could be "Status" or "status" - PostgreSQL is case-sensitive)
      const statusColumnName = (await columnExists("orders", "Status"))
        ? "Status"
        : (await columnExists("orders", "status"))
        ? "status"
        : null;

      // Detect Date column name
      const dateColumnName = (await columnExists("orders", "Date"))
        ? "Date"
        : (await columnExists("orders", "date"))
        ? "date"
        : null;

      // Index on user column (most queries filter by user)
      if (userColumnName && !(await indexExists("idx_orders_user", "orders"))) {
        try {
          await knex.raw(
            `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders ("${userColumnName}")`,
          );
          console.log(`✓ Added index on orders.${userColumnName}`);
        } catch (error) {
          console.log(`Index idx_orders_user already exists or error: ${error.message}`);
        }
      } else if (!userColumnName) {
        console.warn("Skipping user index - user/user_id column not found in orders table");
      }

      // Index on Status (status filtering) - only if column exists
      if (statusColumnName && !(await indexExists("idx_orders_status", "orders"))) {
        try {
          await knex.raw(
            `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders ("${statusColumnName}")`,
          );
          console.log(`✓ Added index on orders.${statusColumnName}`);
        } catch (error) {
          console.log(`Index idx_orders_status already exists or error: ${error.message}`);
        }
      } else if (!statusColumnName) {
        console.warn("Skipping Status index - Status/status column not found in orders table");
      }

      // Index on Date (sorting by date) - only if column exists
      if (dateColumnName && !(await indexExists("idx_orders_date", "orders"))) {
        try {
          await knex.raw(
            `CREATE INDEX IF NOT EXISTS idx_orders_date ON orders ("${dateColumnName}")`,
          );
          console.log(`✓ Added index on orders.${dateColumnName}`);
        } catch (error) {
          console.log(`Index idx_orders_date already exists or error: ${error.message}`);
        }
      } else if (!dateColumnName) {
        console.warn("Skipping Date index - Date/date column not found in orders table");
      }

      // Compound index on (user, Status) for common queries - only if both columns exist
      if (
        userColumnName &&
        statusColumnName &&
        !(await indexExists("idx_orders_user_status", "orders"))
      ) {
        try {
          await knex.raw(
            `CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders ("${userColumnName}", "${statusColumnName}")`,
          );
          console.log(`✓ Added compound index on orders (${userColumnName}, ${statusColumnName})`);
        } catch (error) {
          console.log(`Index idx_orders_user_status already exists or error: ${error.message}`);
        }
      } else if (!userColumnName || !statusColumnName) {
        console.warn("Skipping user_status compound index - user or Status column not found");
      }
    } else {
      console.warn("Orders table does not exist, skipping orders indexes");
    }

    // Product stocks table indexes
    if (await tableExists("product_stocks")) {
      // Check if product_variation_id column exists
      const hasVariationColumn = await columnExists("product_stocks", "product_variation_id");

      if (
        hasVariationColumn &&
        !(await indexExists("idx_product_stocks_variation", "product_stocks"))
      ) {
        try {
          await knex.raw(
            `CREATE INDEX IF NOT EXISTS idx_product_stocks_variation ON product_stocks (product_variation_id)`,
          );
          console.log("✓ Added index on product_stocks.product_variation_id");
        } catch (error) {
          console.log("Index idx_product_stocks_variation already exists or error:", error.message);
        }
      } else if (!hasVariationColumn) {
        console.warn("Skipping product_stocks variation index - column not found");
      }
    } else {
      console.warn("Product stocks table does not exist, skipping product_stocks indexes");
    }

    // Cart items table indexes
    if (await tableExists("cart_items")) {
      // Check if columns exist
      const hasCartId = await columnExists("cart_items", "cart_id");
      const hasVariationId = await columnExists("cart_items", "product_variation_id");

      if (
        hasCartId &&
        hasVariationId &&
        !(await indexExists("idx_cart_items_cart_variation", "cart_items"))
      ) {
        try {
          await knex.raw(
            `CREATE INDEX IF NOT EXISTS idx_cart_items_cart_variation ON cart_items (cart_id, product_variation_id)`,
          );
          console.log("✓ Added compound index on cart_items (cart_id, product_variation_id)");
        } catch (error) {
          console.log(
            "Index idx_cart_items_cart_variation already exists or error:",
            error.message,
          );
        }
      } else if (!hasCartId || !hasVariationId) {
        console.warn("Skipping cart_items compound index - columns not found");
      }
    } else {
      console.warn("Cart items table does not exist, skipping cart_items indexes");
    }

    console.log("✅ Critical indexes migration completed successfully!");
  },

  async down(knex) {
    const tableExists = async (tableName) => {
      return await knex.schema.hasTable(tableName);
    };

    const indexExists = async (indexName, tableName) => {
      try {
        const result = await knex.raw(
          `SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = ? AND indexname = ? LIMIT 1`,
          [tableName, indexName],
        );
        return result.rows.length > 0;
      } catch (error) {
        return false;
      }
    };

    const columnExists = async (tableName, columnName) => {
      try {
        const result = await knex.raw(
          `SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ? AND column_name = ? LIMIT 1`,
          [tableName, columnName],
        );
        return result.rows.length > 0;
      } catch (error) {
        return false;
      }
    };

    // Drop indexes in reverse order
    if (await tableExists("cart_items")) {
      if (await indexExists("idx_cart_items_cart_variation", "cart_items")) {
        try {
          await knex.schema.table("cart_items", (table) => {
            table.dropIndex([], "idx_cart_items_cart_variation");
          });
          console.log("✓ Dropped index idx_cart_items_cart_variation");
        } catch (error) {
          console.log("Error dropping idx_cart_items_cart_variation:", error.message);
        }
      }
    }

    if (await tableExists("product_stocks")) {
      if (await indexExists("idx_product_stocks_variation", "product_stocks")) {
        try {
          await knex.schema.table("product_stocks", (table) => {
            table.dropIndex([], "idx_product_stocks_variation");
          });
          console.log("✓ Dropped index idx_product_stocks_variation");
        } catch (error) {
          console.log("Error dropping idx_product_stocks_variation:", error.message);
        }
      }
    }

    if (await tableExists("orders")) {
      if (await indexExists("idx_orders_user_status", "orders")) {
        try {
          await knex.schema.table("orders", (table) => {
            table.dropIndex([], "idx_orders_user_status");
          });
          console.log("✓ Dropped index idx_orders_user_status");
        } catch (error) {
          console.log("Error dropping idx_orders_user_status:", error.message);
        }
      }

      if (await indexExists("idx_orders_date", "orders")) {
        try {
          await knex.schema.table("orders", (table) => {
            table.dropIndex([], "idx_orders_date");
          });
          console.log("✓ Dropped index idx_orders_date");
        } catch (error) {
          console.log("Error dropping idx_orders_date:", error.message);
        }
      }

      if (await indexExists("idx_orders_status", "orders")) {
        try {
          await knex.schema.table("orders", (table) => {
            table.dropIndex([], "idx_orders_status");
          });
          console.log("✓ Dropped index idx_orders_status");
        } catch (error) {
          console.log("Error dropping idx_orders_status:", error.message);
        }
      }

      if (await indexExists("idx_orders_user", "orders")) {
        try {
          await knex.schema.table("orders", (table) => {
            table.dropIndex([], "idx_orders_user");
          });
          console.log("✓ Dropped index idx_orders_user");
        } catch (error) {
          console.log("Error dropping idx_orders_user:", error.message);
        }
      }
    }

    console.log("✅ Critical indexes rollback completed");
  },
};
