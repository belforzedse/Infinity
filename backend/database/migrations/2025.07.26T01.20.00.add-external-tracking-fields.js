'use strict';

/**
 * Migration: Add external tracking fields for WooCommerce importer
 * 
 * Adds external_id and external_source fields to content types that need
 * to track imported items from WooCommerce for duplicate prevention.
 * 
 * Created: 2025-07-26T01:20:00
 * Purpose: Support WooCommerce to Strapi data import with duplicate prevention
 */

async function up(knex) {
  console.log('🔄 Adding external tracking fields for WooCommerce importer...');

  // Tables to update with external tracking fields
  const tables = [
    'product_categories',
    'products', 
    'product_variations',
    'orders',
    'order_items',
    'contracts',
    'contract_transactions',
    'product_stocks',
    'local_users'
  ];

  // Add external_id and external_source fields to each table
  for (const tableName of tables) {
    const hasTable = await knex.schema.hasTable(tableName);
    
    if (hasTable) {
      console.log(`📝 Adding external tracking fields to ${tableName}...`);
      
      await knex.schema.alterTable(tableName, (table) => {
        // Add external_id field (not unique to allow multiple sources)
        table.string('external_id').nullable();
        
        // Add external_source field to track which system imported the data
        table.string('external_source').nullable();
        
        // Add composite index for fast lookups during import
        table.index(['external_source', 'external_id'], `${tableName}_external_lookup`);
      });
      
      console.log(`✅ Added external tracking fields to ${tableName}`);
    } else {
      console.log(`⚠️ Table ${tableName} does not exist, skipping...`);
    }
  }
  
  console.log('✅ External tracking fields migration completed successfully!');
}

async function down(knex) {
  console.log('🔄 Removing external tracking fields...');

  const tables = [
    'product_categories',
    'products',
    'product_variations', 
    'orders',
    'order_items',
    'contracts',
    'contract_transactions',
    'product_stocks',
    'local_users'
  ];

  // Remove external tracking fields from each table
  for (const tableName of tables) {
    const hasTable = await knex.schema.hasTable(tableName);
    
    if (hasTable) {
      console.log(`📝 Removing external tracking fields from ${tableName}...`);
      
      await knex.schema.alterTable(tableName, (table) => {
        // Drop the composite index first
        table.dropIndex(['external_source', 'external_id'], `${tableName}_external_lookup`);
        
        // Drop the columns
        table.dropColumn('external_id');
        table.dropColumn('external_source');
      });
      
      console.log(`✅ Removed external tracking fields from ${tableName}`);
    }
  }
  
  console.log('✅ External tracking fields rollback completed!');
}

module.exports = { up, down }; 