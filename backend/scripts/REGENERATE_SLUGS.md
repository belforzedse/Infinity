# Regenerate Product Slugs

This script regenerates product slugs for all products in Strapi, making them accessible via SEO-friendly URLs like `/pdp/[slug]`.

## How It Works

The script:
1. Fetches all products from Strapi API (paginated)
2. Generates new slugs from product titles using `generateUnicodeSlug` (Persian-friendly)
3. Ensures slugs are unique and don't conflict with reserved routes
4. Updates products with new slugs via API

## Usage

### From Your Local Machine

```bash
cd backend

# 1. Preview changes (dry-run) - recommended first!
node scripts/regenerate-product-slugs.js --dry-run

# 2. Update only products without slugs
node scripts/regenerate-product-slugs.js

# 3. Force update ALL products (regenerate all slugs)
node scripts/regenerate-product-slugs.js --force
```

### Options

- `--dry-run` - Preview changes without updating (safe to run)
- `--force` - Update all products, even if they already have valid slugs

### Configuration

The script uses the same configuration as the WooCommerce importer:

1. **Automatic**: Uses `backend/scripts/woocommerce-importer/config.js` (same credentials)
2. **Environment Variables**: 
   ```bash
   STRAPI_URL="https://api.infinitycolor.org/api" \
   STRAPI_TOKEN="your_token" \
   node scripts/regenerate-product-slugs.js
   ```

## Example Output

```
🔗 Using Strapi API: https://api.infinitycolor.org/api
🚀 Regenerating product slugs...
Mode: ✏️  LIVE (will update products)
Force: ❌ No (only products without slugs)

📄 Processing page 1 (50 products)...
  🔄 Product 105 (شومیز نخی):
     Old: "(empty)"
     New: "شومیز-نخی"
     ✅ Updated!
  ⏭️  Product 106 (کت): Already has valid slug "کت", skipping

📄 Processing page 2 (50 products)...
  ...

============================================================
📊 Summary
============================================================
Total processed: 500
✅ Updated: 150
⏭️  Skipped: 350
❌ Errors: 0
============================================================

✅ Slug regeneration completed!
💡 PDP pages will now use the new slugs.
```

## What Happens After

1. **PDP Pages**: Products will be accessible via `/pdp/[new-slug]`
2. **SEO**: Better URLs for search engines
3. **Backwards Compatibility**: Old numeric IDs still work as fallback

## Troubleshooting

### "API token is required"
- Set `STRAPI_TOKEN` environment variable, or
- Configure in `backend/scripts/woocommerce-importer/config.js`

### "Error fetching page"
- Check Strapi server is accessible
- Verify API token has proper permissions
- Check network connectivity

### "Failed to generate/update slug"
- Product might have invalid title
- Slug might conflict with reserved routes
- Check Strapi logs for details

## Notes

- The script uses the same API client pattern as the importer
- Slugs are generated using the same `generateUnicodeSlug` utility as Strapi
- Reserved routes (like `pdp`, `blog`, `api`) are automatically avoided
- Unique slugs are guaranteed (adds numeric suffix if needed)


