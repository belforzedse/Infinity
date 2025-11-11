/**
 * Migration `add-strapi-user-bridge`
 *
 * Adds the `strapi_user` bridge column to `local_users` so legacy
 * local-user records can reference the corresponding plugin user.
 */

module.exports = {
  async up(knex) {
    const tableExists = await knex.schema.hasTable("local_users");
    if (!tableExists) {
      console.warn(
        "Skipping strapi_user column migration because local_users table does not exist."
      );
      return;
    }

    const hasColumn = await knex.schema.hasColumn("local_users", "strapi_user");
    if (!hasColumn) {
      await knex.schema.alterTable("local_users", (table) => {
        table
          .integer("strapi_user")
          .unique()
          .nullable();
      });
    }
  },

  async down(knex) {
    const tableExists = await knex.schema.hasTable("local_users");
    if (!tableExists) {
      return;
    }

    const hasColumn = await knex.schema.hasColumn("local_users", "strapi_user");
    if (hasColumn) {
      await knex.schema.alterTable("local_users", (table) => {
        table.dropColumn("strapi_user");
      });
    }
  },
};
