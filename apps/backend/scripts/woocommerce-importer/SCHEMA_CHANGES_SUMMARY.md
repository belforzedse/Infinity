# WooCommerce Importer - Schema Changes Summary

## 🎯 Overview

To support the WooCommerce importer with duplicate prevention and tracking, we need to add external tracking fields to your Strapi content types.

## ✅ Required Changes

### 1. Schema File Updates

The following schema files have been updated with `external_id` and `external_source` fields:

```
📝 Updated Schema Files:
├── src/api/product-category/content-types/product-category/schema.json
├── src/api/product/content-types/product/schema.json  
├── src/api/product-variation/content-types/product-variation/schema.json
├── src/api/order/content-types/order/schema.json
├── src/api/order-item/content-types/order-item/schema.json
├── src/api/contract/content-types/contract/schema.json
├── src/api/contract-transaction/content-types/contract-transaction/schema.json
├── src/api/product-stock/content-types/product-stock/schema.json
└── src/api/local-user/content-types/local-user/schema.json
```

### 2. Database Migration

```
📁 Created Migration:
└── database/migrations/2025.07.26T01.20.00.add-external-tracking-fields.js
```

### 3. Additional Schema Adjustments

```
📝 Minor Adjustments:
└── src/api/product-category-content/content-types/product-category-content/schema.json
    └── Changed Image field: required: true → required: false
```

## 🚀 How to Apply Changes

### Step 1: Schema Changes Already Applied ✅
The schema files have been updated with the necessary fields.

### Step 2: Run Database Migration

```bash
# Navigate to your Strapi project root
cd /path/to/your/strapi/project

# Run the database migration
npm run strapi db:migrate

# Or if using different command structure:
npx strapi db:migrate
```

### Step 3: Restart Strapi

```bash
# Restart your Strapi development server
npm run develop

# Or production:
npm start
```

## 📊 What Gets Added

### New Fields on Each Content Type:

```javascript
{
  "external_id": {
    "type": "string",
    "unique": false
  },
  "external_source": {
    "type": "string"
  }
}
```

### Database Changes:

```sql
-- Example for products table
ALTER TABLE products 
ADD COLUMN external_id VARCHAR(255),
ADD COLUMN external_source VARCHAR(255);

CREATE INDEX products_external_lookup 
ON products (external_source, external_id);
```

## 🔍 Verification

After applying changes, verify:

1. **Schema Updates**: Check Strapi admin panel for new fields
2. **Database Migration**: Confirm tables have new columns
3. **Indexes Created**: Check database for performance indexes

```sql
-- Verify indexes were created
SHOW INDEX FROM products WHERE Key_name LIKE '%external%';
```

## 🛡️ Safety Notes

- ✅ **Zero Breaking Changes**: All new fields are optional
- ✅ **Backward Compatible**: Existing data remains unchanged  
- ✅ **Rollback Available**: Migration includes down() function
- ✅ **Performance Optimized**: Composite indexes for fast lookups

## 🔧 Testing

Test the changes:

```bash
# 1. Navigate to importer directory
cd scripts/woocommerce-importer

# 2. Test categories import (dry run)
node index.js categories --limit 5 --dry-run

# 3. Test real import
node index.js categories --limit 10
```

## ❓ Troubleshooting

### Migration Fails?
```bash
# Check migration status
npx strapi db:migrate:status

# Manual rollback if needed
npx strapi db:migrate:down
```

### Schema Not Updating?
1. Restart Strapi completely
2. Check content-types configuration
3. Verify JSON syntax in schema files

### Importer Still Failing?
1. Confirm all schema changes applied
2. Check database has new columns
3. Verify Strapi restart completed

## 📞 Support

The schema changes are designed to be:
- **Non-breaking**: Won't affect existing functionality
- **Reversible**: Can be rolled back if needed
- **Performance-friendly**: Includes proper indexing

---

**Status**: ✅ Ready to Apply  
**Risk Level**: 🟢 Low (Non-breaking changes)  
**Estimated Downtime**: < 2 minutes (for migration + restart) 