/**
 * Migration: Set default Weight=100 where null or <= 0 on products
 */

module.exports = {
  async up(knex) {
    const hasProducts = await knex.schema.hasTable('products');
    if (!hasProducts) {
      console.warn('Skipping weight normalization because products table does not exist yet.');
      return;
    }

    const hasColumn = await knex.schema.hasColumn('products', 'weight');
    if (!hasColumn) {
      console.warn('Skipping weight normalization because products.weight column is missing.');
      return;
    }

    try {
      await knex('products').whereNull('weight').update({ weight: 100 });
      await knex('products').where('weight', '<=', 0).update({ weight: 100 });
      console.log('Product weights normalized to 100 where null/<=0');
    } catch (err) {
      console.error('Error setting default weights:', err);
      throw err;
    }
  },
};
