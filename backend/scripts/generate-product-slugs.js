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
 * Create a URL-friendly slug from text while preserving Persian/Arabic characters.
 * @param {string|any} text - Source text to convert into a slug; falsy values produce a fallback slug.
 * @param {string} [fallbackPrefix='product'] - Prefix used when generating a fallback slug.
 * @returns {string} The generated slug containing ASCII letters/numbers, Persian/Arabic characters (U+0600–U+06FF), and hyphens; if the result would be empty, returns a fallback of the form `<fallbackPrefix>-<timestamp>`.
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
 * Determine whether a given slug is unused by other products.
 *
 * @param {string} slug - The slug to check for availability.
 * @param {number|string|null} [excludeId=null] - Optional product id to exclude from the check.
 * @returns {boolean} `true` if the slug is not used by any other product, `false` otherwise.
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
 * Produce a unique, Unicode-friendly slug from a product title, retrying with numeric suffixes until an unused slug is found.
 *
 * If more than 1000 numeric attempts are required, appends the current timestamp to the base slug as a fallback.
 * @param {string} title - Product title to base the slug on.
 * @param {(string|number|null)} productId - ID of the product to exclude from uniqueness checks.
 * @returns {string} The first available slug.
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
 * Generate and assign unique, Unicode-friendly slugs to all products that lack a slug.
 *
 * Processes products in batches, skipping items that already have a non-empty slug,
 * generates a unique slug (preserving Persian/Arabic characters), updates the product,
 * and accumulates migration statistics.
 *
 * @returns {Object} An object with aggregated counts: `total` (processed), `updated` (slugs created), `skipped` (already had slugs), and `errors` (failed updates).
 * @throws {Error} If the migration fails due to an unexpected error.
 */
async function migrateProductSlugs() {
  // Check if running in Strapi context
  if (typeof strapi === 'undefined') {
    console.error('❌ This script must be run in Strapi context.');
    console.error('   Run: npm run strapi console');
    console.error('   Then: await require("./scripts/generate-product-slugs.js")()');
    process.exit(1);
  }

  console.log('🚀 Starting product slug migration...\n');

  const stats = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Count total products without slugs
    const totalWithoutSlugs = await strapi.db.query('api::product.product').count({
      where: {
        $or: [
          { Slug: null },
          { Slug: '' },
        ],
      },
    });

    console.log(`📊 Found ${totalWithoutSlugs} products without slugs\n`);

    if (totalWithoutSlugs === 0) {
      console.log('✅ All products already have slugs. Nothing to do.');
      return stats;
    }

    // Process in batches
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      // Fetch batch of products without slugs
      const products = await strapi.entityService.findMany('api::product.product', {
        filters: {
          $or: [
            { Slug: null },
            { Slug: '' },
          ],
        },
        fields: ['id', 'Title', 'Slug'],
        pagination: { start: offset, limit: BATCH_SIZE },
      });

      if (products.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`\n📦 Processing batch: ${offset + 1} - ${offset + products.length}`);

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
          await strapi.entityService.update('api::product.product', product.id, {
            data: { Slug: slug },
          });

          stats.updated++;
          console.log(`  ✅ ${product.id}: "${product.Title}" → "${slug}"`);
        } catch (error) {
          stats.errors++;
          console.error(`  ❌ ${product.id}: Error - ${error.message}`);
        }
      }

      offset += BATCH_SIZE;

      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Complete!');
    console.log('='.repeat(50));
    console.log(`   Total processed: ${stats.total}`);
    console.log(`   Updated: ${stats.updated}`);
    console.log(`   Skipped: ${stats.skipped}`);
    console.log(`   Errors: ${stats.errors}`);
    console.log('='.repeat(50) + '\n');

    return stats;
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
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


