# 📋 WooCommerce Importer - Quick Reference

## 🚀 Start Here

```bash
# Interactive menu (recommended for first-time users)
npm run import:interactive

# Or directly
node scripts/woocommerce-importer/interactive.js
```

## 📦 What Can You Import?

| Entity | Command | Example | Dependencies |
|--------|---------|---------|--------------|
| Categories | `categories` | Categories, subcategories | None |
| Users | `users` | Customers from WooCommerce | None |
| Products | `products` | Product data, descriptions | Categories first |
| Variations | `variations` | SKUs, colors, sizes, models | Products first |
| Orders | `orders` | Complete orders, items | Users & Products first |

## ⚡ Common Commands

### Fastest Way (Interactive Menu)
```bash
npm run import:interactive
```
Choose options, confirm, done!

### Test Categories (Dry-Run)
```bash
node scripts/woocommerce-importer/index.js categories --limit 10 --dry-run
```

### Import All Data
```bash
node scripts/woocommerce-importer/index.js all --limit 1000
```

### Import Products from Specific Categories
```bash
# Categories 5, 12, 18 only
node scripts/woocommerce-importer/index.js products --limit 50 --categories 5 12 18
```

### Check Progress
```bash
node scripts/woocommerce-importer/index.js status
```

## 🧹 Deduplication

### Remove All Duplicates (Recommended)
```bash
npm run import:dedup
# Reviews all entities, shows duplicates, asks to confirm delete
```

### Remove Category Duplicates Only
```bash
npm run import:dedup:categories
```

## 🔧 Configuration Cheat Sheet

### Quick Setup from Terminal
```bash
# Dry-run (preview only, no changes)
node scripts/woocommerce-importer/index.js categories --limit 50 --dry-run

# Real import (makes changes)
node scripts/woocommerce-importer/index.js categories --limit 50

# All data types in order
node scripts/woocommerce-importer/index.js all --limit 100
```

### Using Environment Variables
```bash
STRAPI_TOKEN='your_token' \
STRAPI_URL='https://api.infinity.rgbgroup.ir/api' \
npm run import:interactive
```

## 📊 Recommended Workflow

### First Time Setup
```bash
# 1. Start interactive importer
npm run import:interactive

# 2. Configure categories
> Choose option 1
> Enable? y
> Limit? 10
> Dry Run? y (test first!)

# 3. Run
> Choose option 6

# 4. Verify in Strapi dashboard
# 5. If looks good, repeat with dry-run: no and larger limit
```

### Production Import
```bash
# 1. Start interactive
npm run import:interactive

# 2. Configure all entity types
> Option 1: Categories (limit: 500, dry-run: no)
> Option 2: Users (limit: 100, dry-run: no)
> Option 3: Products (limit: 200, dry-run: no)
> Option 4: Variations (limit: 1000, dry-run: no)
> Option 5: Orders (limit: 100, dry-run: no)

# 3. Run all
> Option 6
> Confirm? yes

# 4. Monitor progress
# 5. Check dashboard for results
```

### Repeat Import (After Fixing Issues)
```bash
# Reset mappings if needed
npm run import:interactive
> Option 8: Clear All Mappings
> Type: clear

# Then re-import
npm run import:interactive
```

## 🐛 Troubleshooting Quick Fixes

### "Nothing imports"
```bash
# Check status/mappings
node scripts/woocommerce-importer/index.js status

# Try clearing and re-importing
npm run import:interactive
> Option 8 to reset
```

### "Duplicate errors"
```bash
# Remove all duplicates
npm run import:dedup

# Or just categories
npm run import:dedup:categories
```

### "API connection error"
```bash
# Check if Strapi is accessible
curl https://api.infinity.rgbgroup.ir/api/product-categories -H "Authorization: Bearer YOUR_TOKEN"

# Try with explicit token
STRAPI_TOKEN='your_token' npm run import:interactive
```

### "Too slow / Rate limited"
```bash
# Reduce limit and batch size
npm run import:interactive
> Configure with smaller limit (10-20 items)
```

## 📈 Monitoring

### During Import
- Watch the progress bar
- Check for errors (red ❌)
- Look for warnings (yellow ⚠️)

### After Import
```bash
# Check what was imported
npm run import:interactive
> Option 7: View Import Status

# Verify in Strapi
# Login to admin panel → Products → See new items
```

## 📁 Important Files

- `scripts/woocommerce-importer/interactive.js` - Interactive menu
- `scripts/woocommerce-importer/index.js` - CLI commands
- `scripts/woocommerce-importer/config.js` - Settings (API tokens, etc.)
- `scripts/woocommerce-importer/import-tracking/` - Progress files
- `scripts/woocommerce-importer/importers/` - Individual importers

## 🔐 Security Notes

### ⚠️ API Token Security
- Token is in `config.js` (don't commit!)
- Use environment variables for local work
- Keep token secret

### Safe to Use
- Dry-run mode (preview only)
- Interactive menu asks for confirmation
- Mapping files prevent accidental re-imports
- Can reset anytime

## ✅ Verification Checklist

After importing, verify:
- [ ] Correct number of items imported
- [ ] No duplicate errors in logs
- [ ] Strapi dashboard shows new items
- [ ] Item details are complete (prices, descriptions)
- [ ] Categories are linked correctly
- [ ] Products have variations attached
- [ ] Images uploaded (if configured)

## 💡 Pro Tips

1. **Always test first** - Use `--dry-run` before real imports
2. **Start small** - Use `--limit 10` to verify setup works
3. **Import in order** - Categories → Users → Products → Variations → Orders
4. **Monitor progress** - Keep terminal open to watch import
5. **Keep mappings** - Don't delete `import-tracking/` folder (tracks progress)
6. **Check logs** - Strapi logs show detailed errors

## 🆘 Getting Help

### View All Options
```bash
node scripts/woocommerce-importer/index.js --help
node scripts/woocommerce-importer/index.js categories --help
```

### Full Documentation
- See `INTERACTIVE_GUIDE.md` for detailed guide
- See `README.md` for complete documentation
- Check logs in `import-tracking/` directory

## 🎯 Common Scenarios

### Scenario 1: Import Everything
```bash
npm run import:interactive
> Option 1: Categories (limit: 500)
> Option 2: Users (limit: 200)
> Option 3: Products (limit: 300)
> Option 4: Variations (limit: 1000)
> Option 5: Orders (limit: 100)
> Option 6: Run All
```

### Scenario 2: Fix Duplicates
```bash
npm run import:dedup
# Reviews and removes all duplicates
```

### Scenario 3: Re-Import Specific Category
```bash
# Reset and re-import just products from category 5
npm run import:interactive
> Option 8: Clear mappings
> Option 3: Products, categories: 5
> Option 6: Run
```

### Scenario 4: Check What's Been Imported
```bash
npm run import:interactive
> Option 7: View Status

# Shows total tracked items, import dates, etc.
```

---

**Ready to import?** Start with `npm run import:interactive` 🚀
