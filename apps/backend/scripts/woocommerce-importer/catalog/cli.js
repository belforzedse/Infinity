#!/usr/bin/env node
"use strict";

/**
 * Catalog importer CLI: WooCommerce (read-only source of truth) → Strapi (target).
 *
 *   node catalog/cli.js dry-run --env local --limit 20
 *   node catalog/cli.js sync    --env production
 *   node catalog/cli.js verify  --env production
 */

const fs = require("fs");
const path = require("path");

// Resolve deps from the importer's node_modules when launched from elsewhere.
const localNodeModules = path.join(__dirname, "..", "node_modules");
if (fs.existsSync(localNodeModules)) {
  module.paths.unshift(localNodeModules);
}

// Optional env files (credentials may also come from the shell).
try {
  require("dotenv").config({ path: path.join(__dirname, "../../../.env") });
  require("dotenv").config({ path: path.join(__dirname, "../../../.env.local") });
} catch {
  /* dotenv optional */
}

const { program } = require("commander");
const { buildConfig } = require("./config");
const Logger = require("../utils/Logger");
const { CatalogEngine } = require("./engine");

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

async function run(command, options) {
  requireEnv("WOOCOMMERCE_CONSUMER_KEY");
  requireEnv("WOOCOMMERCE_CONSUMER_SECRET");

  const environment = options.env || "production";
  process.env.IMPORT_LOG_LEVEL = options.logLevel || process.env.IMPORT_LOG_LEVEL || "info";

  const { config } = buildConfig(environment);
  config.logging.level = process.env.IMPORT_LOG_LEVEL;

  const logger = new Logger(config.logging);
  logger.info(`Catalog ${command} → env=${environment}, Strapi=${config.strapi.baseUrl}`);
  logger.info("WooCommerce is read-only (source of truth)");

  const engine = new CatalogEngine(config, logger, { environment });

  if (command === "verify") {
    const result = await engine.runVerify({ limit: options.limit ? Number(options.limit) : Infinity });
    process.exit(result.ok ? 0 : 1);
  }

  const report = await engine.runSync({
    dryRun: command === "dry-run",
    scope: options.scope || (options.skipCategories ? "no-media" : "full"),
    skipMedia: Boolean(options.skipMedia),
    limit: options.limit ? Number(options.limit) : Infinity,
  });

  process.exit(report.hasFailures() ? 1 : 0);
}

function commonOptions(cmd) {
  return cmd
    .option("--env <name>", "Target environment: production, staging, local", "production")
    .option("--limit <n>", "Max products to process")
    .option("--log-level <level>", "error | warn | info | debug");
}

async function main() {
  program.name("catalog").description("WooCommerce → Strapi catalog importer (idempotent)");

  commonOptions(program.command("dry-run").description("Preview without writing"))
    .option("--scope <name>", "full | no-media | categories | stock | price | media", "full")
    .option("--skip-media", "Skip media upload")
    .action((opts) => run("dry-run", opts));

  commonOptions(program.command("sync").description("Apply catalog sync"))
    .option("--scope <name>", "full | no-media | categories | stock | price | media", "full")
    .option("--skip-media", "Skip media upload")
    .action((opts) => run("sync", opts));

  commonOptions(program.command("verify").description("Compare WooCommerce and Strapi catalogs"))
    .action((opts) => run("verify", opts));

  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
