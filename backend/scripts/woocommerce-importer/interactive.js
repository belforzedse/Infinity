#!/usr/bin/env node

/**
 * Enhanced Interactive WooCommerce Importer
 *
 * User-friendly menu-driven interface for importing WooCommerce data to Strapi
 * with support for all entity types: Categories, Products, Variations, Orders, Users
 */

const readline = require("readline");
const CategoryImporter = require("./importers/CategoryImporter");
const ProductImporter = require("./importers/ProductImporter");
const VariationImporter = require("./importers/VariationImporter");
const OrderImporter = require("./importers/OrderImporter");
const UserImporter = require("./importers/UserImporter");
const BlogPostImporter = require("./importers/BlogPostImporter");
const DuplicateTracker = require("./utils/DuplicateTracker");
const { syncShippingLocations } = require("./utils/ShippingSeeder");
const Logger = require("./utils/Logger");
const config = require("./config");

// Initialize
const logger = new Logger();
let duplicateTracker = new DuplicateTracker(config, logger);

// Create readline interface for prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Prompt the user with a question and return their trimmed response.
 * @param {string} question - The prompt text displayed to the user.
 * @returns {Promise<string>} The trimmed user input.
 */
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Normalize a date-like input into an ISO 8601 timestamp string, adjusting date-only inputs to the requested boundary.
 *
 * @param {string|Date|null|undefined} value - The input date value; empty or falsy values produce `null`.
 * @param {"after"|"before"|undefined} boundary - When the input is date-only (no time component), adjust the result:
 *   use `"after"` to return the timestamp at the start of the next day, `"before"` to return the timestamp at the end of the given day.
 * @returns {string|null} An ISO 8601 timestamp string representing the normalized date/time, or `null` for empty input.
 * @throws {Error} If the input cannot be parsed as a valid date.
 */
function normalizeDateInput(value, boundary) {
  if (!value) {
    return null;
  }

  const raw = String(value).trim();
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }

  const isDateOnly = DATE_ONLY_REGEX.test(raw);
  let timestamp = parsed.getTime();

  if (isDateOnly && boundary === "after") {
    timestamp += ONE_DAY_MS;
  } else if (isDateOnly && boundary === "before") {
    timestamp += ONE_DAY_MS - 1;
  }

  return new Date(timestamp).toISOString();
}

/**
 * Format a date-like value as an ISO 8601 string for display.
 *
 * If `value` is falsy, returns an empty string. If `value` can be parsed to a valid Date, returns its ISO string; otherwise returns the original `value`.
 * @param {*} value - A date value (Date object, timestamp, or date string).
 * @returns {*} The ISO 8601 string when parseable, an empty string for falsy input, or the original value when parsing fails.
 */
function formatDateDisplay(value) {
  if (!value) {
    return "";
  }

  try {
    return new Date(value).toISOString();
  } catch (error) {
    return value;
  }
}

/**
 * Verify connectivity to external APIs and prompt the user if any check fails.
 *
 * Checks WooCommerce and Strapi APIs and, when blog post import is enabled, WordPress as well.
 * Logs each API's status and measured response time, and prompts the user to continue if any check fails.
 *
 * @returns {boolean} `true` if all required API checks succeeded or the user chose to continue despite failures, `false` if the user declined to proceed after failures.
 */
async function checkApiHealth() {
  console.log("\n🔍 Checking API Health...\n");

  const { WooCommerceClient, StrapiClient, WordPressClient } = require("./utils/ApiClient");
  const wooClient = new WooCommerceClient(config, logger);
  const strapiClient = new StrapiClient(config, logger);
  const wpClient = new WordPressClient(config, logger);

  let wooStatus = "❌ Unknown";
  let strapiStatus = "❌ Unknown";
  let wordpressStatus = "⏭️ Skipped (blog import disabled)";
  let wooResponseTime = 0;
  let strapiResponseTime = 0;
  let wordpressResponseTime = 0;

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

  if (importOptions.blogPosts?.enabled) {
    try {
      const startTime = Date.now();
      await wpClient.getPosts(1, 1, { status: "publish" });
      wordpressResponseTime = Date.now() - startTime;
      wordpressStatus = `✅ Connected (${wordpressResponseTime}ms)`;
    } catch (error) {
      wordpressStatus = `❌ Failed (${error.message})`;
    }
  }

  console.log(`WooCommerce API:  ${wooStatus}`);
  console.log(`Strapi API:       ${strapiStatus}`);
  if (importOptions.blogPosts?.enabled) {
    console.log(`WordPress API:    ${wordpressStatus}`);
  }

  const hasFailure =
    wooStatus.includes("❌") ||
    strapiStatus.includes("❌") ||
    (importOptions.blogPosts?.enabled && wordpressStatus.includes("❌"));

  if (hasFailure) {
    console.log("\n⚠️  One or more APIs are unreachable!");
    const proceed = await prompt("Continue anyway? (y/n): ");
    if (proceed.toLowerCase() !== "y") {
      return false;
    }
  }

  console.log("\n✅ API health check complete!");
  return true;
}

/**
 * Check that required imports for a given importer type have been performed and prompt the user if a dependency is missing.
 * @param {string} type - Importer type to validate (e.g., "products", "variations", "orders").
 * @returns {boolean} `true` if dependencies are satisfied or the user chose to continue despite missing dependencies, `false` otherwise.
 */
async function validateImportDependencies(type) {
  const stats = duplicateTracker.getStats();

  const checks = {
    products: {
      description: "Products require categories to be imported first",
      required: "categories",
      checkFn: () => (stats.categories?.total || 0) > 0,
    },
    variations: {
      description: "Variations require products to be imported first",
      required: "products",
      checkFn: () => (stats.products?.total || 0) > 0,
    },
    orders: {
      description: "Orders require products and users to be imported first",
      required: "products, users",
      checkFn: () => (stats.products?.total || 0) > 0 && (stats.users?.total || 0) > 0,
    },
  };

  if (!checks[type]) {
    return true; // No dependencies for this type
  }

  const check = checks[type];
  if (!check.checkFn()) {
    console.log(`\n⚠️  WARNING: ${check.description}`);
    const proceed = await prompt("Continue anyway? (y/n): ");
    return proceed.toLowerCase() === "y";
  }

  return true;
}

/**
 * Display a dry-run preview for the specified importer and prompt the user whether to proceed with the real import.
 *
 * @param {string} type - Importer identifier: "categories", "users", "products", "variations", "orders", or "blogPosts".
 * @param {Object} options - Importer-specific options (e.g., limit, page, dryRun override, date/keyword filters, categoryIds, batchSize).
 * @returns {boolean} `true` if the user confirms proceeding with the actual import, `false` otherwise (also `false` if the preview fails).
 */
async function showImportPreview(type, options) {
  console.log(`\n📋 Preview: ${type.toUpperCase()}`);
  console.log("Running dry-run to show preview...\n");

  try {
    let importer;
    if (type === "categories") {
      importer = new CategoryImporter(config, logger);
    } else if (type === "users") {
      importer = new UserImporter(config, logger);
    } else if (type === "products") {
      importer = new ProductImporter(config, logger);
    } else if (type === "variations") {
      importer = new VariationImporter(config, logger);
    } else if (type === "orders") {
      importer = new OrderImporter(config, logger);
    } else if (type === "blogPosts") {
      importer = new BlogPostImporter(config, logger);
    }

    const dryRunStats = await importer.import({ ...options, dryRun: true });

    console.log("\n📊 Preview Results:");
    console.log(`  ├─ Total to process: ${dryRunStats.total || 0}`);
    console.log(`  ├─ Would import: ${dryRunStats.success || 0}`);
    console.log(`  ├─ Would skip: ${dryRunStats.skipped || 0}`);
    console.log(`  └─ Would fail: ${dryRunStats.failed || 0}`);

    const proceed = await prompt("\nProceed with actual import? (y/n): ");
    return proceed.toLowerCase() === "y";
  } catch (error) {
    console.log(`❌ Preview failed: ${error.message}`);
    return false;
  }
}

// Track selected credentials environment
let selectedCredentialEnv = "production";

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
    useNameFilter: false,
    createdAfter: null,
    createdBefore: null,
    publishedAfter: null, // Only import products uploaded/published after this timestamp
    // Image options
    maxImagesPerProduct: 3, // Default: 3 images per product
    updateProductsWithExistingImages: true, // Always update images, even for existing products to avoid dangling references
  },
  variations: {
    enabled: true,
    limit: 1000000000,
    page: 1,
    dryRun: false,
    onlyImported: true,
    useNameFilter: false,
  },
  orders: { enabled: false, limit: 50, page: 1, dryRun: false },
  blogPosts: {
    enabled: false,
    limit: 100,
    page: 1,
    dryRun: true,
    status: "publish",
    after: null,
    batchSize: config.import.batchSizes.blogPosts || 20,
  },
};

/**
 * Prompt the user to choose a Strapi environment and apply its credentials.
 *
 * Updates global state and configuration to use the selected environment: sets
 * `selectedCredentialEnv`, applies `config.strapi.baseUrl` and `config.strapi.auth.token`,
 * updates `config.duplicateTracking.storageDir`, and recreates the `duplicateTracker`
 * instance with the new storage directory. Waits for the user to press Enter before returning.
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

  console.log("\n📋 Available Environments:\n");
  console.log("  1️⃣  Production");
  console.log("     URL: https://api.infinitycolor.co/api\n");
  console.log("  2️⃣  Staging");
  console.log("     URL: https://api.infinity.rgbgroup.ir/api\n");
  console.log("  3️⃣  Local");
  console.log("     URL: http://localhost:1337/api\n");

  const choice = await prompt("Select environment (1-3, default: 1): ");

  let selected = "production";
  if (choice === "2") {
    selected = "staging";
  } else if (choice === "3") {
    selected = "local";
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
  await prompt("Press Enter to continue...");
}

/**
 * Show the interactive main menu with current credentials and import configuration, then prompt for a choice.
 *
 * Displays current Strapi environment, base URL, per-importer settings (enabled, limits, dry-run and type-specific options),
 * and a numbered list of actions for the user to select.
 * @returns {string} The user's menu choice as entered. 
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

  console.log("📋 Current Import Configuration:\n");

  // Display current settings
  Object.entries(importOptions).forEach(([type, opts]) => {
    const status = opts.enabled ? "✅" : "⭕";
    console.log(`  ${status} ${type.toUpperCase()}`);
    console.log(`     Limit: ${opts.limit} | Dry Run: ${opts.dryRun ? "Yes" : "No"}`);
    if (opts.categoryIds && opts.categoryIds.length > 0) {
      console.log(`     Categories: [${opts.categoryIds.join(", ")}]`);
    }
    // Show image options for products
    if (type === "products") {
      console.log(
        `     Max Images: ${
          opts.maxImagesPerProduct === 999 ? "Unlimited" : opts.maxImagesPerProduct
        }`,
      );
      console.log(
        `     Update Existing Images: ${opts.updateProductsWithExistingImages ? "Yes" : "No"}`,
      );
      console.log(`     Keyword Filter (کیف/کفش): ${opts.useNameFilter ? "On" : "Off"}`);
      if (opts.createdAfter) {
        console.log(`     Created After: ${formatDateDisplay(opts.createdAfter)}`);
      }
      if (opts.createdBefore) {
        console.log(`     Created Before: ${formatDateDisplay(opts.createdBefore)}`);
      }
      if (opts.publishedAfter) {
        console.log(`     Published After: ${formatDateDisplay(opts.publishedAfter)}`);
      }
    }
    // Show variations filter
    if (type === "variations") {
      console.log(`     Only Imported Parents: ${opts.onlyImported ? "Yes" : "No"}`);
      console.log(`     Keyword Filter (کیف/کفش): ${opts.useNameFilter ? "On" : "Off"}`);
    }
    if (type === "blogPosts") {
      console.log(`     WP Status: ${opts.status}`);
      if (opts.after) {
        console.log(`     Created After: ${formatDateDisplay(opts.after)}`);
      }
      console.log(`     Batch Size: ${opts.batchSize}`);
    }
  });

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log("\n📝 Main Menu:\n");
  console.log("  1️⃣  Change Credentials (Production/Staging)");
  console.log("  2️⃣  Configure Categories Import");
  console.log("  3️⃣  Configure Users Import");
  console.log("  4️⃣  Configure Products Import");
  console.log("  5️⃣  Configure Variations Import");
  console.log("  6️⃣  Configure Orders Import");
  console.log("  7️⃣  Configure Blog Posts Import (WordPress)");
  console.log("  8️⃣  Run All Enabled Importers");
  console.log("  9️⃣  View Import Status & Mappings");
  console.log("  🔟  Clear All Mappings (Reset Progress)");
  console.log("  1️⃣1️⃣ Sync Shipping Provinces & Cities");
  console.log("  1️⃣2️⃣ Exit\n");

  const choice = await prompt("Enter your choice (1-12): ");
  return choice;
}

/**
 * Interactively configure options for a named importer.
 *
 * Prompts the user to enable/disable the importer and to set common settings
 * (limit, starting page, dry-run) as well as type-specific options:
 * - products: category filters, image settings, name filter, created/published date filters
 * - variations: restrict to already-imported parents, name filter
 * - blogPosts: WordPress status, created-after filter, batch size
 *
 * @param {string} type - Importer key to configure (e.g., "categories", "users", "products", "variations", "orders", "blogPosts").
 */
async function configureImporter(type) {
  console.clear();
  console.log(`\n🔧 Configure ${type.toUpperCase()} Import\n`);

  const opts = importOptions[type];

  // Enable/disable
  const enable = await prompt(`Enable ${type} import? (y/n): `);
  opts.enabled = enable.toLowerCase() === "y";

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
    opts.dryRun = dryRunInput.toLowerCase() !== "n";
  }

  // Only import variations for already-imported products (only for variations)
  if (type === "variations") {
    const onlyImportedInput = await prompt(
      `Only import variations for products already in mappings? (y/n, default: y): `,
    );
    if (onlyImportedInput.trim()) {
      opts.onlyImported = onlyImportedInput.toLowerCase() !== "n";
      const status = opts.onlyImported ? "✅ ENABLED" : "⭕ DISABLED";
      console.log(
        `${status} - Will ${opts.onlyImported ? "" : "NOT "}filter by imported parent products`,
      );
    }

    const variationNameFilterInput = await prompt(
      `Use default کیف/کفش keyword filter for parent products? (y/n, default: y): `,
    );
    if (variationNameFilterInput.trim()) {
      opts.useNameFilter = variationNameFilterInput.toLowerCase() !== "n";
    }
  }

  if (type === "blogPosts") {
    const statusInput = await prompt(
      `WordPress status to import (publish,draft,future) (default: ${opts.status}): `,
    );
    if (statusInput.trim()) {
      opts.status = statusInput.toLowerCase();
    }

    const afterInput = await prompt(
      `Only import posts created after (YYYY-MM-DD or ISO, 'clear' to remove, leave blank to keep${
        opts.after ? `, current ${formatDateDisplay(opts.after)}` : ""
      }): `,
    );
    if (afterInput) {
      if (afterInput.toLowerCase() === "clear") {
        opts.after = null;
        console.log("⭕ Created-after filter removed");
      } else {
        try {
          opts.after = normalizeDateInput(afterInput, "after");
          console.log(`✅ Created-after filter set to: ${formatDateDisplay(opts.after)}`);
        } catch (error) {
          console.log(`❌ ${error.message}. Keeping previous value.`);
        }
      }
    }

    const batchInput = await prompt(`Posts per page? (default: ${opts.batchSize}): `);
    if (batchInput.trim()) {
      const parsed = parseInt(batchInput);
      if (!Number.isNaN(parsed) && parsed > 0) {
        opts.batchSize = parsed;
      }
    }
  }

  // Category filter (only for products)
  if (type === "products") {
    const catInput = await prompt(
      `Filter by WooCommerce category IDs? (comma-separated, e.g., "5,12,18", or leave blank): `,
    );
    if (catInput.trim()) {
      opts.categoryIds = catInput
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
      if (opts.categoryIds.length > 0) {
        console.log(`✅ Filtering by categories: [${opts.categoryIds.join(", ")}]`);
      }
    }

    // Image configuration options
    console.log("\n🖼️  Image Configuration:");

    // Max images per product
    const maxImagesInput = await prompt(
      `Max gallery images per product? (default: ${opts.maxImagesPerProduct}): `,
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
      `Update products that already have images? (y/n, default: n): `,
    );
    if (updateExistingInput.trim()) {
      opts.updateProductsWithExistingImages = updateExistingInput.toLowerCase() === "y";
      const status = opts.updateProductsWithExistingImages ? "✅ ENABLED" : "⭕ DISABLED";
      console.log(
        `${status} - Will ${
          opts.updateProductsWithExistingImages ? "" : "NOT "
        }update products with existing images`,
      );
    }

    const productNameFilterInput = await prompt(
      `Use default کیف/کفش keyword filter for products? (y/n, default: y): `,
    );
    if (productNameFilterInput.trim()) {
      opts.useNameFilter = productNameFilterInput.toLowerCase() !== "n";
    }

    const createdAfterInput = await prompt(
      `Created-after filter (YYYY-MM-DD or ISO, 'clear' to remove, leave blank to keep${
        opts.createdAfter ? `, current ${formatDateDisplay(opts.createdAfter)}` : ""
      }): `,
    );
    if (createdAfterInput) {
      if (createdAfterInput.toLowerCase() === "clear") {
        opts.createdAfter = null;
        console.log("⭕ Created-after filter removed");
      } else {
        try {
          opts.createdAfter = normalizeDateInput(createdAfterInput, "after");
          console.log(`✅ Created-after filter set to: ${formatDateDisplay(opts.createdAfter)}`);
        } catch (error) {
          console.log(`❌ ${error.message}. Keeping previous value.`);
        }
      }
    }

    const createdBeforeInput = await prompt(
      `Created-before filter (YYYY-MM-DD or ISO, 'clear' to remove, leave blank to keep${
        opts.createdBefore ? `, current ${formatDateDisplay(opts.createdBefore)}` : ""
      }): `,
    );
    if (createdBeforeInput) {
      if (createdBeforeInput.toLowerCase() === "clear") {
        opts.createdBefore = null;
        console.log("⭕ Created-before filter removed");
      } else {
        try {
          opts.createdBefore = normalizeDateInput(createdBeforeInput, "before");
          console.log(`✅ Created-before filter set to: ${formatDateDisplay(opts.createdBefore)}`);
        } catch (error) {
          console.log(`❌ ${error.message}. Keeping previous value.`);
        }
      }
    }

    const publishedAfterInput = await prompt(
      `Published-after filter - only import products uploaded after this date (YYYY-MM-DD or ISO, 'clear' to remove, leave blank to keep${
        opts.publishedAfter ? `, current ${formatDateDisplay(opts.publishedAfter)}` : ""
      }): `,
    );
    if (publishedAfterInput) {
      if (publishedAfterInput.toLowerCase() === "clear") {
        opts.publishedAfter = null;
        console.log("⭕ Published-after filter removed");
      } else {
        try {
          opts.publishedAfter = normalizeDateInput(publishedAfterInput, "after");
          console.log(
            `✅ Published-after filter set to: ${formatDateDisplay(opts.publishedAfter)}`,
          );
        } catch (error) {
          console.log(`❌ ${error.message}. Keeping previous value.`);
        }
      }
    }
  }

  console.log(`\n✅ ${type.toUpperCase()} configuration saved!`);
  await prompt("Press Enter to continue...");
}

/**
 * Run all enabled importers in correct order
 */
async function runAllImporters() {
  console.clear();
  console.log(`\n${"=".repeat(80)}`);
  console.log("🚀 Starting Import Process");
  console.log(`${"=".repeat(80)}\n`);

  // Check if any importer is enabled
  const enabled = Object.entries(importOptions)
    .filter(([_, opts]) => opts.enabled)
    .map(([type, _]) => type);

  if (enabled.length === 0) {
    console.log("❌ No importers enabled! Configure them first.\n");
    await prompt("Press Enter to continue...");
    return;
  }

  console.log(`📊 Enabled importers: ${enabled.join(", ").toUpperCase()}\n`);

  // Check API health
  const healthOk = await checkApiHealth();
  if (!healthOk) {
    console.log("\n❌ API health check failed. Aborting.\n");
    await prompt("Press Enter to continue...");
    return;
  }

  // Confirm
  const confirm = await prompt("\nProceed with import? (y/n): ");
  if (confirm.toLowerCase() !== "y") {
    console.log("\n❌ Import cancelled");
    await prompt("Press Enter to continue...");
    return;
  }

  // Run importers in correct order
  const importOrder = ["categories", "users", "products", "variations", "orders", "blogPosts"];
  const stats = {};

  for (const type of importOrder) {
    if (!importOptions[type].enabled) continue;

    console.log(`\n${"─".repeat(80)}`);
    console.log(`📦 Running ${type.toUpperCase()} Importer`);
    console.log(`${"─".repeat(80)}\n`);

    // Validate dependencies
    const depsOk = await validateImportDependencies(type);
    if (!depsOk) {
      console.log(`⚠️  Skipping ${type} (dependency check failed)\n`);
      continue;
    }

    try {
      const opts = importOptions[type];

      if (type === "categories") {
        const importer = new CategoryImporter(config, logger);
        stats[type] = await importer.import({
          limit: opts.limit,
          page: opts.page,
          dryRun: opts.dryRun,
        });
      } else if (type === "users") {
        const importer = new UserImporter(config, logger);
        stats[type] = await importer.import({
          limit: opts.limit,
          page: opts.page,
          dryRun: opts.dryRun,
        });
      } else if (type === "products") {
        // Update config with image options before importing
        config.import.images.maxImagesPerProduct = opts.maxImagesPerProduct;
        config.import.images.updateProductsWithExistingImages =
          opts.updateProductsWithExistingImages;

        const importer = new ProductImporter(config, logger);
        stats[type] = await importer.import({
          limit: opts.limit,
          page: opts.page,
          dryRun: opts.dryRun,
          categoryIds: opts.categoryIds,
          nameFilter: opts.useNameFilter ? undefined : null,
          createdAfter: opts.createdAfter,
          createdBefore: opts.createdBefore,
          publishedAfter: opts.publishedAfter,
        });
      } else if (type === "variations") {
        const importer = new VariationImporter(config, logger);
        stats[type] = await importer.import({
          limit: opts.limit,
          page: opts.page,
          dryRun: opts.dryRun,
          onlyImported: opts.onlyImported,
          nameFilter: opts.useNameFilter ? undefined : null,
        });
      } else if (type === "orders") {
        const importer = new OrderImporter(config, logger);
        stats[type] = await importer.import({
          limit: opts.limit,
          page: opts.page,
          dryRun: opts.dryRun,
        });
      } else if (type === "blogPosts") {
        const importer = new BlogPostImporter(config, logger);
        stats[type] = await importer.import({
          limit: opts.limit,
          page: opts.page,
          batchSize: opts.batchSize,
          status: opts.status,
          after: opts.after,
          dryRun: opts.dryRun,
        });
      }

      console.log(`\n✅ ${type.toUpperCase()} import completed!\n`);
    } catch (error) {
      console.error(`\n❌ ${type.toUpperCase()} import failed:`, error.message);
      const continueOnError = await prompt("Continue with next importer? (y/n): ");
      if (continueOnError.toLowerCase() !== "y") {
        break;
      }
    }
  }

  // Display summary
  console.log(`\n${"=".repeat(80)}`);
  console.log("📊 Import Summary");
  console.log(`${"=".repeat(80)}\n`);

  Object.entries(stats).forEach(([type, stat]) => {
    console.log(`${type.toUpperCase()}:`);
    console.log(`  ✅ Success: ${stat.success || 0}`);
    if (typeof stat.updated === "number") {
      console.log(`  🔄 Updated: ${stat.updated}`);
    }
    console.log(`  ⏭️  Skipped: ${stat.skipped || 0}`);
    console.log(`  ❌ Failed: ${stat.failed || 0}`);
    console.log(`  ⚠️  Errors: ${stat.errors || 0}`);
    if (stat.duration) {
      console.log(`  ⏱️  Duration: ${(stat.duration / 1000).toFixed(2)}s\n`);
    }
  });

  console.log(`\n🎉 All imports complete!\n`);
  await prompt("Press Enter to return to main menu...");
}

/**
 * Display current import statistics and mapping file location, then wait for user confirmation.
 *
 * Prints per-type totals and optional oldest/newest timestamps from the duplicate tracker,
 * shows the mapping files directory configured for duplicate tracking, and waits for the user
 * to press Enter before returning.
 */
async function showStatus() {
  console.clear();
  console.log(`\n${"=".repeat(80)}`);
  console.log("📊 Import Status & Mappings");
  console.log(`${"=".repeat(80)}\n`);

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
    console.log("");
  });

  console.log(`📁 Mapping files location: ${config.duplicateTracking.storageDir}\n`);
  await prompt("Press Enter to continue...");
}

/**
 * Interactively clear all import mapping data used to track imported items.
 *
 * Prompts the user to confirm by typing "clear"; if confirmed, iterates all mapping types
 * in the DuplicateTracker and removes their mappings, reporting per-type failures.
 * If not confirmed, the operation is cancelled. Prompts to press Enter when finished.
 */
async function clearMappings() {
  console.clear();
  console.log(`\n⚠️  WARNING: Clear All Mappings\n`);
  console.log("This will reset all import tracking, allowing items to be re-imported.");
  console.log("This is useful if you want to start fresh or fix duplicate imports.\n");

  const confirm = await prompt('Type "clear" to confirm clearing all mappings: ');

  if (confirm === "clear") {
    console.log("\n🧹 Clearing mappings...\n");
    const mappingTypes = Object.keys(duplicateTracker.mappings);
    mappingTypes.forEach((type) => {
      try {
        duplicateTracker.clearMappings(type);
      } catch (error) {
        console.log(`⚠️  Failed to clear ${type}: ${error.message}`);
      }
    });
    console.log("✅ All mappings cleared!\n");
  } else {
    console.log("\n❌ Cancelled\n");
  }

  await prompt("Press Enter to continue...");
}

/**
 * Run the interactive main loop for the WooCommerce → Strapi importer CLI.
 *
 * Starts by selecting credentials, then repeatedly shows the main menu and dispatches
 * user-selected actions (configure importers, run imports, view or clear mappings,
 * sync shipping locations, or exit) until the user quits. Ensures the readline
 * interface is closed and terminates the process on unrecoverable errors.
 */
async function main() {
  try {
    // Select credentials on startup
    await selectCredentials();

    let running = true;

    while (running) {
      const choice = await showMainMenu();

      switch (choice) {
        case "1":
          await selectCredentials();
          break;
        case "2":
          await configureImporter("categories");
          break;
        case "3":
          await configureImporter("users");
          break;
        case "4":
          await configureImporter("products");
          break;
        case "5":
          await configureImporter("variations");
          break;
        case "6":
          await configureImporter("orders");
          break;
        case "7":
          await configureImporter("blogPosts");
          break;
        case "8":
          await runAllImporters();
          break;
        case "9":
          await showStatus();
          break;
        case "10":
          await clearMappings();
          break;
        case "11":
          try {
            await syncShippingLocations(config, logger);
          } catch (error) {
            console.log(`\n❌ Shipping sync failed: ${error.message}\n`);
          }
          await prompt("Press Enter to continue...");
          break;
        case "12":
          console.log("\n👋 Goodbye!\n");
          running = false;
          break;
        default:
          console.log("\n❌ Invalid choice. Please try again.\n");
          await prompt("Press Enter to continue...");
      }
    }
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Start the interactive importer
main();