"use strict";

/**
 * Make product_variation_colors.color_code nullable.
 *
 * Strapi does not remove NOT NULL constraints automatically when `required`
 * is dropped from a schema attribute. This migration handles the DB-level change
 * so that colors without a hex code can be stored.
 */
module.exports = {
  async up(knex) {
    const tableExists = await knex.schema.hasTable("product_variation_colors");
    if (!tableExists) {
      console.warn("[migration] product_variation_colors table not found, skipping");
      return;
    }

    const result = await knex.raw(
      `SELECT is_nullable
       FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name   = 'product_variation_colors'
         AND column_name  = 'color_code'`,
    );

    const row = result.rows?.[0];
    if (row?.is_nullable === "YES") {
      console.log("[migration] color_code is already nullable, skipping");
      return;
    }

    await knex.raw(
      `ALTER TABLE product_variation_colors ALTER COLUMN color_code DROP NOT NULL`,
    );
    console.log("[migration] Made product_variation_colors.color_code nullable");
  },

  async down(knex) {
    const tableExists = await knex.schema.hasTable("product_variation_colors");
    if (!tableExists) return;

    // Replace any existing nulls before restoring NOT NULL to avoid a constraint error.
    const updated = await knex("product_variation_colors")
      .whereNull("color_code")
      .update({ color_code: "#000000" });

    if (updated > 0) {
      console.warn(
        `[migration] Replaced ${updated} null color_code values with #000000 before restoring NOT NULL`,
      );
    }

    await knex.raw(
      `ALTER TABLE product_variation_colors ALTER COLUMN color_code SET NOT NULL`,
    );
    console.log("[migration] Restored product_variation_colors.color_code NOT NULL");
  },
};
