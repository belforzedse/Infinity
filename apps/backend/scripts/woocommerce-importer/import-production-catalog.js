#!/usr/bin/env node

/**
 * Production catalog import wrapper.
 *
 * Imports the complete WooCommerce catalog into the production Strapi API:
 * categories, products with media, and all product variations/stock/attributes.
 *
 * This script intentionally resets importer progress files while preserving
 * mapping files, so already-imported entities are updated/reused instead of
 * duplicated and previously skipped products can be reconsidered.
 */

const fs = require("fs");
const path = require("path");

const HELP_FLAGS = new Set(["-h", "--help"]);

function parseArgs(argv) {
  const options = {
    dryRun: false,
    resetProgress: true,
    importCategories: true,
    importProducts: true,
    importVariations: true,
    categoryLimit: 999999,
    productLimit: 999999,
    variationLimit: 9999999,
    productPage: 1,
    maxImagesPerProduct: 999,
    logLevel: process.env.IMPORT_LOG_LEVEL || "info",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--no-reset-progress") {
      options.resetProgress = false;
    } else if (arg === "--skip-categories") {
      options.importCategories = false;
    } else if (arg === "--skip-products") {
      options.importProducts = false;
    } else if (arg === "--skip-variations") {
      options.importVariations = false;
    } else if (arg.startsWith("--category-limit=")) {
      options.categoryLimit = parsePositiveInt(arg.split("=")[1], "category-limit");
    } else if (arg === "--category-limit") {
      options.categoryLimit = parsePositiveInt(argv[++i], "category-limit");
    } else if (arg.startsWith("--product-limit=")) {
      options.productLimit = parsePositiveInt(arg.split("=")[1], "product-limit");
    } else if (arg === "--product-limit") {
      options.productLimit = parsePositiveInt(argv[++i], "product-limit");
    } else if (arg.startsWith("--variation-limit=")) {
      options.variationLimit = parsePositiveInt(arg.split("=")[1], "variation-limit");
    } else if (arg === "--variation-limit") {
      options.variationLimit = parsePositiveInt(argv[++i], "variation-limit");
    } else if (arg.startsWith("--product-page=")) {
      options.productPage = parsePositiveInt(arg.split("=")[1], "product-page");
    } else if (arg === "--product-page") {
      options.productPage = parsePositiveInt(argv[++i], "product-page");
    } else if (arg.startsWith("--max-images-per-product=")) {
      options.maxImagesPerProduct = parsePositiveInt(arg.split("=")[1], "max-images-per-product");
    } else if (arg === "--max-images-per-product") {
      options.maxImagesPerProduct = parsePositiveInt(argv[++i], "max-images-per-product");
    } else if (arg.startsWith("--log-level=")) {
      options.logLevel = arg.split("=")[1] || options.logLevel;
    } else if (arg === "--log-level") {
      options.logLevel = argv[++i] || options.logLevel;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function parsePositiveInt(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`--${label} must be a positive integer`);
  }
  return parsed;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/woocommerce-importer/import-production-catalog.js [options]

Required environment:
  WOOCOMMERCE_CONSUMER_KEY
  WOOCOMMERCE_CONSUMER_SECRET
  STRAPI_API_TOKEN_PRODUCTION

Options:
  --dry-run                         Preview importer actions without writing to Strapi
  --no-reset-progress               Keep existing progress files
  --skip-categories                 Do not run category import
  --skip-products                   Do not run product import
  --skip-variations                 Do not run variation update-all import
  --category-limit <n>              Category import limit (default: 999999)
  --product-limit <n>               Product import limit (default: 999999)
  --variation-limit <n>             Variation import/update limit (default: 9999999)
  --product-page <n>                Product page to start from after reset (default: 1)
  --max-images-per-product <n>      Max product gallery media items (default: 999)
  --log-level <level>               error, warn, info, or debug (default: IMPORT_LOG_LEVEL or info)
  -h, --help                        Show this help

Small live smoke test:
  node scripts/woocommerce-importer/import-production-catalog.js --product-limit 5 --variation-limit 20 --skip-categories
`);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function removeFileIfExists(filePath, logger) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  fs.unlinkSync(filePath);
  logger.info(`Reset progress file: ${filePath}`);
  return true;
}

function resetProgressFiles(trackingDir, logger) {
  fs.mkdirSync(trackingDir, { recursive: true });

  const progressFiles = [
    "product-import-progress.json",
    "variation-import-progress.json",
    "variation-import-imported-progress.json",
    "variation-import-missing-progress.json",
  ];

  let removed = 0;
  for (const filename of progressFiles) {
    if (removeFileIfExists(path.join(trackingDir, filename), logger)) {
      removed += 1;
    }
  }

  for (const filename of fs.readdirSync(trackingDir)) {
    if (/^product-import-progress-cat-\d+\.json$/.test(filename)) {
      if (removeFileIfExists(path.join(trackingDir, filename), logger)) {
        removed += 1;
      }
    }
  }

  if (removed === 0) {
    logger.info("No progress files needed reset");
  }
}

async function main() {
  if (process.argv.slice(2).some((arg) => HELP_FLAGS.has(arg))) {
    printHelp();
    return;
  }

  const options = parseArgs(process.argv.slice(2));

  requireEnv("WOOCOMMERCE_CONSUMER_KEY");
  requireEnv("WOOCOMMERCE_CONSUMER_SECRET");
  requireEnv("STRAPI_API_TOKEN_PRODUCTION");

  process.env.STRAPI_IMPORT_PRODUCTION_URL =
    process.env.STRAPI_IMPORT_PRODUCTION_URL || "https://api.infinitycolor.co/api";
  process.env.IMPORT_TRACKING_DIR =
    process.env.IMPORT_TRACKING_DIR || "./import-tracking/production";
  process.env.IMPORT_FILTER_IN_STOCK_ONLY = "false";
  process.env.IMPORT_IMAGES_ENABLE_UPLOAD = process.env.IMPORT_IMAGES_ENABLE_UPLOAD || "true";
  process.env.IMPORT_VIDEOS_ENABLE_UPLOAD = process.env.IMPORT_VIDEOS_ENABLE_UPLOAD || "true";
  process.env.IMPORT_IMAGES_MAX_PER_PRODUCT =
    process.env.IMPORT_IMAGES_MAX_PER_PRODUCT || String(options.maxImagesPerProduct);
  process.env.IMPORT_BATCH_PRODUCTS = process.env.IMPORT_BATCH_PRODUCTS || "100";
  process.env.IMPORT_BATCH_VARIATIONS = process.env.IMPORT_BATCH_VARIATIONS || "100";
  process.env.IMPORT_LOG_LEVEL = options.logLevel;

  const config = require("./config");
  const Logger = require("./utils/Logger");
  const CategoryImporter = require("./importers/CategoryImporter");
  const ProductImporter = require("./importers/ProductImporter");
  const VariationImporter = require("./importers/VariationImporter");

  config.strapi.baseUrl = "https://api.infinitycolor.co/api";
  config.strapi.auth.token = process.env.STRAPI_API_TOKEN_PRODUCTION.trim();
  config.strapi.usePublicAccess = false;
  config.duplicateTracking.storageDir = "./import-tracking/production";
  config.import.filters.inStockOnly = false;
  config.import.images.enableUpload = true;
  config.import.videos.enableUpload = true;
  config.import.images.maxImagesPerProduct = options.maxImagesPerProduct;
  config.logging.level = options.logLevel;
  config.logging.saveToFile = process.env.IMPORT_LOG_SAVE_TO_FILE !== "false";

  const logger = new Logger(config.logging);
  const trackingDir = path.resolve(process.cwd(), config.duplicateTracking.storageDir);

  logger.info("Starting production catalog import wrapper");
  logger.info(`Target Strapi API: ${config.strapi.baseUrl}`);
  logger.info(`Tracking directory: ${trackingDir}`);
  logger.info(`Dry run: ${options.dryRun}`);
  logger.info("Product name filter disabled");
  logger.info("Product and variation stock filters disabled");

  if (options.resetProgress) {
    resetProgressFiles(config.duplicateTracking.storageDir, logger);
  } else {
    logger.warn("Progress reset skipped by --no-reset-progress");
  }

  const startedAt = Date.now();
  const stats = {};

  if (options.importCategories) {
    logger.info(`Running category import (limit: ${options.categoryLimit})`);
    const categoryImporter = new CategoryImporter(config, logger);
    stats.categories = await categoryImporter.import({
      limit: options.categoryLimit,
      page: 1,
      dryRun: options.dryRun,
    });
  }

  if (options.importProducts) {
    logger.info(`Running product import (limit: ${options.productLimit})`);
    const productImporter = new ProductImporter(config, logger);
    stats.products = await productImporter.import({
      limit: options.productLimit,
      page: options.productPage,
      dryRun: options.dryRun,
      categoryIds: [],
      nameFilter: null,
      onlyInStock: false,
      inStockOnly: false,
    });
  }

  if (options.importVariations) {
    logger.info(`Running variation update-all import (limit: ${options.variationLimit})`);
    const variationImporter = new VariationImporter(config, logger);
    stats.variations = await variationImporter.import({
      limit: options.variationLimit,
      page: 1,
      dryRun: options.dryRun,
      onlyImported: true,
      force: true,
      nameFilter: null,
      logParentNames: true,
      scanImportedProducts: true,
      missingOnly: false,
    });
  }

  const durationSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  logger.success(`Production catalog import wrapper completed in ${durationSeconds}s`);

  for (const [type, stat] of Object.entries(stats)) {
    logger.info(
      `${type}: success=${stat.success || 0}, updated=${stat.updated || 0}, skipped=${
        stat.skipped || 0
      }, failed=${stat.failed || 0}, errors=${stat.errors || 0}`,
    );
  }
}

main().catch((error) => {
  console.error(`Production catalog import failed: ${error.message}`);
  process.exit(1);
});
