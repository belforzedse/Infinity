# 🚀 Enhanced Interactive WooCommerce Importer

A user-friendly menu-driven interface for importing WooCommerce data to your live Strapi server.

## Quick Start

### From Your Local Machine
```bash
npm run import:interactive
# or
node scripts/woocommerce-importer/interactive.js
```

### Using Environment Variables (Secure)
```bash
# Set up credentials in .env.local
STRAPI_TOKEN='your_token' \
STRAPI_URL='https://api.infinity.rgbgroup.ir/api' \
npm run import:interactive
```

## Features

### ✨ Supported Import Types

1. **Categories** - WooCommerce product categories → Strapi product categories
2. **Users** - WooCommerce customers → Strapi local users
3. **Products** - WooCommerce products with support for category filtering
4. **Variations** - Product variations (SKUs), colors, sizes, models
5. **Orders** - Complete order data with items and contracts

### 🎯 Key Capabilities

- **Interactive Menu System** - Simple text menu for selecting imports
- **Per-Entity Configuration** - Set limit, page, and dry-run mode for each type
- **Category Filtering** - Import products from specific WooCommerce categories only
- **Dry-Run Mode** - Preview changes without making them
- **Correct Import Order** - Automatically runs imports in dependency order:
  - Categories → Users → Products → Variations → Orders
- **Progress Tracking** - See real-time statistics and progress
- **Status Dashboard** - View all tracked mappings and import history
- **Reset Option** - Clear mappings if needed for re-imports
- **Error Recovery** - Continue with next importer if one fails

## How to Use

### Step 1: Start the Interactive Importer
```bash
npm run import:interactive
```

You'll see a menu like this:
```
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║           🚀 WooCommerce → Strapi Enhanced Interactive Importer           ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

📋 Current Import Configuration:

  ⭕ CATEGORIES
     Limit: 100 | Dry Run: Yes
  ⭕ USERS
     Limit: 100 | Dry Run: Yes
  ...

📝 Main Menu:

  1️⃣  Configure Categories Import
  2️⃣  Configure Users Import
  3️⃣  Configure Products Import
  4️⃣  Configure Variations Import
  5️⃣  Configure Orders Import
  6️⃣  Run All Enabled Importers
  7️⃣  View Import Status & Mappings
  8️⃣  Clear All Mappings (Reset Progress)
  9️⃣  Exit
```

### Step 2: Configure Each Importer

**Example: Configure Products Import**

```
Enter your choice (1-9): 3

🔧 Configure PRODUCTS Import

Enable products import? (y/n): y
Number of items to import (default: 50): 100
Starting page (default: 1): 1
Dry run mode (y/n)? (default: y): n
Filter by WooCommerce category IDs? (comma-separated, e.g., "5,12,18", or leave blank): 5,12

✅ PRODUCTS configuration saved!
```

### Step 3: Run All Enabled Importers

```
Enter your choice (1-9): 6
```

The system will:
1. Show what's configured
2. Ask for final confirmation
3. Run each importer in the correct order
4. Display progress and statistics
5. Show summary when complete

### Step 4: Check Status

```
Enter your choice (1-9): 7

📊 Import Status & Mappings

CATEGORIES:
  📊 Total tracked: 100
  📅 Oldest: 2025-07-26T01:17:03.672Z
  📅 Newest: 2025-10-25T09:32:59.561Z

PRODUCTS:
  📊 Total tracked: 250
  ...
```

## Configuration Options

### Categories Import
- **Limit** - Number of categories to import (default: 100)
- **Page** - Starting page (default: 1)
- **Dry Run** - Preview mode (default: Yes)

### Users Import
- **Limit** - Number of customers to import (default: 100)
- **Page** - Starting page (default: 1)
- **Dry Run** - Preview mode (default: Yes)

### Products Import
- **Limit** - Number of products to import (default: 50)
- **Page** - Starting page (default: 1)
- **Categories** - Filter by WooCommerce category IDs (optional)
- **Dry Run** - Preview mode (default: Yes)

### Variations Import
- **Limit** - Number of variations to import (default: 100)
- **Page** - Starting page (default: 1)
- **Dry Run** - Preview mode (default: Yes)

### Orders Import
- **Limit** - Number of orders to import (default: 50)
- **Page** - Starting page (default: 1)
- **Dry Run** - Preview mode (default: Yes)

## Dry-Run Mode

Always test with dry-run first! This mode:
- ✅ Fetches data from WooCommerce
- ✅ Shows what would be imported
- ❌ Does NOT make changes to Strapi
- ✅ Allows you to verify everything looks correct

## Workflow: Test → Import → Verify

### 1. Test with Small Batch
```
Limit: 10
Dry Run: Yes
Run All Enabled Importers
```

Review the preview output. If looks good, proceed.

### 2. Disable Dry-Run and Run Again
```
Limit: 10
Dry Run: No
Run All Enabled Importers
```

Check your Strapi dashboard to verify data was imported correctly.

### 3. Run Full Import
```
Limit: 1000  # or larger
Dry Run: No
Run All Enabled Importers
```

## Advanced: Category Filtering

Import products from only specific WooCommerce categories:

```
Enter your choice (1-9): 3

🔧 Configure PRODUCTS Import

Enable products import? (y/n): y
...
Filter by WooCommerce category IDs? (comma-separated, e.g., "5,12,18", or leave blank): 1331,1337,1346

✅ Filtering by categories: [1331, 1337, 1346]
```

This imports only products in those WooCommerce categories.

## Troubleshooting

### Issue: "Missing STRAPI_TOKEN"
**Solution:** Set the token before running:
```bash
STRAPI_TOKEN='your_token_here' npm run import:interactive
```

Or update `scripts/woocommerce-importer/config.js` with your token.

### Issue: "API Connection Failed"
**Solution:** Check:
- Your internet connection is stable
- Strapi server is running and accessible
- API token is valid
- WooCommerce API is accessible

### Issue: "Too Many Duplicates"
**Solution:** Use the deduplication tools:
```bash
npm run import:dedup
```

See `DEDUP_GUIDE.md` for details.

### Issue: "Rate Limit Exceeded"
**Solution:** Reduce the limit and run in smaller batches:
```
Limit: 10  (instead of 100)
```

The importer automatically applies delays between requests.

## Reset and Start Fresh

If you want to re-import everything (useful for testing):

```
Enter your choice (1-9): 8

⚠️  WARNING: Clear All Mappings

This will reset all import tracking, allowing items to be re-imported.
...

Type "clear" to confirm clearing all mappings: clear

✅ All mappings cleared!
```

**Note:** This only clears the mapping files. You'll need to manually delete items from Strapi if you want a true fresh start.

## Other Useful Commands

### View all available CLI commands
```bash
node scripts/woocommerce-importer/index.js --help
```

### Run single importer from CLI
```bash
# Import just categories
node scripts/woocommerce-importer/index.js categories --limit 100 --dry-run

# Import products with category filter
node scripts/woocommerce-importer/index.js products --limit 50 --categories 5 12 18

# Import all data in correct order
node scripts/woocommerce-importer/index.js all --limit 100
```

### Deduplication
```bash
# Deduplicate all entities
npm run import:dedup

# Deduplicate categories only
npm run import:dedup:categories
```

## Performance Tips

- **First time?** Start with limit: 10, dry-run: yes
- **After verification?** Increase to limit: 100, dry-run: no
- **Large imports?** Run at off-peak hours
- **Rate limiting?** Decrease limit if hitting API limits
- **Long imports?** Keep terminal open (don't close shell)

## Mapping Files

All progress is saved in `scripts/woocommerce-importer/import-tracking/`:
- `category-mappings.json` - WooCommerce → Strapi category mappings
- `product-mappings.json` - Product mappings
- `variation-mappings.json` - Variation mappings
- `order-mappings.json` - Order mappings
- `user-mappings.json` - User mappings

These track what's been imported to prevent duplicates.

## Support

For issues or improvements, check:
- `scripts/woocommerce-importer/README.md` - Full documentation
- `scripts/woocommerce-importer/config.js` - Configuration settings
- Strapi logs for detailed API error messages

---

**Happy importing! 🚀**
