/**
 * Migration `add-product-variation-discount-price`
 *
 * Adds the `discount_price` column to product variations so variation-level
 * discounts can be persisted.
 */

module.exports = {
  async up(knex) {
    const hasColumn = await knex.schema.hasColumn(
      "product_variations",
      "discount_price",
    );

    if (!hasColumn) {
      await knex.schema.alterTable("product_variations", (table) => {
        table.bigInteger("discount_price");
      });
    }
  },

  async down(knex) {
    const hasColumn = await knex.schema.hasColumn(
      "product_variations",
      "discount_price",
    );

    if (hasColumn) {
      await knex.schema.alterTable("product_variations", (table) => {
        table.dropColumn("discount_price");
      });
    }
  },
};
