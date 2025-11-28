#!/usr/bin/env node

/**
 * Script to regenerate product slugs with Persian character support
 * 
 * This script:
 * 1. Finds all products
 * 2. Regenerates slugs using the fixed Persian-compatible logic
 * 3. Updates products in batches
 * 
 * Usage:
 *   node scripts/regenerate-product-slugs.js
 * 
 * Or in Strapi console:
 *   await require('./scripts/regenerate-product-slugs.js')()
 */

const strapi = require("@strapi/strapi");

/**
 * Regenerates product Slug values (with Persian character support) for all active products in Strapi.
 *
 * Iterates active products (removedAt is null), generates unique slugs, updates the product Slug when it differs from the existing value, and logs counts of updated, skipped, and errored items. Ensures the Strapi instance is destroyed and rethrows any top-level errors.
 */
async function regenerateProductSlugs() {
  const instance = await strapi({
    distDir: "./dist",
    autoReload: false,
    serveAdminPanel: false,
  }).load();

  try {
    const { generateUniqueProductSlug } = require("../src/utils/productSlug");

    console.log("🚀 Starting product slug regeneration...\n");

    // Get all active products
    const products = await instance.entityService.findMany("api::product.product", {
      fields: ["id", "Title", "Slug"],
      filters: {
        removedAt: { $null: true },
      },
      pagination: { limit: 10000 }, // Get all products
    });

    console.log(`📦 Found ${products.length} products to process\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      if (!product.Title) {
        console.log(`⚠️  Skipping product ${product.id}: No title`);
        skipped++;
        continue;
      }

      try {
        // Generate new slug with Persian support
        const newSlug = await generateUniqueProductSlug(
          instance,
          product.Title,
          product.id
        );

        // Only update if slug changed
        if (newSlug !== product.Slug) {
          await instance.entityService.update("api::product.product", product.id, {
            data: { Slug: newSlug },
          });

          updated++;
          if (updated % 10 === 0) {
            console.log(`✅ Updated ${updated}/${products.length} products...`);
          }
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Error updating product ${product.id}:`, error.message);
        errors++;
      }
    }

    console.log("\n📊 Regeneration Complete!");
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped} (no change needed)`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📦 Total: ${products.length}`);

    if (updated > 0) {
      console.log("\n✨ Product slugs have been regenerated with Persian character support!");
      console.log("   New products will automatically get correct slugs via lifecycle hooks.");
    }
  } catch (error) {
    console.error("\n❌ Regeneration failed:", error);
    throw error;
  } finally {
    await instance.destroy();
  }
}

// Run if called directly
if (require.main === module) {
  regenerateProductSlugs()
    .then(() => {
      console.log("\n✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Script failed:", error);
      process.exit(1);
    });
}

// Export for use in Strapi console
module.exports = regenerateProductSlugs;

