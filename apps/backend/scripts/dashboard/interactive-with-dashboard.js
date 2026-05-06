#!/usr/bin/env node

/**
 * Interactive Importer with Live Dashboard
 *
 * Starts the dashboard server and opens it in browser,
 * then runs the interactive importer with real-time event streaming
 */

const { server, PORT, broadcastEvent, saveImportRecord } = require('./server');
const { DashboardLogger, ImportTracker } = require('./event-wrapper');
const path = require('path');
const { spawn, execSync } = require('child_process');
const readline = require('readline');

// Import importer classes
const CategoryImporter = require('../woocommerce-importer/importers/CategoryImporter');
const ProductImporter = require('../woocommerce-importer/importers/ProductImporter');
const VariationImporter = require('../woocommerce-importer/importers/VariationImporter');
const OrderImporter = require('../woocommerce-importer/importers/OrderImporter');
const UserImporter = require('../woocommerce-importer/importers/UserImporter');
const Logger = require('../woocommerce-importer/utils/Logger');
const DuplicateTracker = require('../woocommerce-importer/utils/DuplicateTracker');
const config = require('../woocommerce-importer/config');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

// Create dashboard logger
const baseLogger = new Logger();
const dashboardLogger = new DashboardLogger(baseLogger);

/**
 * Main dashboard app
 */
async function runDashboard() {
  // Start server
  server.listen(PORT, () => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`✨ Live Import Dashboard`);
    console.log(`${'='.repeat(70)}`);
    console.log(`\n🌐 Dashboard: http://localhost:${PORT}`);
    console.log(`📊 Opening browser in 2 seconds...\n`);
  });

  // Open browser after a short delay
  setTimeout(() => {
    const url = `http://localhost:${PORT}`;
    try {
      const platform = process.platform;
      if (platform === 'darwin') {
        execSync(`open "${url}"`);
      } else if (platform === 'win32') {
        execSync(`start ${url}`);
      } else {
        execSync(`xdg-open "${url}"`);
      }
    } catch (err) {
      console.log(`📌 If browser didn't open, visit: ${url}`);
    }
  }, 2000);

  // Show menu
  setTimeout(() => {
    showMainMenu();
  }, 1000);
}

/**
 * Main menu
 */
async function showMainMenu() {
  console.log('\n\n📋 WooCommerce Importer - Main Menu\n');
  console.log('1️⃣  Import Categories');
  console.log('2️⃣  Import Products');
  console.log('3️⃣  Import Variations');
  console.log('4️⃣  Import Orders');
  console.log('5️⃣  Import Users');
  console.log('9️⃣  Exit\n');

  const choice = await prompt('Select an option (1-9): ');

  switch (choice) {
    case '1':
      await configureAndRun('categories', CategoryImporter);
      break;
    case '2':
      await configureAndRun('products', ProductImporter);
      break;
    case '3':
      await configureAndRun('variations', VariationImporter);
      break;
    case '4':
      await configureAndRun('orders', OrderImporter);
      break;
    case '5':
      await configureAndRun('users', UserImporter);
      break;
    case '9':
      console.log('\n👋 Goodbye!\n');
      process.exit(0);
      break;
    default:
      console.log('\n❌ Invalid option\n');
      setTimeout(showMainMenu, 500);
      return;
  }

  setTimeout(showMainMenu, 1000);
}

/**
 * Configure and run an importer
 */
async function configureAndRun(type, ImporterClass) {
  console.clear();
  console.log(`\n🔧 Configure ${type.toUpperCase()} Import\n`);

  // Get options
  const limitInput = await prompt(`Number of items to import (default: 50): `);
  const limit = limitInput ? parseInt(limitInput) : 50;

  const pageInput = await prompt(`Starting page (default: 1): `);
  const page = pageInput ? parseInt(pageInput) : 1;

  const dryRunInput = await prompt(`Dry run mode? (y/n, default: y): `);
  const dryRun = dryRunInput.toLowerCase() !== 'n';

  // Category filter for products
  let categoryIds = [];
  if (type === 'products') {
    const catInput = await prompt(
      `Filter by category IDs? (comma-separated, or leave blank): `
    );
    if (catInput.trim()) {
      categoryIds = catInput
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));
    }
  }

  // Name filter for products
  let nameFilter = [];
  if (type === 'products') {
    const nameInput = await prompt(
      `Filter by name keywords? (comma-separated, e.g. "کیف,کفش", or leave blank): `
    );
    if (nameInput.trim()) {
      nameFilter = nameInput
        .split(',')
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0);
    }
  }

  const options = {
    limit,
    page,
    dryRun,
    categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
    nameFilter: nameFilter.length > 0 ? nameFilter : undefined
  };

  // Show summary
  console.log('\n📋 Import Summary:');
  console.log(`  Type: ${type}`);
  console.log(`  Limit: ${limit}`);
  console.log(`  Page: ${page}`);
  console.log(`  Dry Run: ${dryRun ? 'Yes' : 'No'}`);
  if (categoryIds.length > 0) console.log(`  Categories: [${categoryIds.join(', ')}]`);
  if (nameFilter.length > 0) console.log(`  Keywords: [${nameFilter.join(', ')}]`);

  const confirm = await prompt('\n✅ Start import? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('\n❌ Cancelled\n');
    return;
  }

  // Emit start event
  broadcastEvent({
    type: 'import:start',
    importType: type,
    options: options,
    timestamp: new Date().toISOString()
  });

  console.log('\n🚀 Starting import... Check the dashboard for live updates!\n');

  // Create importer
  const importer = new ImporterClass(config, dashboardLogger);

  // Wrap import with tracker
  const tracker = new ImportTracker(importer);
  const wrappedImport = tracker.wrapImport(importer.import);

  // Run import
  try {
    const startTime = Date.now();
    const stats = await wrappedImport.call(importer, options);
    const duration = Math.round((Date.now() - startTime) / 1000);

    // Save record
    saveImportRecord({
      type,
      total: stats.total,
      success: stats.success,
      failed: stats.failed,
      skipped: stats.skipped,
      duration: `${duration}s`,
      options
    });

    console.log(`\n✅ Import completed in ${duration}s`);
    console.log(`   Total: ${stats.total}`);
    console.log(`   Success: ${stats.success}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Skipped: ${stats.skipped}\n`);
  } catch (error) {
    console.error(`\n❌ Import failed: ${error.message}\n`);
  }

  // Continue
  console.log('Press Enter to return to menu...');
  await prompt('');
}

// Start
runDashboard();
