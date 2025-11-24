/**
 * Migration `add-event-log-indexes`
 *
 * Adds database indexes to improve event log query performance
 * - Index on RelatedUserId for user-specific queries
 * - Composite index on ResourceType + ResourceId for resource-specific queries
 * - Index on createdAt for date-based filtering
 * - Composite index on Audience + createdAt for filtered queries
 */

module.exports = {
  async up(knex) {
    const tableExists = await knex.schema.hasTable("event_logs");
    if (!tableExists) {
      console.warn(
        "Skipping event log indexes migration because event_logs table does not exist."
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

    // Add RelatedUserId index for user-specific queries
    if (!(await indexExists("event_logs_related_user_id_idx"))) {
      try {
        await knex.schema.table("event_logs", (table) => {
          table.index(["related_user_id"], "event_logs_related_user_id_idx");
        });
        console.log("✓ Added index on event_logs.related_user_id");
      } catch (error) {
        console.log("Index event_logs_related_user_id_idx already exists or error:", error.message);
      }
    }

    // Add composite index on ResourceType + ResourceId for resource-specific queries
    if (!(await indexExists("event_logs_resource_idx"))) {
      try {
        await knex.schema.table("event_logs", (table) => {
          table.index(["resource_type", "resource_id"], "event_logs_resource_idx");
        });
        console.log("✓ Added composite index on event_logs (resource_type, resource_id)");
      } catch (error) {
        console.log("Index event_logs_resource_idx already exists or error:", error.message);
      }
    }

    // Add createdAt index for date-based filtering and sorting
    if (!(await indexExists("event_logs_created_at_idx"))) {
      try {
        await knex.schema.table("event_logs", (table) => {
          table.index(["created_at"], "event_logs_created_at_idx");
        });
        console.log("✓ Added index on event_logs.created_at");
      } catch (error) {
        console.log("Index event_logs_created_at_idx already exists or error:", error.message);
      }
    }

    // Add composite index on Audience + createdAt for filtered queries
    if (!(await indexExists("event_logs_audience_created_at_idx"))) {
      try {
        await knex.schema.table("event_logs", (table) => {
          table.index(["audience", "created_at"], "event_logs_audience_created_at_idx");
        });
        console.log("✓ Added composite index on event_logs (audience, created_at)");
      } catch (error) {
        console.log("Index event_logs_audience_created_at_idx already exists or error:", error.message);
      }
    }

    // Add EventType index for filtering by event type
    if (!(await indexExists("event_logs_event_type_idx"))) {
      try {
        await knex.schema.table("event_logs", (table) => {
          table.index(["event_type"], "event_logs_event_type_idx");
        });
        console.log("✓ Added index on event_logs.event_type");
      } catch (error) {
        console.log("Index event_logs_event_type_idx already exists or error:", error.message);
      }
    }
  },

  async down(knex) {
    const tableExists = await knex.schema.hasTable("event_logs");
    if (!tableExists) {
      return;
    }

    // Remove indexes in reverse order
    try {
      await knex.schema.table("event_logs", (table) => {
        table.dropIndex([], "event_logs_event_type_idx");
        table.dropIndex([], "event_logs_audience_created_at_idx");
        table.dropIndex([], "event_logs_created_at_idx");
        table.dropIndex([], "event_logs_resource_idx");
        table.dropIndex([], "event_logs_related_user_id_idx");
      });
      console.log("✓ Removed event log indexes");
    } catch (error) {
      console.log("Error removing indexes:", error.message);
    }
  },
};
