#!/usr/bin/env node

/**
 * Enhanced Interactive WooCommerce Importer
 *
 * User-friendly menu-driven interface for importing WooCommerce data to Strapi
 * with support for all entity types: Categories, Products, Variations, Orders, Users
 */

const readline = require('readline');
const CategoryImporter = require('./importers/CategoryImporter');
const ProductImporter = require('./importers/ProductImporter');
const VariationImporter = require('./importers/VariationImporter');
const OrderImporter = require('./importers/OrderImporter');
const UserImporter = require('./importers/UserImporter');
const DuplicateTracker = require('./utils/DuplicateTracker');
const Logger = require('./utils/Logger');
const config = require('./config');

// Initialize
const logger = new Logger();
let duplicateTracker = new DuplicateTracker(config, logger);

// Create readline interface for prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function for prompts
function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

/**
 * Check API health before import
 */
async function checkApiHealth() {
  console.log('\n🔍 Checking API Health...\n');

  const { WooCommerceClient, StrapiClient } = require('./utils/ApiClient');
  const wooClient = new WooCommerceClient(config, logger);
  const strapiClient = new StrapiClient(config, logger);

  let wooStatus = '❌ Unknown';
  let strapiStatus = '❌ Unknown';
  let wooResponseTime = 0;
  let strapiResponseTime = 0;

  // Check WooCommerce
  try {
    const startTime = Date.now();
    await wooClient.getCategories(1, 1);
    wooResponseTime = Date.now() - startTime;
    wooStatus = `✅ Connected (${wooResponseTime}ms)`;
  } catch (error) {
    wooStatus = `❌ Failed (${error.message})`;
  }

  // Check Strapi
  try {
    const startTime = Date.now();
    await strapiClient.getCategories({ pagination: { pageSize: 1 } });
    strapiResponseTime = Date.now() - startTime;
    strapiStatus = `✅ Connected (${strapiResponseTime}ms)`;
  } catch (error) {
    strapiStatus = `❌ Failed (${error.message})`;
  }

  console.log(`WooCommerce API:  ${wooStatus}`);
  console.log(`Strapi API:       ${strapiStatus}`);

  if (wooStatus.includes('❌') || strapiStatus.includes('❌')) {
    console.log('\n⚠️  One or more APIs are unreachable!');
    const proceed = await prompt('Continue anyway? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      return false;
    }
  }

  console.log('\n✅ API health check complete!');
  return true;
}

/**
 * Validate import dependencies
 */
async function validateImportDependencies(type) {
  const stats = duplicateTracker.getStats();

  const checks = {
    products: {
      description: 'Products require categories to be imported first',
      required: 'categories',
      checkFn: () => (stats.categories?.total || 0) > 0
    },
    variations: {
      description: 'Variations require products to be imported first',
      required: 'products',
      checkFn: () => (stats.products?.total || 0) > 0
    },
    orders: {
      description: 'Orders require products and users to be imported first',
      required: 'products, users',
      checkFn: () => (stats.products?.total || 0) > 0 && (stats.users?.total || 0) > 0
    }
  };

  if (!checks[type]) {
    return true; // No dependencies for this type
  }

  const check = checks[type];
  if (!check.checkFn()) {
    console.log(`\n⚠️  WARNING: ${check.description}`);
    const proceed = await prompt('Continue anyway? (y/n): ');
    return proceed.toLowerCase() === 'y';
  }

  return true;
}

/**
 * Show import preview
 */
async function showImportPreview(type, options) {
  console.log(`\n📋 Preview: ${type.toUpperCase()}`);
  console.log('Running dry-run to show preview...\n');

  try {
    let importer;
    if (type === 'categories') {
      importer = new CategoryImporter(config, logger);
    } else if (type === 'users') {
      importer = new UserImporter(config, logger);
    } else if (type === 'products') {
      importer = new ProductImporter(config, logger);
    } else if (type === 'variations') {
      importer = new VariationImporter(config, logger);
    } else if (type === 'orders') {
      importer = new OrderImporter(config, logger);
    }

    const dryRunStats = await importer.import({ ...options, dryRun: true });

    console.log('\n📊 Preview Results:');
    console.log(`  ├─ Total to process: ${dryRunStats.total || 0}`);
    console.log(`  ├─ Would import: ${dryRunStats.success || 0}`);
    console.log(`  ├─ Would skip: ${dryRunStats.skipped || 0}`);
    console.log(`  └─ Would fail: ${dryRunStats.failed || 0}`);

    const proceed = await prompt('\nProceed with actual import? (y/n): ');
    return proceed.toLowerCase() === 'y';
  } catch (error) {
    console.log(`❌ Preview failed: ${error.message}`);
    return false;
  }
}

// Track selected credentials environment
let selectedCredentialEnv = 'production';

// Import options
let importOptions = {
  categories: { enabled: true, limit: 1000, page: 1, dryRun: false },
  users: { enabled: false, limit: 100, page: 1, dryRun: true },
  products: {
    enabled: true,
    limit: 100000, // All products
    page: 1,
    dryRun: false,
    categoryIds: [],
    // Image options
    maxImagesPerProduct: 3, // Default: 3 images per product
    updateProductsWithExistingImages: true // Always update images, even for existing products to avoid dangling references
  },
  variations: { enabled: true, limit: 1000000000, page: 1, dryRun: false, onlyImported: true },
  orders: { enabled: false, limit: 50, page: 1, dryRun: true }
};

/**
 * Select Strapi credentials (production or staging)
 */
async function selectCredentials() {
  console.clear();
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║                    🔐 Select Strapi Credentials                           ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
  `);

  console.log('\n📋 Available Environments:\n');
  console.log('  1️⃣  Production');
  console.log('     URL: https://api.infinitycolor.co/api\n');
  console.log('  2️⃣  Staging');
  console.log('     URL: https://api.infinity.rgbgroup.ir/api\n');

  const choice = await prompt('Select environment (1-2, default: 1): ');

  let selected = 'production';
  if (choice === '2') {
    selected = 'staging';
  }

  selectedCredentialEnv = selected;

  // Apply selected credentials to config
  const creds = config.strapi.credentials[selected];
  config.strapi.baseUrl = creds.baseUrl;
  config.strapi.auth.token = creds.token;

  // Set environment-specific storage directory for import tracking
  config.duplicateTracking.storageDir = config.duplicateTracking.environments[selected];

  // Recreate the duplicate tracker with the new storage directory
  duplicateTracker = new DuplicateTracker(config, logger);

  console.log(`\n✅ Using ${selected.toUpperCase()} credentials`);
  console.log(`   Base URL: ${config.strapi.baseUrl}`);
  console.log(`   Tracking Directory: ${config.duplicateTracking.storageDir}\n`);
  await prompt('Press Enter to continue...');
};

/**
 * Display main menu
 */
async function showMainMenu() {
  console.clear();
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║           🚀 WooCommerce → Strapi Enhanced Interactive Importer           ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
  `);

  // Display current credentials
  console.log(`🔐 Current Credentials: ${selectedCredentialEnv.toUpperCase()}`);
  console.log(`   Base URL: ${config.strapi.baseUrl}\n`);

  console.log('📋 Current Import Configuration:\n');

  // Display current settings
  Object.entries(importOptions).forEach(([type, opts]) => {
    const status = opts.enabled ? '✅' : '⭕';
    console.log(`  ${status} ${type.toUpperCase()}`);
    console.log(`     Limit: ${opts.limit} | Dry Run: ${opts.dryRun ? 'Yes' : 'No'}`);
    if (opts.categoryIds && opts.categoryIds.length > 0) {
      console.log(`     Categories: [${opts.categoryIds.join(', ')}]`);
    }
    // Show image options for products
    if (type === 'products') {
      console.log(`     Max Images: ${opts.maxImagesPerProduct === 999 ? 'Unlimited' : opts.maxImagesPerProduct}`);
      console.log(`     Update Existing Images: ${opts.updateProductsWithExistingImages ? 'Yes' : 'No'}`);
    }
    // Show variations filter
    if (type === 'variations') {
      console.log(`     Only Imported Parents: ${opts.onlyImported ? 'Yes' : 'No'}`);
    }
  });

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log('\n📝 Main Menu:\n');
  console.log('  1️⃣  Change Credentials (Production/Staging)');
  console.log('  2️⃣  Configure Categories Import');
  console.log('  3️⃣  Configure Users Import');
  console.log('  4️⃣  Configure Products Import');
  console.log('  5️⃣  Configure Variations Import');
  console.log('  6️⃣  Configure Orders Import');
  console.log('  7️⃣  Run All Enabled Importers');
  console.log('  8️⃣  View Import Status & Mappings');
  console.log('  9️⃣  Clear All Mappings (Reset Progress)');
  console.log('  🔟  Exit\n');

  const choice = await prompt('Enter your choice (1-10): ');
  return choice;
}

/**
 * Configure an importer
 */
async function configureImporter(type) {
  console.clear();
  console.log(`\n🔧 Configure ${type.toUpperCase()} Import\n`);

  const opts = importOptions[type];

  // Enable/disable
  const enable = await prompt(`Enable ${type} import? (y/n): `);
  opts.enabled = enable.toLowerCase() === 'y';

  if (!opts.enabled) {
    return;
  }

  // Limit
  const limitInput = await prompt(`Number of items to import (default: ${opts.limit}): `);
  if (limitInput.trim()) {
    opts.limit = Math.max(1, parseInt(limitInput) || opts.limit);
  }

  // Page
  const pageInput = await prompt(`Starting page (default: ${opts.page}): `);
  if (pageInput.trim()) {
    opts.page = Math.max(1, parseInt(pageInput) || opts.page);
  }

  // Dry run
  const dryRunInput = await prompt(`Dry run mode (y/n)? (default: y): `);
  if (dryRunInput.trim()) {
    opts.dryRun = dryRunInput.toLowerCase() !== 'n';
  }

  // Only import variations for already-imported products (only for variations)
  if (type === 'variations') {
    const onlyImportedInput = await prompt(
      `Only import variations for products already in mappings? (y/n, default: y): `
    );
    if (onlyImportedInput.trim()) {
      opts.onlyImported = onlyImportedInput.toLowerCase() !== 'n';
      const status = opts.onlyImported ? '✅ ENABLED' : '⭕ DISABLED';
      console.log(`${status} - Will ${opts.onlyImported ? '' : 'NOT '}filter by imported parent products`);
    }
  }

  // Category filter (only for products)
  if (type === 'products') {
    const catInput = await prompt(
      `Filter by WooCommerce category IDs? (comma-separated, e.g., "5,12,18", or leave blank): `
    );
    if (catInput.trim()) {
      opts.categoryIds = catInput
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));
      if (opts.categoryIds.length > 0) {
        console.log(`✅ Filtering by categories: [${opts.categoryIds.join(', ')}]`);
      }
    }

    // Image configuration options
    console.log('\n🖼️  Image Configuration:');

    // Max images per product
    const maxImagesInput = await prompt(
      `Max gallery images per product? (default: ${opts.maxImagesPerProduct}): `
    );
    if (maxImagesInput.trim()) {
      const maxImages = parseInt(maxImagesInput);
      if (!isNaN(maxImages) && maxImages > 0) {
        opts.maxImagesPerProduct = maxImages;
        console.log(`✅ Max images per product set to: ${maxImages}`);
      }
    }

    // Update existing images toggle
    const updateExistingInput = await prompt(
      `Update products that already have images? (y/n, default: n): `
    );
    if (updateExistingInput.trim()) {
      opts.updateProductsWithExistingImages = updateExistingInput.toLowerCase() === 'y';
      const status = opts.updateProductsWithExistingImages ? '✅ ENABLED' : '⭕ DISABLED';
      console.log(`${status} - Will ${opts.updateProductsWithExistingImages ? '' : 'NOT '}update products with existing images`);
    }
  }

  console.log(`\n✅ ${type.toUpperCase()} configuration saved!`);
  await prompt('Press Enter to continue...');
}

/**
 * Run all enabled importers in correct order
 */
async function runAllImporters() {
  console.clear();
  console.log(`\n${'='.repeat(80)}`);
  console.log('🚀 Starting Import Process');
  console.log(`${'='.repeat(80)}\n`);

  // Check if any importer is enabled
  const enabled = Object.entries(importOptions)
    .filter(([_, opts]) => opts.enabled)
    .map(([type, _]) => type);

  if (enabled.length === 0) {
    console.log('❌ No importers enabled! Configure them first.\n');
    await prompt('Press Enter to continue...');
    return;
  }

  console.log(`📊 Enabled importers: ${enabled.join(', ').toUpperCase()}\n`);

  // Check API health
  const healthOk = await checkApiHealth();
  if (!healthOk) {
    console.log('\n❌ API health check failed. Aborting.\n');
    await prompt('Press Enter to continue...');
    return;
  }

  // Confirm
  const confirm = await prompt('\nProceed with import? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('\n❌ Import cancelled');
    await prompt('Press Enter to continue...');
    return;
  }

  // Run importers in correct order
  const importOrder = ['categories', 'users', 'products', 'variations', 'orders'];
  const stats = {};

  for (const type of importOrder) {
    if (!importOptions[type].enabled) continue;

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📦 Running ${type.toUpperCase()} Importer`);
    console.log(`${'─'.repeat(80)}\n`);

    // Validate dependencies
    const depsOk = await validateImportDependencies(type);
    if (!depsOk) {
      console.log(`⚠️  Skipping ${type} (dependency check failed)\n`);
      continue;
    }

    try {
      const opts = importOptions[type];

      if (type === 'categories') {
        const importer = new CategoryImporter(config, logger);
        stats[type] = await importer.import({
          limit: opts.limit,
          page: opts.page,
          dryRun: opts.dryRun
        });
      } else if (type === 'users') {
        const importer = new UserImporter(config, logger);
        stats[type] = await importer.import({
          limit: opts.limit,
          page: opts.page,
          dryRun: opts.dryRun
        });
      } else if (type === 'products') {
        // Update config with image options before importing
        config.import.images.maxImagesPerProduct = opts.maxImagesPerProduct;
        config.import.images.updateProductsWithExistingImages = opts.updateProductsWithExistingImages;

        const importer = new ProductImporter(config, logger);
        stats[type] = await importer.import({
          limit: opts.limit,
          page: opts.page,
          dryRun: opts.dryRun,
          categoryIds: opts.categoryIds
        });
      } else if (type === 'variations') {
        const importer = new VariationImporter(config, logger);
        stats[type] = await importer.import({
          limit: opts.limit,
          page: opts.page,
          dryRun: opts.dryRun,
          onlyImported: opts.onlyImported // Only import variations for products already in mappings
        });
      } else if (type === 'orders') {
        const importer = new OrderImporter(config, logger);
        stats[type] = await importer.import({
          limit: opts.limit,
          page: opts.page,
          dryRun: opts.dryRun
        });
      }

      console.log(`\n✅ ${type.toUpperCase()} import completed!\n`);
    } catch (error) {
      console.error(`\n❌ ${type.toUpperCase()} import failed:`, error.message);
      const continueOnError = await prompt('Continue with next importer? (y/n): ');
      if (continueOnError.toLowerCase() !== 'y') {
        break;
      }
    }
  }

  // Display summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 Import Summary');
  console.log(`${'='.repeat(80)}\n`);

  Object.entries(stats).forEach(([type, stat]) => {
    console.log(`${type.toUpperCase()}:`);
    console.log(`  ✅ Success: ${stat.success || 0}`);
    console.log(`  ⏭️  Skipped: ${stat.skipped || 0}`);
    console.log(`  ❌ Failed: ${stat.failed || 0}`);
    console.log(`  ⚠️  Errors: ${stat.errors || 0}`);
    if (stat.duration) {
      console.log(`  ⏱️  Duration: ${(stat.duration / 1000).toFixed(2)}s\n`);
    }
  });

  console.log(`\n🎉 All imports complete!\n`);
  await prompt('Press Enter to return to main menu...');
}

/**
 * Show import status and mappings
 */
async function showStatus() {
  console.clear();
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 Import Status & Mappings');
  console.log(`${'='.repeat(80)}\n`);

  const stats = duplicateTracker.getStats();

  Object.entries(stats).forEach(([type, stat]) => {
    console.log(`${type.toUpperCase()}:`);
    console.log(`  📊 Total tracked: ${stat.total}`);
    if (stat.oldest) {
      console.log(`  📅 Oldest: ${stat.oldest}`);
    }
    if (stat.newest) {
      console.log(`  📅 Newest: ${stat.newest}`);
    }
    console.log('');
  });

  console.log(`📁 Mapping files location: ${config.duplicateTracking.storageDir}\n`);
  await prompt('Press Enter to continue...');
}

/**
 * Clear all mappings
 */
async function clearMappings() {
  console.clear();
  console.log(`\n⚠️  WARNING: Clear All Mappings\n`);
  console.log('This will reset all import tracking, allowing items to be re-imported.');
  console.log('This is useful if you want to start fresh or fix duplicate imports.\n');

  const confirm = await prompt('Type "clear" to confirm clearing all mappings: ');

  if (confirm === 'clear') {
    console.log('\n🧹 Clearing mappings...\n');
    duplicateTracker.clearMappings('categories');
    duplicateTracker.clearMappings('products');
    duplicateTracker.clearMappings('variations');
    duplicateTracker.clearMappings('orders');
    duplicateTracker.clearMappings('users');
    console.log('✅ All mappings cleared!\n');
  } else {
    console.log('\n❌ Cancelled\n');
  }

  await prompt('Press Enter to continue...');
}

/**
 * Main loop
 */
async function main() {
  try {
    // Select credentials on startup
    await selectCredentials();

    let running = true;

    while (running) {
      const choice = await showMainMenu();

      switch (choice) {
        case '1':
          await selectCredentials();
          break;
        case '2':
          await configureImporter('categories');
          break;
        case '3':
          await configureImporter('users');
          break;
        case '4':
          await configureImporter('products');
          break;
        case '5':
          await configureImporter('variations');
          break;
        case '6':
          await configureImporter('orders');
          break;
        case '7':
          await runAllImporters();
          break;
        case '8':
          await showStatus();
          break;
        case '9':
          await clearMappings();
          break;
        case '10':
          console.log('\n👋 Goodbye!\n');
          running = false;
          break;
        default:
          console.log('\n❌ Invalid choice. Please try again.\n');
          await prompt('Press Enter to continue...');
      }
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Start the interactive importer
main();
