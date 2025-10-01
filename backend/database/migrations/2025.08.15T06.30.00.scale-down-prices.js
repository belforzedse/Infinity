/**
 * Migration `scale-down-prices` - Divide monetary fields by 10 (remove a trailing zero)
 */

module.exports = {
  /**
   * Run the migration: scale down amounts that are stored with an extra zero
   */
  async up(knex) {
    try {
      const operations = [
        // Product catalog
        { table: "product_variations", column: "price", cast: "bigint" },

        // Order system
        { table: "order_items", column: "per_amount", cast: "bigint" },
        { table: "orders", column: "shipping_cost", cast: "integer" },

        // Contract and payment system
        { table: "contracts", column: "amount", cast: "integer" },
        { table: "contract_transactions", column: "amount", cast: "bigint" },
        { table: "contract_transactions", column: "discount_amount", cast: "bigint" },
      ];

      const runnable = [];
      for (const op of operations) {
        const hasTable = await knex.schema.hasTable(op.table);
        if (!hasTable) {
          console.warn(
            `Skipping price scaling for ${op.table}.${op.column} because the table does not exist yet.`
          );
          continue;
        }

        const hasColumn = await knex.schema.hasColumn(op.table, op.column);
        if (!hasColumn) {
          console.warn(
            `Skipping price scaling for ${op.table}.${op.column} because the column does not exist.`
          );
          continue;
        }

        runnable.push(op);
      }

      if (runnable.length === 0) {
        console.log("No monetary tables available for price scaling; skipping migration.");
        return;
      }

      await knex.transaction(async (trx) => {
        for (const op of runnable) {
          const castType = op.cast === "integer" ? "integer" : "bigint";

          const affected = await trx(op.table)
            .whereNotNull(op.column)
            .update({
              [op.column]: trx.raw(`((?? / 10)::${castType})`, [op.column]),
            });

          console.log(
            `Scaled down ${affected} row(s) in ${op.table}.${op.column}`
          );
        }
      });

      console.log("Price scaling migration completed successfully");
    } catch (error) {
      console.error("Error during price scaling migration:", error);
      throw error;
    }
  },
};
