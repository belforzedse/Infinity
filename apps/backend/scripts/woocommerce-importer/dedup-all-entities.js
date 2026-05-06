#!/usr/bin/env node

/**
 * Comprehensive Entity Deduplication Script
 *
 * Identifies and removes duplicate items from multiple Strapi content types:
 * - Categories
 * - Products
 * - Product Variations
 * - Colors, Sizes, Models
 * - And other configurable entities
 */

const axios = require('axios');
const readline = require('readline');
require('dotenv').config();

// Load configuration
const config = require('./config.js');

const STRAPI_URL = process.env.STRAPI_URL || config.strapi.baseUrl;
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || config.strapi.auth.token;

if (!STRAPI_TOKEN) {
  console.error('❌ Missing STRAPI_TOKEN - set via STRAPI_TOKEN env variable or configure it in config.js');
  process.exit(1);
}

console.log(`🔗 Using Strapi URL: ${STRAPI_URL}\n`);

const client = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    'Authorization': `Bearer ${STRAPI_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Configuration for different entity types
const ENTITY_CONFIGS = {
  'product-categories': {
    endpoint: '/product-categories',
    groupBy: 'Title',
    identifyField: 'Slug',
    displayFields: ['Title', 'Slug', 'id']
  },
  'products': {
    endpoint: '/products',
    groupBy: 'Title',
    identifyField: 'Slug',
    displayFields: ['Title', 'Slug', 'id']
  },
  'product-variations': {
    endpoint: '/product-variations',
    groupBy: 'SKU',
    identifyField: 'SKU',
    displayFields: ['SKU', 'id']
  },
  'product-variation-colors': {
    endpoint: '/product-variation-colors',
    groupBy: 'Title',
    identifyField: 'ColorCode',
    displayFields: ['Title', 'ColorCode', 'id']
  },
  'product-variation-sizes': {
    endpoint: '/product-variation-sizes',
    groupBy: 'Title',
    identifyField: 'Title',
    displayFields: ['Title', 'id']
  },
  'product-variation-models': {
    endpoint: '/product-variation-models',
    groupBy: 'Title',
    identifyField: 'Title',
    displayFields: ['Title', 'id']
  }
};

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
 * Fetch all entities of a given type from Strapi
 */
async function getEntities(entityType, config) {
  console.log(`📥 Fetching ${entityType}...`);
  try {
    const response = await client.get(config.endpoint, {
      params: {
        'pagination[pageSize]': 1000,
        sort: 'id:asc'
      }
    });

    const entities = response.data.data || [];
    console.log(`   ✅ Fetched ${entities.length} ${entityType}`);
    return entities;
  } catch (error) {
    console.error(`   ❌ Failed to fetch ${entityType}:`, error.message);
    return [];
  }
}

/**
 * Group entities by a field to find duplicates
 */
function groupEntities(entities, groupByField) {
  const groups = new Map();

  entities.forEach(entity => {
    const groupValue = getAttr(entity, groupByField) || '';
    if (groupValue && groupValue.trim() !== '') {
      if (!groups.has(groupValue)) {
        groups.set(groupValue, []);
      }
      groups.get(groupValue).push(entity);
    }
  });

  return groups;
}

/**
 * Find duplicates for an entity type
 */
function findDuplicatesToDelete(entityType, groups, entityConfig) {
  const toDelete = [];

  groups.forEach((entities, groupValue) => {
    if (entities.length > 1) {
      console.log(`\n   🔍 Found ${entities.length} duplicates - ${entityConfig.groupBy}: "${groupValue}"`);

      // Sort by ID (keep lowest ID, delete higher ones)
      const sorted = [...entities].sort((a, b) => a.id - b.id);
      const keep = sorted[0];
      const deleteRest = sorted.slice(1);

      const keepInfo = entityConfig.displayFields
        .map(f => `${f}: "${getAttr(keep, f)}"`)
        .join(' | ');
      console.log(`      ✅ Keep: ID ${keep.id} - ${keepInfo}`);

      deleteRest.forEach(entity => {
        const delInfo = entityConfig.displayFields
          .map(f => `${f}: "${getAttr(entity, f)}"`)
          .join(' | ');
        console.log(`      ❌ Delete: ID ${entity.id} - ${delInfo}`);
        toDelete.push(entity);
      });
    }
  });

  return toDelete;
}

/**
 * Delete an entity by ID
 */
async function deleteEntity(entityType, entityConfig, entityId) {
  try {
    await client.delete(`${entityConfig.endpoint}/${entityId}`);
    return true;
  } catch (error) {
    console.error(`      ✗ Failed to delete ID ${entityId}:`, error.message);
    return false;
  }
}

/**
 * Process a single entity type
 */
async function processEntityType(entityType, entityConfig) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Processing: ${entityType.toUpperCase()}`);
  console.log(`${'='.repeat(70)}`);

  // Fetch entities
  const entities = await getEntities(entityType, entityConfig);
  if (entities.length === 0) {
    console.log('   📭 No entities found\n');
    return { entityType, duplicatesFound: 0, deleted: 0 };
  }

  // Group by field
  const groups = groupEntities(entities, entityConfig.groupBy);

  // Find duplicates
  const toDelete = findDuplicatesToDelete(entityType, groups, entityConfig);

  if (toDelete.length === 0) {
    console.log(`   ✅ No duplicates found\n`);
    return { entityType, duplicatesFound: 0, deleted: 0 };
  }

  // Confirm deletion
  console.log(`\n   ⚠️  Found ${toDelete.length} duplicate entities to delete`);
  console.log(`   IDs: ${toDelete.map(e => e.id).join(', ')}`);

  return {
    entityType,
    duplicatesFound: toDelete.length,
    toDelete,
    entities: entityConfig
  };
}

/**
 * Prompt user for confirmation
 */
function askConfirmation(message) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(message, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Main deduplication process
 */
async function main() {
  try {
    console.log('🧹 Starting comprehensive entity deduplication...\n');

    // Process all entity types
    const results = [];
    for (const [entityType, entityConfig] of Object.entries(ENTITY_CONFIGS)) {
      const result = await processEntityType(entityType, entityConfig);
      results.push(result);
    }

    // Summary
    console.log(`\n${'='.repeat(70)}`);
    console.log('SUMMARY');
    console.log(`${'='.repeat(70)}`);

    const totalToDelete = results.reduce((sum, r) => sum + r.duplicatesFound, 0);
    results.forEach(r => {
      if (r.duplicatesFound > 0) {
        console.log(`✅ ${r.entityType}: ${r.duplicatesFound} duplicates found`);
      }
    });

    if (totalToDelete === 0) {
      console.log('\n✅ No duplicates found in any entity type!');
      return;
    }

    // Ask for confirmation
    console.log(`\n⚠️  Total duplicates found: ${totalToDelete}`);
    const proceed = await askConfirmation('❓ Proceed with deletion? (type "yes" to confirm): ');

    if (!proceed) {
      console.log('\n❌ Deletion cancelled');
      return;
    }

    // Delete duplicates
    console.log('\n🗑️  Deleting duplicate entities...\n');

    let totalDeleted = 0;
    for (const result of results) {
      if (result.toDelete && result.toDelete.length > 0) {
        console.log(`Deleting ${result.entityType}...`);
        let deleted = 0;

        for (const entity of result.toDelete) {
          const success = await deleteEntity(
            result.entityType,
            result.entities,
            entity.id
          );
          if (success) {
            deleted++;
            totalDeleted++;
          }
          // Add delay to avoid overwhelming API
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        console.log(`   ✓ Deleted ${deleted}/${result.toDelete.length} from ${result.entityType}\n`);
      }
    }

    console.log(`\n✅ Deduplication complete! Deleted ${totalDeleted}/${totalToDelete} duplicate entities`);
    console.log('🎉 All done!');

  } catch (error) {
    console.error('❌ Deduplication failed:', error);
    process.exit(1);
  }
}

main();
