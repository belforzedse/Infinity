#!/usr/bin/env node

/**
 * Category Deduplication Script
 *
 * Identifies and removes duplicate categories from Strapi.
 * Strategy: For each group of categories with the same title,
 * keeps the one with the shortest slug and deletes the rest.
 */

const axios = require('axios');
require('dotenv').config();

// Load from environment or config file
const config = require('./config.js');

const STRAPI_URL = process.env.STRAPI_URL || config.strapi.baseUrl;
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || config.strapi.auth.token;

if (!STRAPI_TOKEN) {
  console.error('❌ Missing STRAPI_TOKEN - set via STRAPI_TOKEN env variable or configure it in config.js');
  process.exit(1);
}

console.log(`🔗 Using Strapi URL: ${STRAPI_URL}`);

const client = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    'Authorization': `Bearer ${STRAPI_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Fetch all categories from Strapi
 */
async function getAllCategories() {
  console.log('📥 Fetching all categories from Strapi...');
  try {
    const response = await client.get('/product-categories', {
      params: {
        'pagination[pageSize]': 1000,
        'fields[0]': 'id',
        'fields[1]': 'Title',
        'fields[2]': 'Slug',
        sort: 'id:asc'
      }
    });

    const categories = response.data.data || [];
    console.log(`✅ Fetched ${categories.length} categories`);

    // Debug: log first category to check structure
    if (categories.length > 0) {
      console.log('📋 Sample category structure:', JSON.stringify(categories[0], null, 2));
    }

    return categories;
  } catch (error) {
    console.error('❌ Failed to fetch categories:', error.message);
    throw error;
  }
}

/**
 * Get attribute value from Strapi response (nested under 'attributes')
 */
function getAttr(entity, field) {
  if (entity.attributes && entity.attributes[field] !== undefined) {
    return entity.attributes[field];
  }
  return entity[field] || '';
}

/**
 * Group categories by title to find duplicates
 */
function groupByTitle(categories) {
  const groups = new Map();

  categories.forEach(cat => {
    const title = getAttr(cat, 'Title') || '';
    if (!groups.has(title)) {
      groups.set(title, []);
    }
    groups.get(title).push(cat);
  });

  return groups;
}

/**
 * Find which categories should be deleted
 * Strategy: Keep the one with the shortest slug, delete others
 */
function findDuplicatesToDelete(groups) {
  const toDelete = [];

  groups.forEach((categories, title) => {
    if (categories.length > 1) {
      console.log(`\n🔍 Found ${categories.length} categories with title: "${title}"`);

      // Sort by slug length (shortest first)
      const sorted = [...categories].sort((a, b) => {
        const slugA = getAttr(a, 'Slug') || '';
        const slugB = getAttr(b, 'Slug') || '';
        return slugA.length - slugB.length;
      });

      // Keep the first one (shortest slug), delete the rest
      const keep = sorted[0];
      const deleteRest = sorted.slice(1);

      console.log(`  ✅ Keep: ID ${keep.id} - Slug: "${getAttr(keep, 'Slug')}"`);

      deleteRest.forEach(cat => {
        console.log(`  ❌ Delete: ID ${cat.id} - Slug: "${getAttr(cat, 'Slug')}"`);
        toDelete.push(cat);
      });
    }
  });

  return toDelete;
}

/**
 * Delete a category by ID
 */
async function deleteCategory(categoryId) {
  try {
    await client.delete(`/product-categories/${categoryId}`);
    console.log(`    ✓ Deleted category ${categoryId}`);
    return true;
  } catch (error) {
    console.error(`    ✗ Failed to delete category ${categoryId}:`, error.message);
    return false;
  }
}

/**
 * Main deduplication process
 */
async function main() {
  try {
    console.log('🧹 Starting category deduplication...\n');

    // Fetch all categories
    const categories = await getAllCategories();

    if (categories.length === 0) {
      console.log('📭 No categories found');
      return;
    }

    // Group by title
    const groups = groupByTitle(categories);
    console.log(`\n📊 Found ${groups.size} unique titles`);

    // Find duplicates
    const toDelete = findDuplicatesToDelete(groups);

    if (toDelete.length === 0) {
      console.log('\n✅ No duplicates found!');
      return;
    }

    // Confirm deletion
    console.log(`\n⚠️  Found ${toDelete.length} duplicate categories to delete`);
    console.log('Category IDs to delete:', toDelete.map(c => c.id).join(', '));

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('\n❓ Proceed with deletion? (type "yes" to confirm): ', async (answer) => {
      rl.close();

      if (answer.toLowerCase() === 'yes') {
        console.log('\n🗑️  Deleting duplicate categories...\n');

        let deleted = 0;
        for (const category of toDelete) {
          const success = await deleteCategory(category.id);
          if (success) deleted++;
          // Add delay to avoid overwhelming API
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`\n✅ Deleted ${deleted}/${toDelete.length} categories`);
        console.log('🎉 Deduplication complete!');
      } else {
        console.log('\n❌ Deletion cancelled');
      }
    });

  } catch (error) {
    console.error('❌ Deduplication failed:', error);
    process.exit(1);
  }
}

main();
