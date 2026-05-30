/**
 * Adds DB-backed background job locks and indexes for checkout expiry jobs.
 */

module.exports = {
  async up(knex) {
    const tableExists = async (tableName) => knex.schema.hasTable(tableName);

    const columnExists = async (tableName, columnName) => {
      const result = await knex.raw(
        `SELECT 1
         FROM information_schema.columns
         WHERE table_schema = current_schema()
           AND table_name = ?
           AND column_name = ?
         LIMIT 1`,
        [tableName, columnName]
      );
      return result.rows.length > 0;
    };

    const indexExists = async (indexName) => {
      const result = await knex.raw(
        `SELECT 1
         FROM pg_indexes
         WHERE schemaname = current_schema()
           AND indexname = ?
         LIMIT 1`,
        [indexName]
      );
      return result.rows.length > 0;
    };

    if (!(await tableExists("background_job_locks"))) {
      await knex.schema.createTable("background_job_locks", (table) => {
        table.string("name", 128).primary();
        table.string("owner", 255).notNullable();
        table.timestamp("locked_until", { useTz: true }).notNullable();
        table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
      });
      console.log("Added background_job_locks table");
    }

    if (await tableExists("orders")) {
      const hasStatus = await columnExists("orders", "status");
      const hasReservationStatus = await columnExists("orders", "reservation_status");
      const hasReservedUntil = await columnExists("orders", "reserved_until");
      const hasIsReserveOrder = await columnExists("orders", "is_reserve_order");
      const hasReserveExpiresAt = await columnExists("orders", "reserve_expires_at");
      const hasReserveGroupId = await columnExists("orders", "reserve_group_id");

      if (
        hasStatus &&
        hasReservationStatus &&
        hasReservedUntil &&
        !(await indexExists("idx_orders_stock_reservation_expiry"))
      ) {
        await knex.raw(
          `CREATE INDEX IF NOT EXISTS idx_orders_stock_reservation_expiry
           ON orders (status, reservation_status, reserved_until)
           WHERE status = 'Paying'
             AND reservation_status = 'Reserved'
             AND reserved_until IS NOT NULL`
        );
        console.log("Added idx_orders_stock_reservation_expiry");
      }

      if (
        hasIsReserveOrder &&
        hasReserveExpiresAt &&
        hasReserveGroupId &&
        !(await indexExists("idx_orders_reserve_order_expiry"))
      ) {
        await knex.raw(
          `CREATE INDEX IF NOT EXISTS idx_orders_reserve_order_expiry
           ON orders (is_reserve_order, reserve_expires_at, reserve_group_id)
           WHERE is_reserve_order = true
             AND reserve_expires_at IS NOT NULL`
        );
        console.log("Added idx_orders_reserve_order_expiry");
      }
    }
  },

  async down(knex) {
    await knex.raw("DROP INDEX IF EXISTS idx_orders_reserve_order_expiry");
    await knex.raw("DROP INDEX IF EXISTS idx_orders_stock_reservation_expiry");

    const hasLocksTable = await knex.schema.hasTable("background_job_locks");
    if (hasLocksTable) {
      await knex.schema.dropTable("background_job_locks");
    }
  },
};
