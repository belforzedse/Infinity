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
const UserImporter = require('./importers/UserImporter');
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
  .option('-b, --batch-size <number>', 'Items per page (max 100)', '100')
  .option('--all', 'Import all products (ignores limit)', false)
  .option('--dry-run', 'Run without actually importing data', false)
  .action(async (options) => {
    try {
      logger.info('🛍️ Starting product import...');
      
      // Override batch size if provided
      if (options.batchSize) {
        config.import.batchSizes.products = Math.min(parseInt(options.batchSize), 100);
      }
      
      const importer = new ProductImporter(config, logger);
      await importer.import({
        limit: options.all ? 999999 : parseInt(options.limit),
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
  .option('-b, --batch-size <number>', 'Items per page (max 100)', '100')
  .option('--all', 'Import all variations (ignores limit)', false)
  .option('--dry-run', 'Run without actually importing data', false)
  .option('--only-imported', 'Only import variations for products that are already imported', false)
  .action(async (options) => {
    try {
      logger.info('🎨 Starting variation import...');
      
      // Override batch size if provided
      if (options.batchSize) {
        config.import.batchSizes.products = Math.min(parseInt(options.batchSize), 100);
      }
      
      const importer = new VariationImporter(config, logger);
      await importer.import({
        limit: options.all ? 999999 : parseInt(options.limit),
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
  .option('-b, --batch-size <number>', 'Items per page (max 100)', '50')
  .option('--all', 'Import all orders (ignores limit)', false)
  .option('--dry-run', 'Run without actually importing data', false)
  .action(async (options) => {
    try {
      logger.info('📦 Starting order import...');
      
      // Override batch size if provided
      if (options.batchSize) {
        config.import.batchSizes.orders = Math.min(parseInt(options.batchSize), 100);
      }
      
      const importer = new OrderImporter(config, logger);
      await importer.import({
        limit: options.all ? 999999 : parseInt(options.limit),
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
  .command('users')
  .description('Import customers/users')
  .option('-l, --limit <number>', 'Limit number of items to import', '50')
  .option('-p, --page <number>', 'Start from specific page', '1')
  .option('-b, --batch-size <number>', 'Items per page (max 100)', '50')
  .option('--all', 'Import all users (ignores limit)', false)
  .option('--dry-run', 'Run without actually importing data', false)
  .action(async (options) => {
    try {
      logger.info('👥 Starting user import...');
      
      // Override batch size if provided
      if (options.batchSize) {
        config.import.batchSizes.users = Math.min(parseInt(options.batchSize), 100);
      }
      
      const importer = new UserImporter(config, logger);
      await importer.import({
        limit: options.all ? 999999 : parseInt(options.limit),
        page: parseInt(options.page),
        dryRun: options.dryRun
      });
      logger.success('✅ User import completed!');
    } catch (error) {
      logger.error('❌ User import failed:', error);
      process.exit(1);
    }
  });

program
  .command('all')
  .description('Import all data (categories, products, variations, orders, users)')
  .option('-l, --limit <number>', 'Limit number of items per type', '50')
  .option('--dry-run', 'Run without actually importing data', false)
  .action(async (options) => {
    try {
      logger.info('🚀 Starting full import...');
      
      // Import in correct order to maintain relationships
      const importers = [
        { name: 'Categories', class: CategoryImporter, limit: parseInt(options.limit) * 2 },
        { name: 'Users', class: UserImporter, limit: parseInt(options.limit) },
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

program
  .command('reset-progress')
  .description('Reset import progress for all importers')
  .option('-t, --type <type>', 'Reset progress for specific type (products, variations, categories, orders, users)', 'all')
  .action(async (options) => {
    try {
      logger.info('🧹 Resetting import progress...');
      
      const resetters = {
        products: () => new ProductImporter(config, logger).resetProgressState(),
        variations: () => new VariationImporter(config, logger).resetProgressState(),
        categories: () => new CategoryImporter(config, logger).resetProgressState(),
        orders: () => new OrderImporter(config, logger).resetProgressState(),
        users: () => new UserImporter(config, logger).resetProgressState()
      };
      
      if (options.type === 'all') {
        for (const [type, resetFn] of Object.entries(resetters)) {
          try {
            resetFn();
            logger.success(`✅ Reset ${type} progress`);
          } catch (error) {
            logger.error(`❌ Failed to reset ${type} progress:`, error.message);
          }
        }
      } else if (resetters[options.type]) {
        resetters[options.type]();
        logger.success(`✅ Reset ${options.type} progress`);
      } else {
        logger.error(`❌ Unknown type: ${options.type}. Available: products, variations, categories, orders, users, all`);
        process.exit(1);
      }
      
      logger.success('🎉 Progress reset completed!');
    } catch (error) {
      logger.error('❌ Progress reset failed:', error);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show import progress status')
  .action(async (options) => {
    try {
      logger.info('📊 Import Progress Status:');
      
      const importers = [
        { name: 'Products', class: ProductImporter },
        { name: 'Variations', class: VariationImporter },
        { name: 'Categories', class: CategoryImporter },
        { name: 'Orders', class: OrderImporter },
        { name: 'Users', class: UserImporter }
      ];
      
      for (const { name, class: ImporterClass } of importers) {
        try {
          const importer = new ImporterClass(config, logger);
          const progress = importer.loadProgressState();
          logger.info(`📈 ${name}:`);
          logger.info(`   Last completed page: ${progress.lastCompletedPage}`);
          logger.info(`   Total processed: ${progress.totalProcessed}`);
          logger.info(`   Last processed: ${progress.lastProcessedAt || 'Never'}`);
        } catch (error) {
          logger.error(`❌ Failed to load ${name} progress:`, error.message);
        }
      }
    } catch (error) {
      logger.error('❌ Status check failed:', error);
      process.exit(1);
    }
  });

program.parse(); 