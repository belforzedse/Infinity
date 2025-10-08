'use strict';

/**
 * Bootstrap schema tables for shipping provinces & cities so data migrations work on fresh databases.
 */

module.exports = {
  async up(knex) {
    const hasProvinceTable = await knex.schema.hasTable('shipping_provinces');
    if (!hasProvinceTable) {
      await knex.schema.createTable('shipping_provinces', (table) => {
        table.increments('id').primary();
        table.string('title');
        table.string('code');
        table.integer('created_by_id');
        table.integer('updated_by_id');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      });
    }

    const hasCitiesTable = await knex.schema.hasTable('shipping_cities');
    if (!hasCitiesTable) {
      await knex.schema.createTable('shipping_cities', (table) => {
        table.increments('id').primary();
        table.string('title').notNullable();
        table.string('code');
        table.integer('shipping_province_id');
        table.integer('created_by_id');
        table.integer('updated_by_id');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      });
    }

    const hasLinkTable = await knex.schema.hasTable('shipping_cities_shipping_province_links');
    if (!hasLinkTable) {
      await knex.schema.createTable('shipping_cities_shipping_province_links', (table) => {
        table.increments('id').primary();
        table.integer('shipping_city_id');
        table.integer('shipping_province_id');
        table.unique(['shipping_city_id', 'shipping_province_id'], 'shipping_city_province_unique');
      });
    }
  },

  async down(knex) {
    const dropIfExists = async (tableName) => {
      const exists = await knex.schema.hasTable(tableName);
      if (exists) await knex.schema.dropTable(tableName);
    };

    await dropIfExists('shipping_cities_shipping_province_links');
    await dropIfExists('shipping_cities');
    await dropIfExists('shipping_provinces');
  },
};
