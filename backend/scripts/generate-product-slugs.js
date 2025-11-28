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
 * Generate a Unicode-compatible slug from text
 * Keeps Persian/Arabic characters intact
 */
function generateUnicodeSlug(text, fallbackPrefix = 'product') {
  if (!text) {
    return `${fallbackPrefix}-${Date.now()}`;
  }

  const slug = text
    .toString()
    .trim()
    .toLowerCase()
    // Replace spaces and ZWNJ (zero-width non-joiner used in Persian) with hyphens
    .replace(/[\s\u200c]+/g, '-')
    // Keep ASCII letters/numbers and Persian/Arabic letters (Unicode range 0600-06FF)
    .replace(/[^0-9a-z\u0600-\u06ff-]/gi, '')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
    // Trim leading/trailing hyphens
    .replace(/^-|-$/g, '');

  return slug || `${fallbackPrefix}-${Date.now()}`;
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



