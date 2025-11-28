#!/usr/bin/env node
/**
 * Regenerate product slugs for all products in Strapi
 *
 * This script:
 * 1. Fetches all products (paginated)
 * 2. Generates new slugs from product titles using generateUnicodeSlug
 * 3. Ensures slugs are unique and don't conflict with reserved routes
 * 4. Updates products with new slugs
 *
 * Usage:
 *   node scripts/regenerate-product-slugs.js [--dry-run] [--force]
 *
 * Options:
 *   --dry-run    Preview changes without updating
 *   --force      Update all products, even if they already have valid slugs
 */

const axios = require("axios");
const path = require("path");

// Import the unicode slug generator
// Try to import from TypeScript source (works in Strapi context)
let generateUnicodeSlug;
try {
  generateUnicodeSlug = require("../src/utils/unicodeSlug.ts").generateUnicodeSlug;
} catch (e) {
  try {
    // Fallback to compiled dist
    generateUnicodeSlug = require("../dist/src/utils/unicodeSlug.js").generateUnicodeSlug;
  } catch (e2) {
    // Inline fallback implementation
    generateUnicodeSlug = (text, fallbackPrefix = "product") => {
      if (!text) {
        return `${fallbackPrefix}-${Date.now()}`;
      }

      let slug = text
        .toString()
        .trim()
        .replace(/[\s\u200c]+/g, "-");

      slug = slug.replace(/[A-Z]/g, (char) => char.toLowerCase());
      slug = slug.replace(/[^0-9a-z\u0600-\u06ff-]/gi, "");
      slug = slug.replace(/-+/g, "-");
      slug = slug.replace(/^-|-$/g, "");

      return slug || `${fallbackPrefix}-${Date.now()}`;
    };
  }
}

// Import config from importer (same pattern)
let config;
try {
  config = require(path.join(__dirname, "woocommerce-importer", "config"));
} catch (e) {
  // Fallback if importer config not available
  config = {
    strapi: {
      baseUrl: "https://api.staging.infinitycolor.org/api",
      auth: {
        token:
          "STRAPI_API_TOKEN_STAGING",
      },
    },
  };
}

// Use staging credentials by default (or from config, or env vars)
const stagingConfig = config.strapi?.credentials?.staging;
const STRAPI_URL =
  process.env.STRAPI_URL ||
  (stagingConfig ? stagingConfig.baseUrl : config.strapi.baseUrl) ||
  "https://api.staging.infinitycolor.org/api";
const API_TOKEN =
  process.env.STRAPI_TOKEN ||
  (stagingConfig ? stagingConfig.token : config.strapi.auth.token) ||
  "STRAPI_API_TOKEN_STAGING";

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

if (!API_TOKEN) {
  console.error("❌ Error: API token is required!");
  console.error("   Options:");
  console.error("   1. Set STRAPI_TOKEN environment variable");
  console.error("   2. Configure in backend/scripts/woocommerce-importer/config.js");
  process.exit(1);
}

console.log(`🔗 Using Strapi API: ${STRAPI_URL}`);

const apiClient = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
  },
  timeout: 60000,
  httpsAgent: new (require("https").Agent)({
    rejectUnauthorized: false,
  }),
});

// Reserved routes that product slugs cannot use
const RESERVED_ROUTES = [
  "plp",
  "pdp",
  "categories",
  "search",
  "auth",
  "login",
  "register",
  "forgot-password",
  "cart",
  "checkout",
  "payment",
  "api",
  "account",
  "addresses",
  "favorites",
  "orders",
  "password",
  "privileges",
  "wallet",
  "blog",
  "super-admin",
  "admin",
  "dashboard",
  "home",
  "about",
  "contact",
  "privacy",
  "terms",
  "sitemap",
  "robots",
  "favicon",
  "manifest",
  "css",
  "js",
  "images",
  "assets",
  "static",
  "public",
  "_next",
  "graphql",
  "rest",
  "webhooks",
];

/**
 * Check if a slug is valid (not reserved)
 */
function isValidProductSlug(slug) {
  if (!slug || typeof slug !== "string") {
    return false;
  }

  const normalizedSlug = slug.toLowerCase().trim();

  if (RESERVED_ROUTES.includes(normalizedSlug)) {
    return false;
  }

  const conflictPatterns = [
    /^api\//,
    /^_/,
    /^\./,
    /^admin/,
    /^super-admin/,
    /\.(js|css|png|jpg|jpeg|gif|svg|ico|json|xml|txt)$/i,
  ];

  for (const pattern of conflictPatterns) {
    if (pattern.test(normalizedSlug)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a slug is already in use by another product
 */
async function isSlugAvailable(slug, excludeId) {
  try {
    const filters = { Slug: slug };
    if (excludeId) {
      filters.id = { $ne: excludeId };
    }

    const endpoint = STRAPI_URL.endsWith("/api") ? "/products" : "/api/products";
    const filtersParam = {};
    if (filters.Slug) {
      filtersParam["filters[Slug][$eq]"] = filters.Slug;
    }
    if (filters.id && filters.id.$ne) {
      filtersParam["filters[id][$ne]"] = filters.id.$ne;
    }

    const response = await apiClient.get(endpoint, {
      params: {
        ...filtersParam,
        "pagination[limit]": 1,
      },
    });

    return !response.data.data || response.data.data.length === 0;
  } catch (error) {
    console.error(`Error checking slug availability for "${slug}":`, error.message);
    return false;
  }
}

/**
 * Generate a unique slug from a product title
 */
async function generateUniqueSlug(title, productId) {
  let baseSlug = generateUnicodeSlug(title, "product");

  // If base slug is invalid, use fallback
  if (!isValidProductSlug(baseSlug)) {
    baseSlug = `product-${Date.now()}`;
  }

  let slug = baseSlug;
  let counter = 1;

  // Keep trying until we find a unique slug
  while (!(await isSlugAvailable(slug, productId))) {
    slug = `${baseSlug}-${counter}`;
    counter++;

    // Prevent infinite loops
    if (counter > 1000) {
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return slug;
}

/**
 * Main function to regenerate slugs
 */
async function regenerateProductSlugs() {
  try {
    console.log("🚀 Regenerating product slugs...\n");
    console.log(
      `Mode: ${DRY_RUN ? "🔍 DRY RUN (preview only)" : "✏️  LIVE (will update products)"}`,
    );
    console.log(
      `Force: ${FORCE ? "✅ Yes (update all products)" : "❌ No (only products without slugs)"}\n`,
    );

    let page = 1;
    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let hasMorePages = true;
    const pageSize = 50;

    while (hasMorePages) {
      try {
        // Note: STRAPI_URL already includes /api, so we use /products not /api/products
        const endpoint = STRAPI_URL.endsWith("/api") ? "/products" : "/api/products";
        const response = await apiClient.get(endpoint, {
          params: {
            "pagination[page]": page,
            "pagination[pageSize]": pageSize,
            "fields[0]": "id",
            "fields[1]": "Title",
            "fields[2]": "Slug",
            sort: "id:asc",
          },
        });

        const products = response.data.data || [];
        const meta = response.data.meta || {};

        if (products.length === 0) {
          hasMorePages = false;
          break;
        }

        console.log(`\n📄 Processing page ${page} (${products.length} products)...`);

        for (const product of products) {
          totalProcessed++;

          const productId = product.id;
          const title = product.attributes?.Title || product.Title || "";
          const currentSlug = product.attributes?.Slug || product.Slug || "";

          // Skip if product has no title
          if (!title || title.trim() === "") {
            console.log(`  ⚠️  Product ${productId}: No title, skipping`);
            totalSkipped++;
            continue;
          }

          // Skip if product already has a valid slug and we're not forcing
          if (!FORCE && currentSlug && isValidProductSlug(currentSlug)) {
            console.log(
              `  ⏭️  Product ${productId} (${title}): Already has valid slug "${currentSlug}", skipping`,
            );
            totalSkipped++;
            continue;
          }

          // Generate new slug
          try {
            const newSlug = await generateUniqueSlug(title, productId);

            // Check if slug actually changed
            if (currentSlug === newSlug) {
              console.log(`  ✓ Product ${productId} (${title}): Slug unchanged "${newSlug}"`);
              totalSkipped++;
              continue;
            }

            console.log(`  🔄 Product ${productId} (${title}):`);
            console.log(`     Old: "${currentSlug || "(empty)"}"`);
            console.log(`     New: "${newSlug}"`);

            if (!DRY_RUN) {
              // Update the product
              const updateEndpoint = STRAPI_URL.endsWith("/api")
                ? `/products/${productId}`
                : `/api/products/${productId}`;
              await apiClient.put(updateEndpoint, {
                data: {
                  Slug: newSlug,
                },
              });

              console.log(`     ✅ Updated!`);
              totalUpdated++;
            } else {
              console.log(`     🔍 Would update (dry-run)`);
              totalUpdated++;
            }
          } catch (error) {
            console.error(
              `  ❌ Product ${productId} (${title}): Failed to generate/update slug:`,
              error.message,
            );
            totalErrors++;
          }
        }

        // Check if there are more pages
        if (meta.pagination && page >= meta.pagination.pageCount) {
          hasMorePages = false;
        } else {
          page++;
        }
      } catch (error) {
        console.error(`❌ Error fetching page ${page}:`, error.message);
        totalErrors++;
        hasMorePages = false;
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Summary");
    console.log("=".repeat(60));
    console.log(`Total processed: ${totalProcessed}`);
    console.log(`✅ Updated: ${totalUpdated}`);
    console.log(`⏭️  Skipped: ${totalSkipped}`);
    console.log(`❌ Errors: ${totalErrors}`);
    console.log("=".repeat(60));

    if (DRY_RUN) {
      console.log("\n💡 This was a dry-run. Run without --dry-run to apply changes.");
    } else {
      console.log("\n✅ Slug regeneration completed!");
      console.log("💡 PDP pages will now use the new slugs.");
    }
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  regenerateProductSlugs()
    .then(() => {
      console.log("\n🎉 Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = { regenerateProductSlugs };
