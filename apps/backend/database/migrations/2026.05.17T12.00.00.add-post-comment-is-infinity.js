/**
 * Migration `add-post-comment-is-infinity`
 *
 * Adds the persisted official-author marker used by social post comments.
 */

module.exports = {
  async up(knex) {
    const tableExists = await knex.schema.hasTable("post_comments");
    if (!tableExists) {
      console.warn(
        "Skipping post comment IsInfinity migration because post_comments table does not exist."
      );
      return;
    }

    const hasColumn = await knex.schema.hasColumn("post_comments", "is_infinity");
    if (!hasColumn) {
      await knex.schema.alterTable("post_comments", (table) => {
        table.boolean("is_infinity").defaultTo(false).notNullable();
      });
    }
  },

  async down(knex) {
    const tableExists = await knex.schema.hasTable("post_comments");
    if (!tableExists) {
      return;
    }

    const hasColumn = await knex.schema.hasColumn("post_comments", "is_infinity");
    if (hasColumn) {
      await knex.schema.alterTable("post_comments", (table) => {
        table.dropColumn("is_infinity");
      });
    }
  },
};
