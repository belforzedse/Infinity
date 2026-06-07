#!/usr/bin/env node

/**
 * WooCommerce → Strapi catalog sync CLI.
 *
 * WooCommerce is read-only (source of truth). Strapi is the writable target.
 *
 * Commands:
 *   dry-run  — preview changes without writing to Strapi
 *   sync     — apply catalog sync (categories, products, variations, media)
 *   verify   — compare both stores and report alignment
 */

const fs = require("fs");
const path = require("path");

// Resolve dependencies from woocommerce-importer/node_modules when run from apps/backend
const localNodeModules = path.join(__dirname, "node_modules");
if (fs.existsSync(localNodeModules)) {
  module.paths.unshift(localNodeModules);
}

// Load backend env files when present (optional — credentials may also be exported in shell)
try {
  require("dotenv").config({ path: path.join(__dirname, "../../.env") });
  require("dotenv").config({ path: path.join(__dirname, "../../.env.local") });
} catch {
  // dotenv is optional
}

const { program } = require("commander");

const ENV_CONFIG = {
  production: {
    strapiUrl: "https://api.infinitycolor.co/api",
    trackingDir: "./import-tracking/production",
    tokenEnv: "STRAPI_API_TOKEN_PRODUCTION",
  },
  staging: {
    strapiUrl: process.env.STRAPI_IMPORT_STAGING_URL || "https://api.infinity.rgbgroup.ir/api",
    trackingDir: "./import-tracking/staging",
    tokenEnv: "STRAPI_API_TOKEN_STAGING",
  },
  local: {
    strapiUrl: process.env.STRAPI_IMPORT_LOCAL_URL || "http://localhost:1337/api",
    trackingDir: "./import-tracking/local",
    tokenEnv: "STRAPI_API_TOKEN_LOCAL",
  },
};

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function applyEnvironment(envName) {
  const envConfig = ENV_CONFIG[envName];
  if (!envConfig) {
    throw new Error(`Unknown environment: ${envName}. Use production, staging, or local.`);
  }

  process.env.STRAPI_IMPORT_PRODUCTION_URL = envConfig.strapiUrl;
  process.env.IMPORT_TRACKING_DIR = envConfig.trackingDir;
  process.env.IMPORT_FILTER_IN_STOCK_ONLY = "false";

  if (envName === "production") {
    process.env.STRAPI_API_TOKEN_PRODUCTION =
      process.env.STRAPI_API_TOKEN_PRODUCTION || requireEnv("STRAPI_API_TOKEN_PRODUCTION");
  } else if (envName === "staging") {
    process.env.STRAPI_API_TOKEN_STAGING =
      process.env.STRAPI_API_TOKEN_STAGING || requireEnv(envConfig.tokenEnv);
  } else {
    process.env.STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || requireEnv(envConfig.tokenEnv);
  }

  return envConfig;
}

function buildConfig(envName, envConfig) {
  // Load config after env vars are set
  const config = require("./config");

  config.strapi.baseUrl = envConfig.strapiUrl;
  config.strapi.usePublicAccess = false;
  config.duplicateTracking.storageDir = envConfig.trackingDir;
  config.import.filters.inStockOnly = false;

  if (envName === "production") {
    config.strapi.auth.token = process.env.STRAPI_API_TOKEN_PRODUCTION.trim();
  } else if (envName === "staging") {
    config.strapi.auth.token = (process.env.STRAPI_API_TOKEN_STAGING || "").trim();
  } else {
    config.strapi.auth.token = (process.env.STRAPI_API_TOKEN_LOCAL || process.env.STRAPI_API_TOKEN || "").trim();
  }

  return config;
}

function parseCommonOptions(opts) {
  return {
    environment: opts.env || "production",
    limit: opts.limit ? Number.parseInt(opts.limit, 10) : 999999,
    page: opts.page ? Number.parseInt(opts.page, 10) : 1,
    variationLimit: opts.variationLimit ? Number.parseInt(opts.variationLimit, 10) : 9999999,
    skipCategories: Boolean(opts.skipCategories),
    skipMedia: Boolean(opts.skipMedia),
    repairDuplicates: Boolean(opts.repairDuplicates),
    deactivateStrapiOnly: Boolean(opts.deactivateStrapiOnly),
    strictMedia: Boolean(opts.strictMedia),
    allowStrapiOnly: Boolean(opts.allowStrapiOnly),
    logLevel: opts.logLevel || process.env.IMPORT_LOG_LEVEL || "info",
  };
}

async function main() {
  program
    .name("catalog-sync")
    .description("WooCommerce → Strapi catalog sync (WC read-only, Strapi writable)");

  program
    .command("dry-run")
    .description("Preview sync changes without writing to Strapi")
    .option("--env <name>", "Target environment: production, staging, local", "production")
    .option("--limit <n>", "Max WooCommerce products to process")
    .option("--page <n>", "Starting page for product import", "1")
    .option("--variation-limit <n>", "Max variations to process")
    .option("--skip-categories", "Skip category sync")
    .option("--skip-media", "Skip image/video upload")
    .option("--repair-duplicates", "Run dedup before sync")
    .option("--log-level <level>", "Log level: error, warn, info, debug")
    .action(async (options) => {
      await runCommand("dry-run", options);
    });

  program
    .command("sync")
    .description("Apply catalog sync from WooCommerce to Strapi")
    .option("--env <name>", "Target environment: production, staging, local", "production")
    .option("--limit <n>", "Max WooCommerce products to process")
    .option("--page <n>", "Starting page for product import", "1")
    .option("--variation-limit <n>", "Max variations to process")
    .option("--skip-categories", "Skip category sync")
    .option("--skip-media", "Skip image/video upload")
    .option("--repair-duplicates", "Run dedup before sync")
    .option(
      "--deactivate-strapi-only",
      "Set Status=InActive on Strapi products not found in WooCommerce",
    )
    .option("--log-level <level>", "Log level: error, warn, info, debug")
    .action(async (options) => {
      await runCommand("sync", options);
    });

  program
    .command("verify")
    .description("Compare WooCommerce and Strapi catalogs after syncing")
    .option("--env <name>", "Target environment: production, staging, local", "production")
    .option("--limit <n>", "Max WooCommerce items to verify")
    .option("--strict-media", "Fail verify when media counts differ")
    .option("--allow-strapi-only", "Do not fail when Strapi-only items exist")
    .option("--log-level <level>", "Log level: error, warn, info, debug")
    .action(async (options) => {
      await runCommand("verify", options);
    });

  await program.parseAsync(process.argv);
}

async function runCommand(command, options) {
  requireEnv("WOOCOMMERCE_CONSUMER_KEY");
  requireEnv("WOOCOMMERCE_CONSUMER_SECRET");

  const parsedOptions = parseCommonOptions(options);
  const envConfig = applyEnvironment(parsedOptions.environment);
  process.env.IMPORT_LOG_LEVEL = parsedOptions.logLevel;

  const config = buildConfig(parsedOptions.environment, envConfig);
  config.logging.level = parsedOptions.logLevel;
  config.logging.saveToFile = process.env.IMPORT_LOG_SAVE_TO_FILE !== "false";

  const Logger = require("./utils/Logger");
  const logger = new Logger(config.logging);
  const CatalogSyncEngine = require("./sync/CatalogSyncEngine");

  logger.info(`Catalog sync command: ${command}`);
  logger.info(`Environment: ${parsedOptions.environment}`);
  logger.info(`Strapi API: ${config.strapi.baseUrl}`);
  logger.info(`Tracking: ${path.resolve(process.cwd(), config.duplicateTracking.storageDir)}`);
  logger.info("WooCommerce is read-only (source of truth)");

  const engine = new CatalogSyncEngine(config, logger, parsedOptions);

  try {
    if (command === "verify") {
      const result = await engine.runVerify({
        limit: parsedOptions.limit,
        strictMedia: parsedOptions.strictMedia,
        allowStrapiOnly: parsedOptions.allowStrapiOnly,
      });
      process.exit(result.exitCode);
    }

    const dryRun = command === "dry-run";
    const report = await engine.runSync(dryRun);

    if (report.hasBlockingIssues({ allowStrapiOnly: true })) {
      logger.warn("Sync completed with failures — review sync report");
      process.exit(1);
    }

    logger.success(`Catalog ${command} completed successfully`);
  } catch (error) {
    logger.error(`Catalog ${command} failed: ${error.message}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
