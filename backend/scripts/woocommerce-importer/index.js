#!/usr/bin/env node

/**
 * WooCommerce to Strapi Importer
 * 
 * Imports products, categories, variations, and orders from WooCommerce
 * into our Infinity Store Strapi backend with duplicate prevention.
 */

const { program } = require('commander');
const CategoryImporter = require('./importers/CategoryImporter');
const ProductImporter = require('./importers/ProductImporter');
const VariationImporter = require('./importers/VariationImporter');
const OrderImporter = require('./importers/OrderImporter');
const Logger = require('./utils/Logger');
const config = require('./config');

// Initialize logger
const logger = new Logger();

program
  .name('woocommerce-importer')
  .description('Import data from WooCommerce to Strapi')
  .version('1.0.0');

program
  .command('categories')
  .description('Import product categories')
  .option('-l, --limit <number>', 'Limit number of items to import', '100')
  .option('-p, --page <number>', 'Start from specific page', '1')
  .option('--dry-run', 'Run without actually importing data', false)
  .action(async (options) => {
    try {
      logger.info('🏷️ Starting category import...');
      const importer = new CategoryImporter(config, logger);
      await importer.import({
        limit: parseInt(options.limit),
        page: parseInt(options.page),
        dryRun: options.dryRun
      });
      logger.success('✅ Category import completed!');
    } catch (error) {
      logger.error('❌ Category import failed:', error);
      process.exit(1);
    }
  });

program
  .command('products')
  .description('Import products')
  .option('-l, --limit <number>', 'Limit number of items to import', '50')
  .option('-p, --page <number>', 'Start from specific page', '1')
  .option('--dry-run', 'Run without actually importing data', false)
  .action(async (options) => {
    try {
      logger.info('🛍️ Starting product import...');
      const importer = new ProductImporter(config, logger);
      await importer.import({
        limit: parseInt(options.limit),
        page: parseInt(options.page),
        dryRun: options.dryRun
      });
      logger.success('✅ Product import completed!');
    } catch (error) {
      logger.error('❌ Product import failed:', error);
      process.exit(1);
    }
  });

program
  .command('variations')
  .description('Import product variations')
  .option('-l, --limit <number>', 'Limit number of items to import', '100')
  .option('-p, --page <number>', 'Start from specific page', '1')
  .option('--dry-run', 'Run without actually importing data', false)
  .option('--only-imported', 'Only import variations for products that are already imported', false)
  .action(async (options) => {
    try {
      logger.info('🎨 Starting variation import...');
      const importer = new VariationImporter(config, logger);
      await importer.import({
        limit: parseInt(options.limit),
        page: parseInt(options.page),
        dryRun: options.dryRun,
        onlyImported: options.onlyImported
      });
      logger.success('✅ Variation import completed!');
    } catch (error) {
      logger.error('❌ Variation import failed:', error);
      process.exit(1);
    }
  });

program
  .command('variations-imported')
  .description('Import variations only for products that are already imported')
  .option('-l, --limit <number>', 'Limit number of items to import', '100')
  .option('-p, --page <number>', 'Start from specific page', '1')
  .option('--dry-run', 'Run without actually importing data', false)
  .action(async (options) => {
    try {
      logger.info('🎨 Starting variation import for imported products only...');
      const importer = new VariationImporter(config, logger);
      await importer.import({
        limit: parseInt(options.limit),
        page: parseInt(options.page),
        dryRun: options.dryRun,
        onlyImported: true
      });
      logger.success('✅ Variation import for imported products completed!');
    } catch (error) {
      logger.error('❌ Variation import failed:', error);
      process.exit(1);
    }
  });

program
  .command('orders')
  .description('Import orders')
  .option('-l, --limit <number>', 'Limit number of items to import', '50')
  .option('-p, --page <number>', 'Start from specific page', '1')
  .option('--dry-run', 'Run without actually importing data', false)
  .action(async (options) => {
    try {
      logger.info('📦 Starting order import...');
      const importer = new OrderImporter(config, logger);
      await importer.import({
        limit: parseInt(options.limit),
        page: parseInt(options.page),
        dryRun: options.dryRun
      });
      logger.success('✅ Order import completed!');
    } catch (error) {
      logger.error('❌ Order import failed:', error);
      process.exit(1);
    }
  });

program
  .command('all')
  .description('Import all data (categories, products, variations, orders)')
  .option('-l, --limit <number>', 'Limit number of items per type', '50')
  .option('--dry-run', 'Run without actually importing data', false)
  .action(async (options) => {
    try {
      logger.info('🚀 Starting full import...');
      
      // Import in correct order to maintain relationships
      const importers = [
        { name: 'Categories', class: CategoryImporter, limit: parseInt(options.limit) * 2 },
        { name: 'Products', class: ProductImporter, limit: parseInt(options.limit) },
        { name: 'Variations', class: VariationImporter, limit: parseInt(options.limit) * 3 },
        { name: 'Orders', class: OrderImporter, limit: parseInt(options.limit) }
      ];
      
      for (const { name, class: ImporterClass, limit } of importers) {
        logger.info(`📥 Importing ${name}...`);
        const importer = new ImporterClass(config, logger);
        await importer.import({
          limit,
          page: 1,
          dryRun: options.dryRun
        });
        logger.success(`✅ ${name} import completed!`);
      }
      
      logger.success('🎉 Full import completed successfully!');
    } catch (error) {
      logger.error('❌ Full import failed:', error);
      process.exit(1);
    }
  });

program.parse(); 