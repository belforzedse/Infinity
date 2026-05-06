#!/usr/bin/env node

/**
 * Migration Script: Generate slugs for all existing products
 *
 * This script:
 * 1. Finds all products without slugs
 * 2. Generates unique Persian-compatible slugs from titles
 * 3. Updates products in batches
 * 4. Handles duplicates by appending counters
 *
 * Usage:
 *   npm run strapi console  # Then run this script
 *   OR
 *   node scripts/generate-product-slugs.js
 *
 * Run from the backend directory with Strapi loaded.
 */

const BATCH_SIZE = 50;

/**
 * Import the central Unicode slug utility to ensure consistent slug behavior
 * This replaces the local implementation to avoid divergence
 * Uses the same implementation as src/utils/unicodeSlug.ts
 */
function generateUnicodeSlug(text, fallbackPrefix = 'product') {
  // Import the central utility from src/utils/unicodeSlug.ts
  // Following the pattern from regenerate-product-slugs.js which uses require for src/utils
  let unicodeSlug;
  try {
    // Try to import from source TypeScript file (works in Strapi context with ts-node/tsx)
    unicodeSlug = require('../src/utils/unicodeSlug.ts').generateUnicodeSlug;
  } catch (e) {
    try {
      // Fallback to compiled dist directory (production builds)
      unicodeSlug = require('../dist/src/utils/unicodeSlug.js').generateUnicodeSlug;
    } catch (e2) {
      // If both fail, use inline implementation matching the central utility exactly
      // This matches src/utils/unicodeSlug.ts to prevent divergence
      if (!text) {
        return `${fallbackPrefix}-${Date.now()}`;
      }

      // First, replace spaces and ZWNJ with hyphens
      let slug = text
        .toString()
        .trim()
        .replace(/[\s\u200c]+/g, '-'); // Convert spaces and ZWNJ to hyphen

      // Lowercase only ASCII letters (a-z), preserve Persian characters
      slug = slug.replace(/[A-Z]/g, (char) => char.toLowerCase());

      // Remove unwanted characters but keep ASCII letters/numbers, Persian letters, and hyphens
      slug = slug.replace(/[^0-9a-z\u0600-\u06ff-]/gi, '');

      // Collapse multiple hyphens
      slug = slug.replace(/-+/g, '-');

      // Trim leading/trailing hyphens
      slug = slug.replace(/^-|-$/g, '');

      return slug || `${fallbackPrefix}-${Date.now()}`;
    }
  }

  // Use the imported utility with fallback prefix support
  return unicodeSlug(text, fallbackPrefix);
}

/**
 * Check if a slug is already in use
 */
async function isSlugAvailable(strapi, slug, excludeId = null) {
  const filters = { Slug: slug };
  if (excludeId) {
    filters.id = { $ne: excludeId };
  }

  const existing = await strapi.entityService.findMany('api::product.product', {
    filters,
    pagination: { limit: 1 },
  });

  return existing.length === 0;
}

/**
 * Generate a unique slug for a product
 */
async function generateUniqueSlug(strapi, title, productId) {
  const baseSlug = generateUnicodeSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (!(await isSlugAvailable(strapi, slug, productId))) {
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
 * Main migration function
 */
async function migrateProductSlugs() {
  // Check if running in Strapi context
  if (typeof strapi === "undefined") {
    console.error("❌ This script must be run in Strapi context.");
    console.error("   Run: npm run strapi console");
    console.error('   Then: await require("./scripts/generate-product-slugs.js")()');
    process.exit(1);
  }

  console.log("🚀 Starting product slug migration...\n");

  const stats = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Count total products without slugs
    const totalWithoutSlugs = await strapi.db.query("api::product.product").count({
      where: {
        $or: [{ Slug: null }, { Slug: "" }],
      },
    });

    console.log(`📊 Found ${totalWithoutSlugs} products without slugs\n`);

    if (totalWithoutSlugs === 0) {
      console.log("✅ All products already have slugs. Nothing to do.");
      return stats;
    }

    // Process in batches
    // Always use start: 0 to prevent skipping records when products are updated
    // (updating a product changes the filtered result set)
    let hasMore = true;
    let batchNumber = 1;

    while (hasMore) {
      // Fetch batch of products without slugs (always from start to get next matching items)
      const products = await strapi.entityService.findMany("api::product.product", {
        filters: {
          $or: [{ Slug: null }, { Slug: "" }],
        },
        fields: ["id", "Title", "Slug"],
        pagination: { start: 0, limit: BATCH_SIZE },
      });

      if (products.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`\n📦 Processing batch ${batchNumber}: ${products.length} products`);

      for (const product of products) {
        stats.total++;

        try {
          // Skip if already has a valid slug
          if (product.Slug && product.Slug.trim()) {
            stats.skipped++;
            continue;
          }

          // Generate unique slug from title
          const slug = await generateUniqueSlug(strapi, product.Title, product.id);

          // Update product with new slug
          await strapi.entityService.update("api::product.product", product.id, {
            data: { Slug: slug },
          });

          stats.updated++;
          console.log(`  ✅ ${product.id}: "${product.Title}" → "${slug}"`);
        } catch (error) {
          stats.errors++;
          console.error(`  ❌ ${product.id}: Error - ${error.message}`);
        }
      }

      batchNumber++;

      // Stop if we got fewer products than the batch size (no more to process)
      if (products.length < BATCH_SIZE) {
        hasMore = false;
      }

      // Small delay to prevent overwhelming the database
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 Migration Complete!");
    console.log("=".repeat(50));
    console.log(`   Total processed: ${stats.total}`);
    console.log(`   Updated: ${stats.updated}`);
    console.log(`   Skipped: ${stats.skipped}`);
    console.log(`   Errors: ${stats.errors}`);
    console.log("=".repeat(50) + "\n");

    return stats;
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    throw error;
  }
}

// Export for use in Strapi console
module.exports = migrateProductSlugs;

// If running directly (not in Strapi console), show instructions
if (require.main === module) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           Product Slug Migration Script                        ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  This script generates slugs for all products without one.     ║
║                                                                ║
║  To run this script:                                           ║
║                                                                ║
║  1. Start Strapi console:                                      ║
║     cd backend && npm run strapi console                       ║
║                                                                ║
║  2. Run the migration:                                         ║
║     await require('./scripts/generate-product-slugs.js')()     ║
║                                                                ║
║  The script will:                                              ║
║  - Find all products without slugs                             ║
║  - Generate Persian-compatible slugs from titles               ║
║  - Ensure uniqueness by appending counters if needed           ║
║  - Update products in batches of 50                            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
}



