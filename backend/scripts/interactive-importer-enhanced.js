#!/usr/bin/env node
/**
 * Enhanced Interactive Importer for Infinity Store
 *
 * Improvements over basic version:
 * - API health checks before import
 * - Dependency validation (categories before products, etc)
 * - Error recovery workflow (retry/skip/abort)
 * - Import preview with statistics
 * - Comprehensive dashboard
 * - Better error handling
 */

const path = require("path");
const readline = require("readline");

const config = require(path.join(__dirname, "woocommerce-importer", "config"));
const { WooCommerceClient, StrapiClient } = require(path.join(__dirname, "woocommerce-importer", "utils", "ApiClient"));
const Logger = require(path.join(__dirname, "woocommerce-importer", "utils", "Logger"));
const DuplicateTracker = require(path.join(__dirname, "woocommerce-importer", "utils", "DuplicateTracker"));
const CategoryImporter = require(path.join(__dirname, "woocommerce-importer", "importers", "CategoryImporter"));
const ProductImporter = require(path.join(__dirname, "woocommerce-importer", "importers", "ProductImporter"));
const VariationImporter = require(path.join(__dirname, "woocommerce-importer", "importers", "VariationImporter"));
const OrderImporter = require(path.join(__dirname, "woocommerce-importer", "importers", "OrderImporter"));
const UserImporter = require(path.join(__dirname, "woocommerce-importer", "importers", "UserImporter"));
const CategoryMapper = require(path.join(__dirname, "woocommerce-importer", "utils", "CategoryMapper"));

const logger = new Logger();
const duplicateTracker = new DuplicateTracker(config, logger);
const categoryMapper = new CategoryMapper(config, logger);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function askNumber(prompt, defaultValue) {
  const suffix = defaultValue !== undefined ? ` (${defaultValue})` : "";
  const answer = await ask(`${prompt}${suffix}: `);
  if (!answer) {
    return defaultValue;
  }
  const value = Number.parseInt(answer, 10);
  if (Number.isNaN(value) || value <= 0) {
    console.log("❌ Please enter a positive number.");
    return askNumber(prompt, defaultValue);
  }
  return value;
}

async function askBoolean(prompt, defaultValue = false) {
  const def = defaultValue ? "Y/n" : "y/N";
  const answer = await ask(`${prompt} [${def}]: `);
  if (!answer) {
    return defaultValue;
  }
  const normalized = answer.toLowerCase();
  if (["y", "yes"].includes(normalized)) {
    return true;
  }
  if (["n", "no"].includes(normalized)) {
    return false;
  }
  console.log("❌ Please answer yes or no.");
  return askBoolean(prompt, defaultValue);
}

async function askCategories(prompt = "Enter category IDs (comma-separated, leave blank for all)") {
  const answer = await ask(`${prompt}: `);
  if (!answer || answer.trim() === "") {
    return [];
  }
  const categoryIds = answer
    .split(",")
    .map(id => parseInt(id.trim()))
    .filter(id => !isNaN(id));
  if (categoryIds.length === 0) {
    console.log("⚠️ No valid category IDs provided. Will import all products.");
    return [];
  }
  console.log(`✓ Selected categories: [${categoryIds.join(", ")}]`);
  return categoryIds;
}

async function pause(message = "Press ENTER to continue...") {
  await ask(`\n${message}`);
}

function printDivider() {
  console.log("\n═══════════════════════════════════════════════════════════════");
}

function buildImporter(type) {
  switch (type) {
    case "categories":
      return new CategoryImporter(config, logger);
    case "products":
      return new ProductImporter(config, logger);
    case "variations":
      return new VariationImporter(config, logger);
    case "orders":
      return new OrderImporter(config, logger);
    case "users":
      return new UserImporter(config, logger);
    default:
      throw new Error(`Unknown importer type: ${type}`);
  }
}

/**
 * ✨ NEW: Check API health before import
 */
async function checkApiHealth() {
  printDivider();
  console.log("🔍 Checking API Health...\n");

  const wooClient = new WooCommerceClient(config, logger);
  const strapiClient = new StrapiClient(config, logger);

  let wooStatus = "❌ Unknown";
  let strapiStatus = "❌ Unknown";
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

  if (wooStatus.includes("❌") || strapiStatus.includes("❌")) {
    console.log("\n⚠️  One or more APIs are unreachable!");
    const proceed = await askBoolean("Continue anyway?", false);
    if (!proceed) {
      return false;
    }
  }

  console.log("\n✅ API health check complete!");
  return true;
}

/**
 * ✨ NEW: Validate import dependencies
 */
async function validateImportDependencies(type) {
  const stats = duplicateTracker.getStats();

  const checks = {
    products: {
      description: "Products require categories to be imported first",
      required: "categories",
      checkFn: () => (stats.categories?.total || 0) > 0
    },
    variations: {
      description: "Variations require products to be imported first",
      required: "products",
      checkFn: () => (stats.products?.total || 0) > 0
    },
    orders: {
      description: "Orders require products and users to be imported first",
      required: "products, users",
      checkFn: () => (stats.products?.total || 0) > 0 && (stats.users?.total || 0) > 0
    }
  };

  if (!checks[type]) {
    return true; // No dependencies for this type
  }

  const check = checks[type];
  if (!check.checkFn()) {
    console.log(`\n⚠️  WARNING: ${check.description}`);
    const proceed = await askBoolean("Continue anyway?", false);
    return proceed;
  }

  return true;
}

/**
 * ✨ NEW: Show import preview and statistics
 */
async function showImportPreview(type, options) {
  printDivider();
  console.log(`📋 Import Preview: ${type.toUpperCase()}\n`);

  try {
    const importer = buildImporter(type);
    const dryRunStats = await importer.import({ ...options, dryRun: true });

    console.log("📊 Preview Results:");
    console.log(`  ├─ Total to import: ${dryRunStats.success || 0}`);
    console.log(`  ├─ Would skip: ${dryRunStats.skipped || 0}`);
    console.log(`  ├─ Would update: ${dryRunStats.updated || 0}`);
    console.log(`  └─ Estimated duration: ${estimateImportTime(dryRunStats.success || 0, type)}`);

    // Add type-specific stats
    if (type === "variations" && dryRunStats.variationsCreated !== undefined) {
      console.log(`\n🎨 Variation Details:`);
      console.log(`  ├─ New variations: ${dryRunStats.variationsCreated}`);
      console.log(`  ├─ Updated variations: ${dryRunStats.variationsUpdated}`);
      console.log(`  └─ With discounts: ~${Math.ceil((dryRunStats.variationsCreated || 0) * 0.15)} (estimated)`);
    }

    const proceed = await askBoolean("\nProceed with actual import?", false);
    return proceed;
  } catch (error) {
    console.log(`❌ Preview failed: ${error.message}`);
    return false;
  }
}

/**
 * ✨ NEW: Import with error recovery
 */
async function runImportWithRecovery(type, options) {
  const importer = buildImporter(type);

  try {
    await importer.import(options);
    console.log(`\n✅ ${type} import completed successfully!`);
    return true;
  } catch (error) {
    console.log(`\n❌ Import error: ${error.message}`);

    const choice = await ask("\n[R]etry [S]kip [A]bort [Q]uit: ");
    switch (choice.toLowerCase()) {
      case "r":
        console.log("🔄 Retrying...");
        return runImportWithRecovery(type, options);
      case "s":
        console.log("⏭️  Skipping this import...");
        return true;
      case "a":
        console.log("🛑 Aborting import...");
        return false;
      case "q":
        console.log("👋 Quitting...");
        process.exit(0);
      default:
        console.log("❓ Invalid choice");
        return runImportWithRecovery(type, options);
    }
  }
}

/**
 * ✨ NEW: Comprehensive statistics dashboard
 */
async function showStatistics() {
  printDivider();
  console.log("📊 IMPORT STATISTICS DASHBOARD\n");

  const stats = duplicateTracker.getStats();

  const types = ["categories", "products", "variations", "orders", "users"];
  const maxLength = Math.max(...types.map(t => t.length));

  console.log("Import Status:");
  for (const type of types) {
    const count = stats[type]?.total || 0;
    const typeLabel = type.padEnd(maxLength);
    const statusIcon = count > 0 ? "✅" : "⏳";
    console.log(`  ${statusIcon} ${typeLabel}: ${count} items`);
  }

  // Total summary
  const totalImported = types.reduce((sum, type) => sum + (stats[type]?.total || 0), 0);
  console.log(`\n📈 Total Imported: ${totalImported} items`);

  // Calculate percentages of completion
  const estimatedTotals = {
    categories: 1000,  // rough estimate
    products: 5000,    // rough estimate
    variations: 15000, // rough estimate
    orders: 2000,      // rough estimate
    users: 500         // rough estimate
  };

  console.log("\n📊 Estimated Completion:");
  for (const type of types) {
    const imported = stats[type]?.total || 0;
    const estimated = estimatedTotals[type];
    const percent = Math.min(100, Math.round((imported / estimated) * 100));
    const bar = "█".repeat(Math.floor(percent / 5)) + "░".repeat(20 - Math.floor(percent / 5));
    console.log(`  ${type.padEnd(maxLength)} [${bar}] ${percent}%`);
  }

  // Last import info
  console.log("\n⏱️  Recent Activity:");
  const allTypes = ["categories", "products", "variations", "orders", "users"];
  for (const type of allTypes) {
    const importer = buildImporter(type);
    const progress = importer.loadProgressState();
    if (progress.totalProcessed > 0) {
      console.log(`  • ${type}: ${progress.totalProcessed} items (last: ${progress.lastProcessedAt || "never"})`);
    }
  }
}

/**
 * Estimate import duration based on type
 */
function estimateImportTime(count, type) {
  const speeds = {
    categories: 50,    // items per second
    products: 20,
    variations: 10,
    orders: 15,
    users: 30
  };

  const speed = speeds[type] || 20;
  const seconds = Math.ceil(count / speed);
  const minutes = Math.ceil(seconds / 60);

  if (minutes < 1) {
    return "< 1 minute";
  } else if (minutes === 1) {
    return "~1 minute";
  } else {
    return `${minutes}-${minutes + 1} minutes`;
  }
}

async function runImport(type, options) {
  // Validate dependencies
  const validDeps = await validateImportDependencies(type);
  if (!validDeps) {
    return;
  }

  // Show preview
  const showPreview = await askBoolean("Show preview before import?", true);
  if (showPreview) {
    const shouldProceed = await showImportPreview(type, options);
    if (!shouldProceed) {
      console.log("❌ Import cancelled");
      return;
    }
  }

  // Run with error recovery
  await runImportWithRecovery(type, options);
}

async function runFullImport(limit, dryRun) {
  const sequence = [
    { name: "Categories", type: "categories", limit: limit * 2 },
    { name: "Users", type: "users", limit },
    { name: "Products", type: "products", limit },
    { name: "Variations", type: "variations", limit: limit * 3 },
    { name: "Orders", type: "orders", limit },
  ];

  for (const step of sequence) {
    printDivider();
    console.log(`▶️  Importing ${step.name} (limit ${step.limit}, dryRun: ${dryRun})`);

    const options = {
      limit: step.limit,
      page: 1,
      dryRun,
      onlyImported: step.type === "variations" ? false : undefined,
    };

    await runImport(step.type, options);
  }

  console.log("\n🎉 Full import sequence completed!");
}

async function resetProgress(type) {
  const map = {
    categories: () => buildImporter("categories").resetProgressState(),
    products: () => buildImporter("products").resetProgressState(),
    variations: () => buildImporter("variations").resetProgressState(),
    orders: () => buildImporter("orders").resetProgressState(),
    users: () => buildImporter("users").resetProgressState(),
  };

  if (type === "all") {
    const confirm = await askBoolean("Reset ALL import progress?", false);
    if (!confirm) {
      console.log("❌ Reset cancelled");
      return;
    }

    for (const [key, fn] of Object.entries(map)) {
      try {
        fn();
        console.log(`✅ Reset ${key} progress`);
      } catch (error) {
        console.error(`❌ Failed to reset ${key}:`, error.message);
      }
    }
    return;
  }

  if (!map[type]) {
    console.error("❌ Unknown type. Available: all, categories, products, variations, orders, users");
    return;
  }

  const confirm = await askBoolean(`Reset ${type} progress?`, false);
  if (!confirm) {
    console.log("❌ Reset cancelled");
    return;
  }

  try {
    map[type]();
    console.log(`✅ Reset ${type} progress`);
  } catch (error) {
    console.error(`❌ Failed to reset ${type}:`, error.message);
  }
}

async function previewWooCommerceCategories() {
  printDivider();
  console.log("Fetching categories from WooCommerce...");

  const wooClient = new WooCommerceClient(config, logger);
  const perPage = Math.min(config.import.batchSizes.categories || 100, 100);
  let page = 1;
  let totalPages = 1;
  const categories = [];

  try {
    while (page <= totalPages) {
      const { data, totalPages: responsePages } = await wooClient.getCategories(page, perPage);
      if (Array.isArray(data)) {
        categories.push(...data);
      }
      totalPages = responsePages || totalPages;
      if (!responsePages || data?.length === 0) {
        break;
      }
      page += 1;
    }
  } catch (error) {
    console.error("❌ Failed to fetch categories from WooCommerce:", error.message);
    return;
  }

  if (categories.length === 0) {
    console.log("ℹ️  No categories retrieved from WooCommerce.");
    return;
  }

  console.log(`\n✅ Retrieved ${categories.length} category records from WooCommerce.\n`);

  const byParent = new Map();
  for (const category of categories) {
    const parentId = category.parent || 0;
    if (!byParent.has(parentId)) {
      byParent.set(parentId, []);
    }
    byParent.get(parentId).push(category);
  }

  function printCategory(category, indent = 0) {
    const prefix = " ".repeat(indent * 2);
    const countStr = byParent.has(category.id) ? ` (${byParent.get(category.id).length} children)` : "";
    console.log(`${prefix}├─ ${category.name} (ID: ${category.id})${countStr}`);
    const children = byParent.get(category.id) || [];
    children.sort((a, b) => a.name.localeCompare(b.name, "fa"));
    for (const child of children) {
      printCategory(child, Math.min(indent + 1, 3));
    }
  }

  const roots = (byParent.get(0) || []).sort((a, b) => a.name.localeCompare(b.name, "fa"));
  const maxDisplay = 50;
  let displayed = 0;

  for (const root of roots) {
    if (displayed >= maxDisplay) {
      break;
    }
    printCategory(root);
    displayed += 1;
  }

  if (roots.length === 0) {
    console.log("ℹ️  All categories retrieved have non-zero parent IDs.");
  } else if (displayed < roots.length) {
    console.log(`\n... and ${roots.length - displayed} more top-level categories not shown.`);
  }

  console.log(`\n💡 Tip: Use category IDs above with --categories option for targeted imports`);
}

/**
 * ✨ NEW: Category Mapping Management
 */
async function manageCategoryMappings() {
  let continueMapping = true;
  while (continueMapping) {
    printDivider();
    console.log("🗂️ CATEGORY MAPPING MANAGER");
    console.log("Map WooCommerce → Strapi categories before importing products\n");
    console.log("  1) 📂 View WooCommerce categories");
    console.log("  2) 📂 View Strapi categories");
    console.log("  3) 🤖 Auto-suggest mappings (smart matching)");
    console.log("  4) ➕ Create custom mapping");
    console.log("  5) 📋 View current mappings");
    console.log("  6) 🗑️ Delete mapping");
    console.log("  7) 🧹 Clear all mappings");
    console.log("  0) 👈 Back to main menu");

    const choice = await ask("\nEnter choice: ");
    switch (choice) {
      case "1":
        await displayWooCommerceCategories();
        break;
      case "2":
        await displayStrapiCategories();
        break;
      case "3":
        await handleMappingSuggestions();
        break;
      case "4":
        await createCustomMapping();
        break;
      case "5":
        await viewAllMappings();
        break;
      case "6":
        await deleteMapping();
        break;
      case "7": {
        const confirm = await askBoolean("Clear ALL mappings?", false);
        if (confirm) {
          categoryMapper.clearAllMappings();
          console.log("✅ All mappings cleared");
        }
        break;
      }
      case "0":
        continueMapping = false;
        break;
      default:
        console.log("❌ Invalid choice");
    }
    if (continueMapping && choice !== "0") {
      await pause();
    }
  }
}

async function displayWooCommerceCategories() {
  console.log("\n📂 Fetching WooCommerce categories...\n");
  try {
    const wooClient = new WooCommerceClient(config, logger);
    const categories = [];
    let page = 1, totalPages = 1;
    while (page <= totalPages) {
      const { data, totalPages: tp } = await wooClient.getCategories(page, 100);
      if (Array.isArray(data)) categories.push(...data);
      totalPages = tp || totalPages;
      if (!tp || data?.length === 0) break;
      page += 1;
    }
    if (categories.length === 0) {
      console.log("ℹ️ No categories found");
      return;
    }
    console.log(`✅ Found ${categories.length} categories\n`);
    const formatted = categoryMapper.formatCategoryHierarchy(categories);
    for (const line of formatted.slice(0, 25)) console.log(line);
    if (formatted.length > 25) console.log(`... and ${formatted.length - 25} more`);

    const strapiClient = new StrapiClient(config, logger);
    const strapiResult = await strapiClient.getCategories({ pagination: { pageSize: 1000 } });
    console.log("");
    categoryMapper.displayMappingStatus(categories, strapiResult.data || []);
  } catch (error) {
    console.error("❌ Failed to fetch categories:", error.message);
  }
}

async function displayStrapiCategories() {
  console.log("\n📂 Fetching Strapi categories...\n");
  try {
    const strapiClient = new StrapiClient(config, logger);
    const result = await strapiClient.getCategories({ pagination: { pageSize: 1000 } });
    const categories = result.data || [];
    if (categories.length === 0) {
      console.log("ℹ️ No categories found");
      return;
    }
    console.log(`✅ Found ${categories.length} categories\n`);
    for (const cat of categories) {
      // Strapi categories use 'Title' field, not DisplayName or Name
      const name = cat.attributes?.Title || cat.Title || "Unknown";
      console.log(`  • ${name.padEnd(30)} (ID: ${cat.id})`);
    }
  } catch (error) {
    console.error("❌ Failed to fetch categories:", error.message);
  }
}

async function handleMappingSuggestions() {
  console.log("\n🤖 Finding best category matches...\n");
  try {
    const wooClient = new WooCommerceClient(config, logger);
    const strapiClient = new StrapiClient(config, logger);
    const wcResult = await wooClient.getCategories(1, 100);
    const strapiResult = await strapiClient.getCategories({ pagination: { pageSize: 1000 } });
    const wcCategories = wcResult.data || [];
    const strapiCategories = strapiResult.data || [];

    if (wcCategories.length === 0 || strapiCategories.length === 0) {
      console.log("ℹ️ Not enough data for suggestions");
      return;
    }

    const suggestions = categoryMapper.getSuggestions(wcCategories, strapiCategories);
    if (suggestions.length === 0) {
      console.log("ℹ️ No unmapped categories or no good suggestions");
      return;
    }
    console.log(`✅ Found ${suggestions.length} suggestions\n`);

    for (let i = 0; i < suggestions.length; i++) {
      const sugg = suggestions[i];
      console.log(`\n[${i + 1}/${suggestions.length}]`);
      console.log(`  📦 WooCommerce: ${sugg.woocommerce.name} (ID: ${sugg.woocommerce.id})`);
      // Strapi categories use 'Title' field in attributes
      const strapiName = sugg.suggested.attributes?.Title || sugg.suggested.Title || "Unknown";
      console.log(`  📁 Suggested: ${strapiName} (ID: ${sugg.suggested.id})`);
      console.log(`  🎯 Confidence: ${sugg.confidence}%`);

      const accept = await askBoolean("Accept this mapping?", sugg.confidence > 80);
      if (accept) {
        categoryMapper.setMapping(
          sugg.woocommerce.id,
          sugg.suggested.id,
          sugg.woocommerce.name,
          strapiName
        );
      }
    }
    console.log("\n✅ Suggestion review complete");
  } catch (error) {
    console.error("❌ Failed:", error.message);
  }
}

async function createCustomMapping() {
  console.log("\n➕ Create Custom Mapping\n");
  try {
    const wcId = await askNumber("WooCommerce Category ID");
    const strapiId = await askNumber("Strapi Category ID");
    categoryMapper.setMapping(wcId, strapiId, `WC-${wcId}`, `Strapi-${strapiId}`);
    console.log("✅ Mapping created");
  } catch (error) {
    console.error("❌ Failed:", error.message);
  }
}

async function viewAllMappings() {
  console.log("\n📋 Current Mappings\n");
  const mappings = categoryMapper.getAllMappings();
  if (Object.keys(mappings).length === 0) {
    console.log("ℹ️ No mappings yet");
    return;
  }
  for (const [wcId, mapping] of Object.entries(mappings)) {
    console.log(`  📦 WC ${wcId} (${mapping.wcName}) → 📁 Strapi ${mapping.strapiId}`);
  }
}

async function deleteMapping() {
  console.log("\n🗑️ Delete Mapping\n");
  const wcId = await askNumber("WooCommerce Category ID");
  const confirm = await askBoolean("Confirm deletion?", false);
  if (confirm) {
    categoryMapper.deleteMapping(wcId);
    console.log("✅ Deleted");
  }
}

async function mainMenu() {
  printDivider();
  console.log("🚀 INFINITY INTERACTIVE IMPORTER (ENHANCED)");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("📊 IMPORT OPTIONS:");
  console.log("  1) 📁 Import categories");
  console.log("  2) 📦 Import products (with category filtering ✨)");
  console.log("  3) 🎨 Import variations (with discount pricing ✨)");
  console.log("  4) 📋 Import orders");
  console.log("  5) 👥 Import users");
  console.log("  6) 🚀 Full import (recommended order)");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("⚙️  SETUP & UTILITIES:");
  console.log("  7) 🗂️ Category Mapping Manager (DO THIS FIRST!)");
  console.log("  8) 📊 Show import statistics");
  console.log("  9) 🔍 Preview WooCommerce categories");
  console.log("  10) 💚 Check API health");
  console.log("  11) 🔄 Reset import progress");
  console.log("  0) 👋 Exit");

  const choice = await ask("\nEnter choice (0-11): ");
  switch (choice) {
    case "1": {
      const limit = await askNumber("Limit", 100);
      const page = await askNumber("Starting page", 1);
      const dryRun = await askBoolean("Dry run", false);
      await runImport("categories", { limit, page, dryRun });
      await pause();
      return true;
    }
    case "2": {
      const limit = await askNumber("Limit", 50);
      const page = await askNumber("Starting page", 1);
      const filterByCategories = await askBoolean("Filter by specific categories?", false);
      let categoryIds = [];
      if (filterByCategories) {
        categoryIds = await askCategories("Enter WooCommerce category IDs (comma-separated, e.g., 5,12,18)");
      }
      const dryRun = await askBoolean("Dry run", false);
      await runImport("products", { limit, page, dryRun, categoryIds });
      await pause();
      return true;
    }
    case "3": {
      const limit = await askNumber("Limit", 100);
      const page = await askNumber("Starting page", 1);
      const dryRun = await askBoolean("Dry run", false);
      const onlyImported = await askBoolean("Only for already imported products", false);
      const force = await askBoolean("Force re-import from page 1 (ignores progress)", false);
      await runImport("variations", { limit, page, dryRun, onlyImported, force });
      await pause();
      return true;
    }
    case "4": {
      const limit = await askNumber("Limit", 50);
      const page = await askNumber("Starting page", 1);
      const dryRun = await askBoolean("Dry run", false);
      await runImport("orders", { limit, page, dryRun });
      await pause();
      return true;
    }
    case "5": {
      const limit = await askNumber("Limit", 50);
      const page = await askNumber("Starting page", 1);
      const dryRun = await askBoolean("Dry run", false);
      await runImport("users", { limit, page, dryRun });
      await pause();
      return true;
    }
    case "6": {
      const limit = await askNumber("Limit per type", 50);
      const dryRun = await askBoolean("Dry run", false);
      const confirm = await askBoolean("Run FULL import sequence?", false);
      if (confirm) {
        await runFullImport(limit, dryRun);
      } else {
        console.log("❌ Full import cancelled");
      }
      await pause();
      return true;
    }
    case "7": {
      await manageCategoryMappings();
      return true;
    }
    case "8": {
      await showStatistics();
      await pause();
      return true;
    }
    case "9": {
      await previewWooCommerceCategories();
      await pause();
      return true;
    }
    case "10": {
      await checkApiHealth();
      await pause();
      return true;
    }
    case "11": {
      const type = await ask("Type to reset (all/categories/products/variations/orders/users) [all]: ");
      await resetProgress(type || "all");
      await pause();
      return true;
    }
    case "0":
      return false;
    default:
      console.log("❌ Unknown choice. Please select a valid option (0-11).");
      return true;
  }
}

async function main() {
  try {
    // Initial API health check
    console.log("\n🔍 Performing initial health check...");
    const healthOk = await checkApiHealth();

    if (!healthOk) {
      console.log("\n⚠️  Exiting due to API issues");
      process.exit(1);
    }

    let keepRunning = true;
    while (keepRunning) {
      keepRunning = await mainMenu();
    }

    console.log("\n👋 Thanks for using Infinity Interactive Importer!");
  } catch (error) {
    console.error("\n❌ Interactive importer failed:", error.message);
  } finally {
    rl.close();
    process.exit(0);
  }
}

main();
