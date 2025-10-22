#!/usr/bin/env node
/**
 * Interactive importer for Infinity Store.
 * Provides a menu-driven CLI that orchestrates the WooCommerce → Strapi importers.
 */

const path = require("path");
const readline = require("readline");

const config = require(path.join(__dirname, "woocommerce-importer", "config"));
const { WooCommerceClient } = require(path.join(__dirname, "woocommerce-importer", "utils", "ApiClient"));
const Logger = require(path.join(__dirname, "woocommerce-importer", "utils", "Logger"));
const CategoryImporter = require(path.join(__dirname, "woocommerce-importer", "importers", "CategoryImporter"));
const ProductImporter = require(path.join(__dirname, "woocommerce-importer", "importers", "ProductImporter"));
const VariationImporter = require(path.join(__dirname, "woocommerce-importer", "importers", "VariationImporter"));
const OrderImporter = require(path.join(__dirname, "woocommerce-importer", "importers", "OrderImporter"));
const UserImporter = require(path.join(__dirname, "woocommerce-importer", "importers", "UserImporter"));

const logger = new Logger();

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
    console.log("Please enter a positive number.");
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
  console.log("Please answer yes or no.");
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
    console.log("No valid category IDs provided. Will import all products.");
    return [];
  }
  console.log(`✓ Selected categories: [${categoryIds.join(", ")}]`);
  return categoryIds;
}

async function pause(message = "Press ENTER to return to the menu...") {
  await ask(`\n${message}`);
}

function printDivider() {
  console.log("\n──────────────────────────────────────────────────────");
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

async function runImport(type, options) {
  const importer = buildImporter(type);
  await importer.import(options);
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
    console.log(`▶ Importing ${step.name} (limit ${step.limit}, dryRun: ${dryRun})`);
    await runImport(step.type, {
      limit: step.limit,
      page: 1,
      dryRun,
      onlyImported: step.type === "variations" ? false : undefined,
    });
  }
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
    for (const [key, fn] of Object.entries(map)) {
      try {
        fn();
        console.log(`✔ Reset ${key} progress`);
      } catch (error) {
        console.error(`✖ Failed to reset ${key}:`, error.message);
      }
    }
    return;
  }

  if (!map[type]) {
    console.error("Unknown type. Available: all, categories, products, variations, orders, users");
    return;
  }

  try {
    map[type]();
    console.log(`✔ Reset ${type} progress`);
  } catch (error) {
    console.error(`✖ Failed to reset ${type}:`, error.message);
  }
}

async function showStatus() {
  const importers = [
    { name: "Categories", type: "categories" },
    { name: "Products", type: "products" },
    { name: "Variations", type: "variations" },
    { name: "Orders", type: "orders" },
    { name: "Users", type: "users" },
  ];

  printDivider();
  console.log("Current progress status:");

  for (const item of importers) {
    try {
      const importer = buildImporter(item.type);
      const progress = importer.loadProgressState();
      console.log(`• ${item.name}`);
      console.log(`  Last completed page : ${progress.lastCompletedPage}`);
      console.log(`  Total processed     : ${progress.totalProcessed}`);
      console.log(`  Last processed at   : ${progress.lastProcessedAt || "Never"}`);
    } catch (error) {
      console.error(`✖ Failed to load ${item.name} progress:`, error.message);
    }
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
    console.error("✖ Failed to fetch categories from WooCommerce:", error.message);
    return;
  }

  if (categories.length === 0) {
    console.log("No categories retrieved from WooCommerce.");
    return;
  }

  console.log(`Retrieved ${categories.length} category records from WooCommerce.`);

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
    console.log(`${prefix}- ${category.name} (ID: ${category.id})`);
    const children = byParent.get(category.id) || [];
    children.sort((a, b) => a.name.localeCompare(b.name, "fa"));
    for (const child of children) {
      printCategory(child, Math.min(indent + 1, 4));
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
    console.log("All categories retrieved have non-zero parent IDs; please verify WooCommerce data.");
  } else if (displayed < roots.length) {
    console.log(`…and ${roots.length - displayed} more top-level categories not shown.`);
  }
}

async function mainMenu() {
  printDivider();
  console.log("🚀 Infinity Interactive Importer");
  console.log("═══════════════════════════════════════════════════════");
  console.log("📊 Import Options:");
  console.log("  1) Import categories");
  console.log("  2) Import products (with category filtering ✨)");
  console.log("  3) Import variations (with discount pricing ✨)");
  console.log("  4) Import orders");
  console.log("  5) Import users");
  console.log("  6) Full import (recommended order)");
  console.log("═══════════════════════════════════════════════════════");
  console.log("⚙️  Utilities:");
  console.log("  7) Reset import progress");
  console.log("  8) Show import status");
  console.log("  9) Preview WooCommerce categories");
  console.log("  0) Exit");

  const choice = await ask("\nEnter choice: ");
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
      await runImport("variations", { limit, page, dryRun, onlyImported });
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
      await runFullImport(limit, dryRun);
      await pause();
      return true;
    }
    case "7": {
      const type = await ask("Type to reset (all/categories/products/variations/orders/users) (all): ");
      await resetProgress(type || "all");
      await pause();
      return true;
    }
    case "8": {
      await showStatus();
      await pause();
      return true;
    }
    case "9": {
      await previewWooCommerceCategories();
      await pause();
      return true;
    }
    case "0":
      return false;
    default:
      console.log("Unknown choice. Please select a valid option.");
      return true;
  }
}

async function main() {
  try {
    let keepRunning = true;
    while (keepRunning) {
      keepRunning = await mainMenu();
    }
  } catch (error) {
    console.error("❌ Interactive importer failed:", error.message);
  } finally {
    rl.close();
    process.exit(0);
  }
}

main();
