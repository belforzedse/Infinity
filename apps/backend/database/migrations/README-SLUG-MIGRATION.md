# Product Slug Migration

## Overview

This migration (`2025.11.28T14.54.00.generate-product-slugs.js`) generates SEO-friendly slugs for all existing products that don't have one.

## What It Does

1. **Finds products without slugs**: Queries all products where `slug` is `null` or empty
2. **Generates unique slugs**: Creates Persian-compatible slugs from product titles
3. **Ensures uniqueness**: Appends counters if a slug is already in use
4. **Validates slugs**: Checks against reserved routes (e.g., `pdp`, `plp`, `api`)
5. **Updates in batches**: Processes 50 products at a time to avoid overwhelming the database

## Prerequisites

- ✅ Product schema must have `Slug` field defined (already done)
- ✅ Database column `slug` must exist (created automatically by Strapi when schema is updated)

## How to Run

### Option 1: Using Strapi CLI (Recommended)

```bash
cd apps/backend
npm run strapi db:migrate
```

### Option 2: Using npx

```bash
cd apps/backend
npx strapi db:migrate
```

### Option 3: Manual Execution

If you need to run it manually in Strapi console:

```bash
cd apps/backend
npm run strapi console
```

Then in the console:
```javascript
await require('./database/migrations/2025.11.28T14.54.00.generate-product-slugs.js').up(strapi.db.connection);
```

## What to Expect

The migration will:
- Show progress for each batch of products
- Display which products were updated with their new slugs
- Report final statistics:
  - Total processed
  - Updated (got new slugs)
  - Skipped (already had slugs or no title)
  - Errors (if any)

Example output:
```
🔄 Generating slugs for existing products...

📊 Found 150 products without slugs

📦 Processing batch: 1 - 50
  ✅ 123: "کفش زنانه مشکی" → "کفش-زنانه-مشکی"
  ✅ 124: "کت و شلوار مردانه" → "کت-و-شلوار-مردانه"
  ...

📊 Migration Complete!
   Total processed: 150
   Updated: 145
   Skipped: 5
   Errors: 0
```

## Rollback

The migration includes a `down()` function, but it does NOT remove slugs (to preserve data). If you need to remove slugs, create a separate migration.

To rollback (if needed):
```bash
npm run strapi db:migrate:down
```

## Notes

- **Idempotent**: Safe to run multiple times - only updates products without slugs
- **Persian Support**: Generates slugs that preserve Persian/Arabic characters
- **Backwards Compatible**: Old ID-based URLs still work via fallback in controller
- **Performance**: Processes in batches with small delays to avoid database overload

## Troubleshooting

### "Slug column does not exist"
- Make sure you've updated the product schema and restarted Strapi
- The schema change should create the column automatically

### "Products table does not exist"
- This shouldn't happen in a normal setup
- Check your database connection

### Migration hangs or is slow
- Large product catalogs may take time
- Check database performance and indexes
- Consider running during off-peak hours

## Related Files

- **Schema**: `apps/backend/src/api/product/content-types/product/schema.json`
- **Utilities**: `apps/backend/src/utils/productSlug.ts`
- **Lifecycle Hooks**: `apps/backend/src/api/product/content-types/product/lifecycles.ts`
- **Manual Script**: `apps/backend/scripts/generate-product-slugs.js` (alternative method)



