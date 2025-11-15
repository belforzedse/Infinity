/**
 * Migration `add-discount-indexes`
 *
 * Adds database indexes to improve discount code lookup performance
 * - Index on Code column for quick validation
 * - Compound index for discount active filtering
 */

module.exports = {
  async up(knex) {
    const tableExists = await knex.schema.hasTable("discounts");
    if (!tableExists) {
      console.warn(
        "Skipping discount indexes migration because discounts table does not exist."
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

    // Add Code index
    if (!(await indexExists("code_idx"))) {
      try {
        await knex.schema.table("discounts", (table) => {
          table.index(["code"], "code_idx");
        });
        console.log("✓ Added index on discounts.code");
      } catch (error) {
        console.log("Index code_idx already exists or error:", error.message);
      }
    }

    // Add compound index for discount validation (IsActive + StartDate + EndDate)
    if (!(await indexExists("active_date_range_idx"))) {
      try {
        await knex.schema.table("discounts", (table) => {
          table.index(
            ["is_active", "start_date", "end_date"],
            "active_date_range_idx"
          );
        });
        console.log(
          "✓ Added compound index on discounts (is_active, start_date, end_date)"
        );
      } catch (error) {
        console.log(
          "Index active_date_range_idx already exists or error:",
          error.message
        );
      }
    }

    // Add removedAt index for soft delete filtering
    if (!(await indexExists("removed_at_idx"))) {
      try {
        await knex.schema.table("discounts", (table) => {
          table.index(["removed_at"], "removed_at_idx");
        });
        console.log("✓ Added index on discounts.removed_at");
      } catch (error) {
        console.log("Index removed_at_idx already exists or error:", error.message);
      }
    }
  },

  async down(knex) {
    const tableExists = await knex.schema.hasTable("discounts");
    if (!tableExists) {
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

    // Drop indexes in reverse order
    if (await indexExists("removed_at_idx")) {
      try {
        await knex.schema.table("discounts", (table) => {
          table.dropIndex([], "removed_at_idx");
        });
      } catch (error) {
        console.log("Error dropping removed_at_idx:", error.message);
      }
    }

    if (await indexExists("active_date_range_idx")) {
      try {
        await knex.schema.table("discounts", (table) => {
          table.dropIndex([], "active_date_range_idx");
        });
      } catch (error) {
        console.log("Error dropping active_date_range_idx:", error.message);
      }
    }

    if (await indexExists("code_idx")) {
      try {
        await knex.schema.table("discounts", (table) => {
          table.dropIndex([], "code_idx");
        });
      } catch (error) {
        console.log("Error dropping code_idx:", error.message);
      }
    }
  }
};
