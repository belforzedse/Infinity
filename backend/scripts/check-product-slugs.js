#!/usr/bin/env node

/**
 * Script to check product slugs and verify migration status
 * 
 * Usage:
 *   node scripts/check-product-slugs.js [productId]
 * 
 * If productId is provided, checks that specific product.
 * Otherwise, shows statistics about all products.
 */

async function checkProductSlugs(productId = null) {
  // Load Strapi instance
  const strapi = require("@strapi/strapi");
  const instance = await strapi({
    distDir: "./dist",
    autoReload: false,
    serveAdminPanel: false,
  }).load();

  try {
    if (productId) {
      // Check specific product
      const product = await instance.entityService.findOne(
        "api::product.product",
        parseInt(productId, 10),
        {
          fields: ["id", "Title", "Slug", "removedAt", "Status"],
        }
      );

      if (!product) {
        console.log(`❌ Product with ID ${productId} not found`);
        return;
      }

      console.log(`\n📦 Product ID: ${product.id}`);
      console.log(`   Title: ${product.Title}`);
      console.log(`   Slug: ${product.Slug || "❌ MISSING"}`);
      console.log(`   Status: ${product.Status}`);
      console.log(`   Removed: ${product.removedAt ? "Yes" : "No"}`);

      if (!product.Slug) {
        console.log(`\n⚠️  This product needs a slug!`);
        console.log(`   Run migration: npm run strapi db:migrate`);
      }
    } else {
      // Show statistics
      const allProducts = await instance.entityService.findMany("api::product.product", {
        fields: ["id", "Title", "Slug", "removedAt"],
        publicationState: "preview", // Include drafts
      });

      const total = allProducts.length;
      const withSlugs = allProducts.filter((p) => p.Slug && p.Slug.trim()).length;
      const withoutSlugs = total - withSlugs;
      const active = allProducts.filter((p) => !p.removedAt).length;
      const trashed = allProducts.filter((p) => p.removedAt).length;

      console.log("\n📊 Product Slug Statistics:");
      console.log("=" .repeat(50));
      console.log(`   Total products: ${total}`);
      console.log(`   With slugs: ${withSlugs} (${((withSlugs / total) * 100).toFixed(1)}%)`);
      console.log(`   Without slugs: ${withoutSlugs} (${((withoutSlugs / total) * 100).toFixed(1)}%)`);
      console.log(`   Active: ${active}`);
      console.log(`   Trashed: ${trashed}`);
      console.log("=" .repeat(50));

      if (withoutSlugs > 0) {
        console.log(`\n⚠️  ${withoutSlugs} products need slugs!`);
        console.log(`   Run migration: npm run strapi db:migrate`);
        
        // Show first 10 products without slugs
        const missingSlugs = allProducts
          .filter((p) => !p.Slug || !p.Slug.trim())
          .slice(0, 10);
        
        if (missingSlugs.length > 0) {
          console.log(`\n   First ${missingSlugs.length} products without slugs:`);
          missingSlugs.forEach((p) => {
            console.log(`   - ID ${p.id}: "${p.Title}"`);
          });
        }
      } else {
        console.log(`\n✅ All products have slugs!`);
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await instance.destroy();
  }
}

// Get product ID from command line
const productId = process.argv[2] || null;

checkProductSlugs(productId)
  .then(() => {
    console.log("\n✅ Check complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Check failed:", error);
    process.exit(1);
  });

