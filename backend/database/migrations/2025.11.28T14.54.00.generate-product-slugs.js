'use strict';

/**
 * Migration: Generate slugs for all existing products
 * 
 * This migration:
 * 1. Finds all products without slugs (Slug is null or empty)
 * 2. Generates unique Persian-compatible slugs from product titles
 * 3. Updates products in batches
 * 4. Handles duplicates by appending counters
 * 
 * Created: 2025-11-28T14:54:00
 * Purpose: Add SEO-friendly slugs to existing products for better URLs
 */

const BATCH_SIZE = 50;

/**
 * Generate a Unicode-compatible slug from text
 * Keeps Persian/Arabic characters intact
 * Persian characters are preserved as-is, only ASCII letters are lowercased
 * (Copied from src/utils/unicodeSlug.ts for use in migration)
 */
function generateUnicodeSlug(text, fallbackPrefix = 'product') {
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

/**
 * Reserved routes that product slugs cannot use
 * (Copied from src/utils/productSlug.ts)
 */
const RESERVED_ROUTES = [
  'plp', 'pdp', 'categories', 'search', 'auth', 'login', 'register',
  'forgot-password', 'cart', 'checkout', 'payment', 'api', 'account',
  'addresses', 'favorites', 'orders', 'password', 'privileges', 'wallet',
  'blog', 'super-admin', 'admin', 'dashboard', 'home', 'about', 'contact',
  'privacy', 'terms', 'sitemap', 'robots', 'favicon', 'manifest',
  'css', 'js', 'images', 'assets', 'static', 'public', '_next',
  'graphql', 'rest', 'webhooks',
];

/**
 * Validates if a slug is allowed for products
 */
function isValidProductSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  const normalizedSlug = slug.toLowerCase().trim();

  if (RESERVED_ROUTES.includes(normalizedSlug)) {
    return false;
  }

  // Check for common patterns that might conflict
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
 * Check if a slug is already in use (using Knex query)
 */
async function isSlugAvailable(knex, slug, excludeId = null) {
  let query = knex('products').where('slug', slug);
  
  if (excludeId) {
    query = query.where('id', '!=', excludeId);
  }
  
  const existing = await query.first();
  return !existing;
}

/**
 * Generate a unique slug for a product
 */
async function generateUniqueSlug(knex, title, productId) {
  let baseSlug = generateUnicodeSlug(title);
  
  // If base slug is invalid, use fallback
  if (!isValidProductSlug(baseSlug)) {
    baseSlug = `product-${Date.now()}`;
  }
  
  let slug = baseSlug;
  let counter = 1;
  
  while (!(await isSlugAvailable(knex, slug, productId))) {
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

async function up(knex) {
  console.log('🔄 Generating slugs for existing products...\n');

  const hasTable = await knex.schema.hasTable('products');
  if (!hasTable) {
    console.warn('⚠️ Products table does not exist, skipping migration');
    return;
  }

  const hasSlugColumn = await knex.schema.hasColumn('products', 'slug');
  if (!hasSlugColumn) {
    console.warn('⚠️ Slug column does not exist in products table, skipping migration');
    console.warn('   Note: Slug column should be added via schema.json first');
    return;
  }

  const stats = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Count total products without slugs
    const totalWithoutSlugs = await knex('products')
      .whereNull('slug')
      .orWhere('slug', '')
      .count('* as count')
      .first();

    const count = parseInt(totalWithoutSlugs?.count || 0, 10);
    console.log(`📊 Found ${count} products without slugs\n`);

    if (count === 0) {
      console.log('✅ All products already have slugs. Nothing to do.');
      return;
    }

    // Process in batches
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      // Fetch batch of products without slugs
      const products = await knex('products')
        .where(function() {
          this.whereNull('slug').orWhere('slug', '');
        })
        .select('id', 'title', 'slug')
        .limit(BATCH_SIZE)
        .offset(offset);

      if (products.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`\n📦 Processing batch: ${offset + 1} - ${offset + products.length}`);

      for (const product of products) {
        stats.total++;

        try {
          // Skip if already has a valid slug
          if (product.slug && product.slug.trim()) {
            stats.skipped++;
            continue;
          }

          // Skip if no title
          if (!product.title || !product.title.trim()) {
            stats.skipped++;
            console.log(`  ⚠️ ${product.id}: No title, skipping`);
            continue;
          }

          // Generate unique slug from title
          const slug = await generateUniqueSlug(knex, product.title, product.id);

          // Update product with new slug
          await knex('products')
            .where('id', product.id)
            .update({ slug: slug });

          stats.updated++;
          console.log(`  ✅ ${product.id}: "${product.title}" → "${slug}"`);
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
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  }
}

async function down(knex) {
  console.log('🔄 Rolling back product slug generation...');
  console.log('⚠️  This will NOT remove slugs from products (data preservation)');
  console.log('   If you need to remove slugs, do it manually or create a separate migration');
  // We don't remove slugs on rollback to preserve data
  // If you need to remove slugs, create a separate migration
}

module.exports = { up, down };


