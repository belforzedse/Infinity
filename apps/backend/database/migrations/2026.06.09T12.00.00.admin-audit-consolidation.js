/**
 * Migration `admin-audit-consolidation`
 *
 * Part of replacing the unreliable admin activity tracking with a single, gated, immutable
 * admin audit log (`manual_admin_activities`). This migration:
 *
 *   1. Adds `products.last_edited_by_admin_at` (the dedicated "last edited by admin" timestamp
 *      that product sorting now uses instead of the generic `updated_at`). Existing rows are
 *      backfilled from `created_at` (NOT `updated_at`, which is corrupted by purchases/jobs) so
 *      the column is never NULL and descending sort behaves correctly.
 *   2. Purges the historical activity tables for a clean start (they were polluted with false
 *      positives). Going forward, only verified-admin actions are recorded.
 *   3. Adds indexes to `manual_admin_activities` to keep the filtered/sorted report query fast.
 *
 * Idempotent and safe to re-run.
 */

const indexExistsFactory = (knex) => async (indexName) => {
  const result = await knex.raw(
    `SELECT 1 FROM pg_indexes WHERE indexname = ? LIMIT 1`,
    [indexName],
  );
  return result.rows.length > 0;
};

module.exports = {
  async up(knex) {
    // 1) products.last_edited_by_admin_at
    if (await knex.schema.hasTable("products")) {
      const hasColumn = await knex.schema.hasColumn(
        "products",
        "last_edited_by_admin_at",
      );
      if (!hasColumn) {
        try {
          await knex.schema.table("products", (table) => {
            table.datetime("last_edited_by_admin_at").nullable();
          });
          console.log("✓ Added products.last_edited_by_admin_at");
        } catch (error) {
          console.log("Error adding last_edited_by_admin_at:", error.message);
        }
      }
      // Backfill from created_at where missing (baseline = creation time).
      try {
        await knex("products")
          .update({ last_edited_by_admin_at: knex.ref("created_at") })
          .whereNull("last_edited_by_admin_at");
        console.log("✓ Backfilled products.last_edited_by_admin_at from created_at");
      } catch (error) {
        console.log("Error backfilling last_edited_by_admin_at:", error.message);
      }
    }

    // 2) Purge historical activity records (clean start).
    for (const table of ["manual_admin_activities", "admin_activities"]) {
      if (await knex.schema.hasTable(table)) {
        try {
          // TRUNCATE resets the table cheaply; RESTART IDENTITY resets the id sequence.
          await knex.raw(`TRUNCATE TABLE ?? RESTART IDENTITY CASCADE`, [table]);
          console.log(`✓ Purged ${table}`);
        } catch (error) {
          console.log(`Error purging ${table}:`, error.message);
        }
      }
    }

    // 3) Indexes on manual_admin_activities.
    if (await knex.schema.hasTable("manual_admin_activities")) {
      const indexExists = indexExistsFactory(knex);

      // Index real columns on the main table (skip any that don't exist).
      const ensureIndex = async (columns, name) => {
        for (const col of columns) {
          if (!(await knex.schema.hasColumn("manual_admin_activities", col))) {
            console.log(`Skipping ${name}: column ${col} not present`);
            return;
          }
        }
        if (!(await indexExists(name))) {
          try {
            await knex.schema.table("manual_admin_activities", (table) => {
              table.index(columns, name);
            });
            console.log(`✓ Added index ${name} on manual_admin_activities`);
          } catch (error) {
            console.log(`Index ${name} already exists or error:`, error.message);
          }
        }
      };

      await ensureIndex(["created_at"], "maa_created_at_idx");
      await ensureIndex(
        ["resource_type", "action"],
        "maa_resource_type_action_idx",
      );
      await ensureIndex(["performed_by_role"], "maa_performed_by_role_idx");

      // The `performed_by` relation is stored in a Strapi v4 link table, not a column on the
      // main table. Index the link table's FK columns to keep performedBy filtering fast.
      const linkTable = "manual_admin_activities_performed_by_links";
      if (await knex.schema.hasTable(linkTable)) {
        if (!(await indexExists("maa_performed_by_link_idx"))) {
          try {
            await knex.schema.table(linkTable, (table) => {
              table.index(["user_id"], "maa_performed_by_link_idx");
            });
            console.log(`✓ Added index maa_performed_by_link_idx on ${linkTable}`);
          } catch (error) {
            console.log("Index maa_performed_by_link_idx error:", error.message);
          }
        }
      }
    }
  },

  async down(knex) {
    const indexExists = indexExistsFactory(knex);

    if (await knex.schema.hasTable("manual_admin_activities")) {
      for (const name of [
        "maa_performed_by_role_idx",
        "maa_resource_type_action_idx",
        "maa_created_at_idx",
      ]) {
        if (await indexExists(name)) {
          try {
            await knex.schema.table("manual_admin_activities", (table) => {
              table.dropIndex([], name);
            });
          } catch (error) {
            console.log(`Error dropping ${name}:`, error.message);
          }
        }
      }
    }

    const linkTable = "manual_admin_activities_performed_by_links";
    if (
      (await knex.schema.hasTable(linkTable)) &&
      (await indexExists("maa_performed_by_link_idx"))
    ) {
      try {
        await knex.schema.table(linkTable, (table) => {
          table.dropIndex([], "maa_performed_by_link_idx");
        });
      } catch (error) {
        console.log("Error dropping maa_performed_by_link_idx:", error.message);
      }
    }

    // Note: last_edited_by_admin_at column is intentionally left in place; let Strapi manage
    // schema changes. Purged data is not restorable.
  },
};
