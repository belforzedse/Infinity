#!/usr/bin/env node
"use strict";

/**
 * Catalog importer TUI.
 *
 * WooCommerce is read-only source of truth; Strapi is the only writable target.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

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

const { buildConfig } = require("./config");
const { CatalogEngine } = require("./engine");
const { PRESETS, SCOPES, resolvePreset } = require("./lib/presets");
const Logger = require("../utils/Logger");

const OrderImporter = require("../importers/OrderImporter");
const UserImporter = require("../importers/UserImporter");
const BlogPostImporter = require("../importers/BlogPostImporter");
const { syncShippingLocations } = require("../utils/ShippingSeeder");
const { dedup, fullDedup } = require("../dedup-variations-by-external-id");

const ENVIRONMENTS = ["production", "staging", "local"];
const READ_ONLY_BANNER =
  "WooCommerce is READ-ONLY source of truth. Strapi is the only writable target.";

function parseBooleanInput(value, defaultValue = false) {
  if (typeof value === "boolean") return value;
  if (value === undefined || value === null || String(value).trim() === "") {
    return Boolean(defaultValue);
  }
  const normalized = String(value).trim().toLowerCase();
  if (["y", "yes", "true", "1"].includes(normalized)) return true;
  if (["n", "no", "false", "0"].includes(normalized)) return false;
  throw new Error(`Expected yes/no, got: ${value}`);
}

function parseLimitInput(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return Infinity;
  }
  const parsed = Number(String(value).trim());
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Limit must be a positive integer or blank for all.");
  }
  return parsed;
}

function buildCustomRunOpts({ scope, dryRun, skipMedia, limit }) {
  const resolvedScope = String(scope || "").trim();
  if (!SCOPES.includes(resolvedScope)) {
    throw new Error(`Invalid scope: ${scope}. Use one of: ${SCOPES.join(", ")}`);
  }
  return {
    scope: resolvedScope,
    dryRun: parseBooleanInput(dryRun, true),
    skipMedia: parseBooleanInput(skipMedia, false),
    limit: parseLimitInput(limit),
  };
}

function prompt(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function pause(rl) {
  await prompt(rl, "\nPress Enter to continue...");
}

async function askBoolean(rl, question, defaultValue) {
  while (true) {
    try {
      return parseBooleanInput(await prompt(rl, question), defaultValue);
    } catch (error) {
      console.log(error.message);
    }
  }
}

async function askPositiveInteger(rl, question, defaultValue) {
  while (true) {
    const value = await prompt(rl, question);
    if (!value) return defaultValue;
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
    console.log("Enter a positive integer.");
  }
}

async function askLimit(rl, question = "Limit products (blank = all): ") {
  while (true) {
    try {
      return parseLimitInput(await prompt(rl, question));
    } catch (error) {
      console.log(error.message);
    }
  }
}

function requireStartupEnv() {
  const missing = ["WOOCOMMERCE_CONSUMER_KEY", "WOOCOMMERCE_CONSUMER_SECRET"].filter(
    (name) => !process.env[name] || process.env[name].trim() === "",
  );
  if (missing.length === 0) return true;

  console.error("Missing required WooCommerce credentials:");
  for (const name of missing) {
    console.error(`  ${name}`);
  }
  console.error("\nSet them in your shell or apps/backend/.env, then rerun:");
  console.error("  WOOCOMMERCE_CONSUMER_KEY=...");
  console.error("  WOOCOMMERCE_CONSUMER_SECRET=...");
  return false;
}

function createRuntime(environment) {
  const { config } = buildConfig(environment);
  config.logging.level = process.env.IMPORT_LOG_LEVEL || config.logging.level || "info";
  const logger = new Logger(config.logging);
  const engine = new CatalogEngine(config, logger, { environment });
  return { environment, config, logger, engine };
}

async function selectEnvironment(rl) {
  while (true) {
    const input = await prompt(rl, "Select environment (production/staging/local, default: local): ");
    const environment = input || "local";
    if (!ENVIRONMENTS.includes(environment)) {
      console.log(`Unknown environment: ${environment}. Use production, staging, or local.`);
      continue;
    }
    try {
      const runtime = createRuntime(environment);
      console.log(`Using Strapi: ${runtime.config.strapi.baseUrl}`);
      return runtime;
    } catch (error) {
      console.log(`Cannot use ${environment}: ${error.message}`);
    }
  }
}

function renderHeader(runtime) {
  console.clear();
  console.log("=".repeat(80));
  console.log("Catalog Importer TUI");
  console.log(READ_ONLY_BANNER);
  console.log(`Environment: ${runtime.environment}`);
  console.log(`Strapi URL:  ${runtime.config.strapi.baseUrl}`);
  console.log("=".repeat(80));
}

function printCounters(title, counters) {
  console.log(`\n${title}`);
  for (const [name, c] of Object.entries(counters)) {
    console.log(
      `  ${name.padEnd(11)} created=${c.created} updated=${c.updated} unchanged=${c.unchanged} ` +
        `skipped=${c.skipped} duplicate=${c.duplicate} deleted=${c.deleted} failed=${c.failed}`,
    );
  }
}

function inferReportPath(config, reportJson) {
  return path.join(
    config.catalog.trackingDirAbs,
    "sync-reports",
    `${reportJson.command}-${reportJson.runAt.replace(/[:.]/g, "-")}.json`,
  );
}

function printReportSummary(config, report) {
  const json = report.toJSON();
  const seconds = (json.durationMs / 1000).toFixed(1);
  console.log("\nCatalog run summary");
  console.log(`  Command:  ${json.command}`);
  console.log(`  Duration: ${seconds}s`);
  printCounters("Entities", json.entities);
  console.log("\nMedia");
  console.log(`  uploaded=${json.media.uploaded} reused=${json.media.reused} failed=${json.media.failed}`);
  console.log(`\nFailures: ${json.failures.length}`);
  console.log(`Report: ${inferReportPath(config, json)}`);
}

function printVerifySummary(result) {
  console.log("\nVerify summary");
  console.log(`  OK: ${result.ok ? "yes" : "no"}`);
  console.log(`  WooCommerce-only: ${result.wcOnly.length}`);
  console.log(`  Strapi-only:      ${result.strapiOnly.length}`);
  if (result.wcOnly.length > 0) {
    console.log(`  Example WC-only ids: ${result.wcOnly.slice(0, 10).join(", ")}`);
  }
}

async function confirmLiveRun(rl, runtime, runOpts) {
  if (runOpts.dryRun) return true;

  console.log("\nLive Strapi write confirmation");
  console.log(`  Environment: ${runtime.environment}`);
  console.log(`  Strapi URL:  ${runtime.config.strapi.baseUrl}`);
  console.log(`  Scope:       ${runOpts.scope}`);
  console.log(`  Limit:       ${runOpts.limit === Infinity ? "all" : runOpts.limit}`);
  const confirm = await prompt(rl, `Type "${runOpts.scope}" to confirm: `);
  if (confirm !== runOpts.scope) {
    console.log("Run cancelled.");
    return false;
  }
  return true;
}

async function runCatalogPreset(rl, runtime, presetId) {
  const preset = resolvePreset(presetId);
  const limit = await askLimit(rl);

  if (preset.verify) {
    const result = await runtime.engine.runVerify({ limit });
    printVerifySummary(result);
    await pause(rl);
    return;
  }

  const runOpts = { ...preset.run, dryRun: Boolean(preset.run?.dryRun), limit };
  if (!runOpts.dryRun && preset.confirm) {
    const confirmed = await confirmLiveRun(rl, runtime, runOpts);
    if (!confirmed) {
      await pause(rl);
      return;
    }
  }

  const report = await runtime.engine.runSync(runOpts);
  printReportSummary(runtime.config, report);
  await pause(rl);
}

async function runCustomCatalog(rl, runtime) {
  console.log(`\nValid scopes: ${SCOPES.join(", ")}`);
  const scope = await prompt(rl, "Scope: ");
  const dryRun = await prompt(rl, "Dry run? (y/n, default: y): ");
  const skipMedia = await prompt(rl, "Skip media? (y/n, default: n): ");
  const limit = await prompt(rl, "Limit products (blank = all): ");
  const runOpts = buildCustomRunOpts({ scope, dryRun, skipMedia, limit });

  const confirmed = await confirmLiveRun(rl, runtime, runOpts);
  if (!confirmed) {
    await pause(rl);
    return;
  }

  const report = await runtime.engine.runSync(runOpts);
  printReportSummary(runtime.config, report);
  await pause(rl);
}

async function runLegacyImporter(rl, runtime, type) {
  const defaults = {
    orders: { limit: 50, page: 1, dryRun: false },
    users: { limit: 100, page: 1, dryRun: true },
  }[type];

  const limit = await askPositiveInteger(rl, `Limit (default: ${defaults.limit}): `, defaults.limit);
  const page = await askPositiveInteger(rl, `Starting page (default: ${defaults.page}): `, defaults.page);
  const dryRun = await askBoolean(
    rl,
    `Dry run? (y/n, default: ${defaults.dryRun ? "y" : "n"}): `,
    defaults.dryRun,
  );

  const Importer = type === "orders" ? OrderImporter : UserImporter;
  const importer = new Importer(runtime.config, runtime.logger);
  const stats = await importer.import({ limit, page, dryRun });
  console.log(`\n${type} import completed.`);
  if (stats) console.log(JSON.stringify(stats, null, 2));
  await pause(rl);
}

async function runBlogPosts(rl, runtime) {
  const defaultBatchSize = runtime.config.import.batchSizes.blogPosts || 20;
  const limit = await askPositiveInteger(rl, "Limit (default: 100): ", 100);
  const page = await askPositiveInteger(rl, "Starting page (default: 1): ", 1);
  const dryRun = await askBoolean(rl, "Dry run? (y/n, default: y): ", true);
  const status = (await prompt(rl, "WordPress status (publish,draft,future, default: publish): ")) || "publish";
  const after = (await prompt(rl, "Only import posts created after (blank = none): ")) || null;
  const batchSize = await askPositiveInteger(
    rl,
    `Posts per page (default: ${defaultBatchSize}): `,
    defaultBatchSize,
  );

  const importer = new BlogPostImporter(runtime.config, runtime.logger);
  const stats = await importer.import({ limit, page, batchSize, status, after, dryRun });
  console.log("\nblog posts import completed.");
  if (stats) console.log(JSON.stringify(stats, null, 2));
  await pause(rl);
}

async function runShipping(rl, runtime) {
  await syncShippingLocations(runtime.config, runtime.logger);
  await pause(rl);
}

async function collectDedupOptions(rl, liveConfirmWord) {
  const dryRun = await askBoolean(rl, "Run in dry-run mode? (y/n, default: y): ", true);
  const ignoreForbidden = await askBoolean(
    rl,
    "Ignore forbidden relation endpoints and continue deletes? (y/n, default: n): ",
    false,
  );

  let skipRelations = [];
  if (ignoreForbidden) {
    const shouldSkip = await askBoolean(
      rl,
      "Skip order-items/product-variation-logs checks entirely? (y/n, default: y): ",
      true,
    );
    if (shouldSkip) {
      skipRelations = ["order-items", "product-variation-logs"];
    }
    const skipStocks = await askBoolean(rl, "Skip product-stocks rewiring entirely? (y/n, default: n): ", false);
    if (skipStocks) {
      skipRelations = [...new Set([...skipRelations, "product-stocks"])];
    }
  }

  if (!dryRun) {
    const confirm = await prompt(rl, `Type "${liveConfirmWord}" to confirm running live: `);
    if (confirm !== liveConfirmWord) {
      console.log("Deduplication cancelled.");
      return null;
    }
  }

  return { dryRun, ignoreForbidden, skipRelations };
}

async function runVariationDedup(rl) {
  console.log("\nDeduplicate Product Variations (external_id)");
  console.log("This will merge duplicate variations and rewire related records.");
  console.log("A dry run is recommended first.\n");
  const options = await collectDedupOptions(rl, "dedup");
  if (options) await dedup(options);
  await pause(rl);
}

async function runFullDedup(rl) {
  console.log("\nFull Deduplication (Products + Variations by external_id)");
  console.log("This will deduplicate both products and variations by external_id.");
  console.log("A dry run is recommended first.\n");
  const options = await collectDedupOptions(rl, "full-dedup");
  if (options) await fullDedup(options);
  await pause(rl);
}

function findLastReport(config) {
  const dir = path.join(config.catalog.trackingDirAbs, "sync-reports");
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const filePath = path.join(dir, file);
      return { filePath, mtimeMs: fs.statSync(filePath).mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  return files[0]?.filePath || null;
}

async function viewStatus(rl, runtime) {
  console.log("\nStatus");
  console.log(`  Environment:  ${runtime.environment}`);
  console.log(`  Strapi URL:   ${runtime.config.strapi.baseUrl}`);
  console.log(`  Tracking dir: ${runtime.config.catalog.trackingDirAbs}`);

  const lastReport = findLastReport(runtime.config);
  if (!lastReport) {
    console.log("  Last report:  none");
    await pause(rl);
    return;
  }

  console.log(`  Last report:  ${lastReport}`);
  try {
    const parsed = JSON.parse(fs.readFileSync(lastReport, "utf8"));
    console.log(`  Command:      ${parsed.command}`);
    console.log(`  Run at:       ${parsed.runAt}`);
    console.log(`  Failures:     ${parsed.failures?.length || 0}`);
  } catch (error) {
    console.log(`  Could not read last report: ${error.message}`);
  }
  await pause(rl);
}

function renderMenu() {
  const entries = [];
  let number = 1;
  const add = (group, label, action) => entries.push({ key: String(number++), group, label, action });

  console.log("\nCatalog presets");
  for (const preset of PRESETS) {
    add("catalog", `${preset.label} - ${preset.description}`, { type: "preset", id: preset.id });
    console.log(`  ${entries[entries.length - 1].key}. ${preset.label} - ${preset.description}`);
  }

  console.log("\nCustom");
  add("custom", "Custom...", { type: "custom" });
  console.log(`  ${entries[entries.length - 1].key}. Custom...`);

  console.log("\nLegacy (bridge)");
  for (const item of [
    ["Orders", { type: "legacy", id: "orders" }],
    ["Users", { type: "legacy", id: "users" }],
    ["Blog posts", { type: "legacy", id: "blog-posts" }],
    ["Sync shipping locations", { type: "legacy", id: "shipping" }],
    ["Dedup variations", { type: "legacy", id: "dedup" }],
    ["Full dedup", { type: "legacy", id: "full-dedup" }],
  ]) {
    add("legacy", item[0], item[1]);
    console.log(`  ${entries[entries.length - 1].key}. ${item[0]}`);
  }

  console.log("\nUtilities");
  for (const item of [
    ["Change environment", { type: "change-env" }],
    ["View last report / status", { type: "status" }],
    ["Exit", { type: "exit" }],
  ]) {
    add("utilities", item[0], item[1]);
    console.log(`  ${entries[entries.length - 1].key}. ${item[0]}`);
  }

  return entries;
}

async function dispatchAction(rl, runtimeRef, action) {
  switch (action.type) {
    case "preset":
      await runCatalogPreset(rl, runtimeRef.current, action.id);
      break;
    case "custom":
      await runCustomCatalog(rl, runtimeRef.current);
      break;
    case "legacy":
      if (action.id === "orders") await runLegacyImporter(rl, runtimeRef.current, "orders");
      if (action.id === "users") await runLegacyImporter(rl, runtimeRef.current, "users");
      if (action.id === "blog-posts") await runBlogPosts(rl, runtimeRef.current);
      if (action.id === "shipping") await runShipping(rl, runtimeRef.current);
      if (action.id === "dedup") await runVariationDedup(rl);
      if (action.id === "full-dedup") await runFullDedup(rl);
      break;
    case "change-env":
      runtimeRef.current = await selectEnvironment(rl);
      break;
    case "status":
      await viewStatus(rl, runtimeRef.current);
      break;
    case "exit":
      return false;
    default:
      console.log("Unknown action.");
  }
  return true;
}

async function main() {
  if (!requireStartupEnv()) {
    process.exitCode = 1;
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.on("SIGINT", () => {
    console.log("\nExiting.");
    rl.close();
    process.exit(0);
  });

  try {
    const runtimeRef = { current: await selectEnvironment(rl) };

    while (true) {
      renderHeader(runtimeRef.current);
      const entries = renderMenu();
      const choice = await prompt(rl, "\nEnter your choice: ");
      const entry = entries.find((item) => item.key === choice);
      if (!entry) {
        console.log("Invalid choice.");
        await pause(rl);
        continue;
      }

      try {
        const shouldContinue = await dispatchAction(rl, runtimeRef, entry.action);
        if (!shouldContinue) break;
      } catch (error) {
        console.log(`\nAction failed: ${error.message}`);
        await pause(rl);
      }
    }
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  buildCustomRunOpts,
  parseBooleanInput,
  parseLimitInput,
  inferReportPath,
  main,
};
