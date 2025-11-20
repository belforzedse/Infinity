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
        // If query fails, assume index doesn't exist
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

    // Orders table indexes
    if (await tableExists("orders")) {
      // Detect user column name (Strapi uses relation name "user" or "user_id")
      const userColumnName = (await columnExists("orders", "user"))
        ? "user"
        : (await columnExists("orders", "user_id"))
        ? "user_id"
        : null;

      // Index on user column (most queries filter by user)
      if (userColumnName && !(await indexExists("idx_orders_user", "orders"))) {
        try {
          await knex.schema.table("orders", (table) => {
            table.index([userColumnName], "idx_orders_user");
          });
          console.log(`✓ Added index on orders.${userColumnName}`);
        } catch (error) {
          console.log(`Index idx_orders_user already exists or error: ${error.message}`);
        }
      } else if (!userColumnName) {
        console.warn("Skipping user index - user/user_id column not found in orders table");
      }

      // Index on Status (status filtering)
      if (!(await indexExists("idx_orders_status", "orders"))) {
        try {
          await knex.schema.table("orders", (table) => {
            table.index(["Status"], "idx_orders_status");
          });
          console.log("✓ Added index on orders.Status");
        } catch (error) {
          console.log("Index idx_orders_status already exists or error:", error.message);
        }
      }

      // Index on Date (sorting by date)
      if (!(await indexExists("idx_orders_date", "orders"))) {
        try {
          await knex.schema.table("orders", (table) => {
            table.index(["Date"], "idx_orders_date");
          });
          console.log("✓ Added index on orders.Date");
        } catch (error) {
          console.log("Index idx_orders_date already exists or error:", error.message);
        }
      }

      // Compound index on (user, Status) for common queries
      if (userColumnName && !(await indexExists("idx_orders_user_status", "orders"))) {
        try {
          await knex.schema.table("orders", (table) => {
            table.index([userColumnName, "Status"], "idx_orders_user_status");
          });
          console.log(`✓ Added compound index on orders (${userColumnName}, Status)`);
        } catch (error) {
          console.log(`Index idx_orders_user_status already exists or error: ${error.message}`);
        }
      } else if (!userColumnName) {
        console.warn("Skipping user_status compound index - user/user_id column not found");
      }
    } else {
      console.warn("Orders table does not exist, skipping orders indexes");
    }

    // Product stocks table indexes
    if (await tableExists("product_stocks")) {
      // Index on product_variation_id (stock lookups during checkout)
      if (!(await indexExists("idx_product_stocks_variation", "product_stocks"))) {
        try {
          await knex.schema.table("product_stocks", (table) => {
            table.index(["product_variation_id"], "idx_product_stocks_variation");
          });
          console.log("✓ Added index on product_stocks.product_variation_id");
        } catch (error) {
          console.log("Index idx_product_stocks_variation already exists or error:", error.message);
        }
      }
    } else {
      console.warn("Product stocks table does not exist, skipping product_stocks indexes");
    }

    // Cart items table indexes
    if (await tableExists("cart_items")) {
      // Compound index on (cart_id, product_variation_id) for cart queries
      if (!(await indexExists("idx_cart_items_cart_variation", "cart_items"))) {
        try {
          await knex.schema.table("cart_items", (table) => {
            table.index(["cart_id", "product_variation_id"], "idx_cart_items_cart_variation");
          });
          console.log("✓ Added compound index on cart_items (cart_id, product_variation_id)");
        } catch (error) {
          console.log(
            "Index idx_cart_items_cart_variation already exists or error:",
            error.message,
          );
        }
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
