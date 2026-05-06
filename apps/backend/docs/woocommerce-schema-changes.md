# WooCommerce Importer Schema Changes

This document outlines the schema changes required to support the WooCommerce to Strapi importer.

## 🎯 Purpose

The importer needs to track which items have been imported from WooCommerce to prevent duplicates and enable incremental imports. This is achieved by adding external tracking fields to relevant content types.

## 📝 Schema Changes

### Added Fields

Two fields have been added to the following content types:

- `external_id` (string, nullable) - Stores the original WooCommerce ID
- `external_source` (string, nullable) - Stores the source system (e.g., "woocommerce")

### Updated Content Types

| Content Type | Schema File | Purpose |
|--------------|-------------|---------|
| **ProductCategory** | `src/api/product-category/content-types/product-category/schema.json` | Track imported categories |
| **Product** | `src/api/product/content-types/product/schema.json` | Track imported products |
| **ProductVariation** | `src/api/product-variation/content-types/product-variation/schema.json` | Track imported variations |
| **Order** | `src/api/order/content-types/order/schema.json` | Track imported orders |
| **OrderItem** | `src/api/order-item/content-types/order-item/schema.json` | Track imported order items |
| **Contract** | `src/api/contract/content-types/contract/schema.json` | Track imported contracts |
| **ContractTransaction** | `src/api/contract-transaction/content-types/contract-transaction/schema.json` | Track imported transactions |
| **ProductStock** | `src/api/product-stock/content-types/product-stock/schema.json` | Track imported stock records |
| **LocalUser** | `src/api/local-user/content-types/local-user/schema.json` | Track imported guest users |

### Additional Changes

- **ProductCategoryContent**: Changed `Image` field from `required: true` to `required: false` to support categories without images during import.

## 🗄️ Database Migration

A database migration has been created to add these fields to existing installations:

**File**: `database/migrations/2025.07.26T01.20.00.add-external-tracking-fields.js`

### Features:
- ✅ Adds `external_id` and `external_source` columns to all relevant tables
- ✅ Creates composite indexes for fast lookups during import
- ✅ Includes rollback functionality
- ✅ Checks for table existence before modification
- ✅ Comprehensive logging

### Running the Migration

```bash
# Run the migration
npm run strapi db:migrate

# Or run manually if using a different setup
node_modules/.bin/strapi db:migrate
```

### Rollback (if needed)

```bash
# Rollback the migration
npm run strapi db:migrate:down
```

## 🔍 How It Works

### Duplicate Prevention

1. **Import Check**: Before importing an item, the system checks if `external_source = 'woocommerce'` and `external_id = '<woocommerce_id>'` already exists.

2. **Skip or Import**: If found, the item is skipped. If not found, the item is imported and the tracking fields are set.

3. **Mapping Storage**: The importer also maintains local JSON files mapping WooCommerce IDs to Strapi IDs for fast lookups.

### Example Usage

```javascript
// Check for existing item
const existingProduct = await strapi.db.query('api::product.product').findOne({
  where: {
    external_source: 'woocommerce',
    external_id: '12345'
  }
});

if (existingProduct) {
  console.log('Product already imported, skipping...');
  return;
}

// Import new item
await strapi.db.query('api::product.product').create({
  data: {
    Title: 'Product Name',
    // ... other fields
    external_id: '12345',
    external_source: 'woocommerce'
  }
});
```

## 🚀 Benefits

- **No Duplicates**: Prevents importing the same item multiple times
- **Incremental Imports**: Allows running imports multiple times safely
- **Fast Lookups**: Composite indexes ensure quick duplicate checking
- **Audit Trail**: Can track which items came from which external system
- **Flexible**: Can support multiple external sources in the future

## ⚡ Performance

The composite indexes on `(external_source, external_id)` ensure that duplicate checks are fast, even with large datasets:

```sql
-- Fast lookup example
SELECT id FROM products 
WHERE external_source = 'woocommerce' 
  AND external_id = '12345';
-- Uses index: products_external_lookup
```

## 🔧 Maintenance

### Querying Imported Items

```javascript
// Find all WooCommerce imported products
const wcProducts = await strapi.db.query('api::product.product').findMany({
  where: {
    external_source: 'woocommerce'
  }
});

// Find specific WooCommerce product
const wcProduct = await strapi.db.query('api::product.product').findOne({
  where: {
    external_source: 'woocommerce',
    external_id: '12345'
  }
});
```

### Cleanup (if needed)

```javascript
// Remove all WooCommerce imported data (careful!)
await strapi.db.query('api::product.product').deleteMany({
  where: {
    external_source: 'woocommerce'
  }
});
```

## 📊 Impact

- **Zero Breaking Changes**: All new fields are nullable and optional
- **Backward Compatible**: Existing data continues to work unchanged
- **Performance Optimized**: Indexes ensure fast import operations
- **Future Proof**: Schema supports importing from multiple sources

---

**Created**: 2025-07-26  
**Version**: 1.0  
**Status**: Ready for Production 