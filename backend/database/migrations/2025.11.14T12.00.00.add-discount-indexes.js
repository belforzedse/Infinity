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

    // Check if Code index already exists
    const hasCodeIndex = await knex.schema.hasIndex("discounts", "code_idx");
    if (!hasCodeIndex) {
      await knex.schema.table("discounts", (table) => {
        table.index(["code"], "code_idx");
      });
      console.log("✓ Added index on discounts.code");
    }

    // Check if compound index exists for discount validation (IsActive + StartDate + EndDate)
    const hasValidationIndex = await knex.schema.hasIndex(
      "discounts",
      "active_date_range_idx"
    );
    if (!hasValidationIndex) {
      await knex.schema.table("discounts", (table) => {
        table.index(
          ["is_active", "start_date", "end_date"],
          "active_date_range_idx"
        );
      });
      console.log(
        "✓ Added compound index on discounts (is_active, start_date, end_date)"
      );
    }

    // Check if removedAt index exists for soft delete filtering
    const hasRemovedAtIndex = await knex.schema.hasIndex(
      "discounts",
      "removed_at_idx"
    );
    if (!hasRemovedAtIndex) {
      await knex.schema.table("discounts", (table) => {
        table.index(["removed_at"], "removed_at_idx");
      });
      console.log("✓ Added index on discounts.removed_at");
    }
  },

  async down(knex) {
    const tableExists = await knex.schema.hasTable("discounts");
    if (!tableExists) {
      return;
    }

    // Drop indexes in reverse order
    const hasRemovedAtIndex = await knex.schema.hasIndex(
      "discounts",
      "removed_at_idx"
    );
    if (hasRemovedAtIndex) {
      await knex.schema.table("discounts", (table) => {
        table.dropIndex([], "removed_at_idx");
      });
    }

    const hasValidationIndex = await knex.schema.hasIndex(
      "discounts",
      "active_date_range_idx"
    );
    if (hasValidationIndex) {
      await knex.schema.table("discounts", (table) => {
        table.dropIndex([], "active_date_range_idx");
      });
    }

    const hasCodeIndex = await knex.schema.hasIndex("discounts", "code_idx");
    if (hasCodeIndex) {
      await knex.schema.table("discounts", (table) => {
        table.dropIndex([], "code_idx");
      });
    }
  },
};
