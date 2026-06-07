/**
 * Adds gateway-specific transaction fields used by ZarinPal callbacks.
 */

module.exports = {
  async up(knex) {
    const hasTable = await knex.schema.hasTable("contract_transactions");
    if (!hasTable) return;

    const hasColumn = async (columnName) => {
      const result = await knex.raw(
        `SELECT 1
         FROM information_schema.columns
         WHERE table_schema = current_schema()
           AND table_name = 'contract_transactions'
           AND column_name = ?
         LIMIT 1`,
        [columnName],
      );
      return result.rows.length > 0;
    };

    const columns = {
      gatewayAuthority: await hasColumn("gateway_authority"),
      gatewayRefId: await hasColumn("gateway_ref_id"),
      gatewayStatus: await hasColumn("gateway_status"),
      gatewayResponse: await hasColumn("gateway_response"),
      verifiedAt: await hasColumn("verified_at"),
    };

    await knex.schema.alterTable("contract_transactions", (table) => {
      if (!columns.gatewayAuthority) {
        table.string("gateway_authority").nullable();
      }
      if (!columns.gatewayRefId) {
        table.string("gateway_ref_id").nullable();
      }
      if (!columns.gatewayStatus) {
        table.string("gateway_status").nullable();
      }
      if (!columns.gatewayResponse) {
        table.jsonb("gateway_response").nullable();
      }
      if (!columns.verifiedAt) {
        table.timestamp("verified_at", { useTz: true }).nullable();
      }
    });

    await knex.raw(
      `CREATE INDEX IF NOT EXISTS idx_contract_transactions_gateway_authority
       ON contract_transactions (gateway_authority)
       WHERE gateway_authority IS NOT NULL`,
    );
    await knex.raw(
      `CREATE INDEX IF NOT EXISTS idx_contract_transactions_gateway_ref_id
       ON contract_transactions (gateway_ref_id)
       WHERE gateway_ref_id IS NOT NULL`,
    );
  },

  async down(knex) {
    const hasTable = await knex.schema.hasTable("contract_transactions");
    if (!hasTable) return;

    await knex.raw("DROP INDEX IF EXISTS idx_contract_transactions_gateway_ref_id");
    await knex.raw("DROP INDEX IF EXISTS idx_contract_transactions_gateway_authority");

    await knex.schema.alterTable("contract_transactions", (table) => {
      table.dropColumn("verified_at");
      table.dropColumn("gateway_response");
      table.dropColumn("gateway_status");
      table.dropColumn("gateway_ref_id");
      table.dropColumn("gateway_authority");
    });
  },
};
