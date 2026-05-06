# 🧹 Scripts Directory Cleanup

## Overview

The scripts directory has been reorganized to eliminate duplication and confusion. All WooCommerce import functionality is now centralized in the `woocommerce-importer/` folder with a unified enhanced interactive importer.

## What Changed

### Consolidated Importers

**Old Structure** (Messy)
```
scripts/
  ├── interactive-importer.js        (old version)
  ├── interactive-importer-enhanced.js (newer version)
  ├── import-products.js              (product-only import)
  ├── dry-run-import.js               (dry-run only)
  ├── woocommerce-importer/           (main importers)
  └── other utilities...
```

**New Structure** (Clean & Organized)
```
scripts/
  ├── woocommerce-importer/           (SINGLE SOURCE OF TRUTH)
  │   ├── interactive.js              (unified enhanced interactive importer)
  │   ├── index.js                    (CLI commands)
  │   ├── config.js                   (settings)
  │   ├── importers/                  (all importers)
  │   ├── utils/                      (shared utilities)
  │   ├── dedup-all-entities.js       (deduplication script)
  │   ├── INTERACTIVE_GUIDE.md        (interactive importer guide)
  │   └── QUICK_REFERENCE.md          (quick command reference)
  │
  ├── interactive-importer.js         (DEPRECATED - redirects to new)
  ├── interactive-importer-enhanced.js (DEPRECATED - redirects to new)
  ├── import-products.js              (DEPRECATED - redirects to new)
  ├── dry-run-import.js               (DEPRECATED - redirects to new)
  │
  └── other utilities (mellat, callbacks, etc.)
```

## Breaking Changes

**None!** All old scripts still work - they now redirect to the new unified importer.

## Migration Guide

### Old Way → New Way

| Old Command | New Command | NPM Script |
|------------|------------|-----------|
| `node scripts/interactive-importer.js` | `node scripts/woocommerce-importer/interactive.js` | `npm run import:interactive` |
| `node scripts/interactive-importer-enhanced.js` | ↑ Same ↑ | ↑ Same ↑ |
| `node scripts/import-products.js` | ↑ Same ↑ | ↑ Same ↑ |
| `node scripts/dry-run-import.js` | ↑ Same ↑ | ↑ Same ↑ |
| `node scripts/woocommerce-importer/index.js categories --dry-run` | Same (works as before) | N/A |

### Recommended Way Now

```bash
# Interactive menu (best for most users)
npm run import:interactive

# CLI commands (for scripting/automation)
node scripts/woocommerce-importer/index.js categories --limit 100
node scripts/woocommerce-importer/index.js products --limit 50 --categories 5,12

# Deduplication
npm run import:dedup
npm run import:dedup:categories
```

## What's New in the Unified Importer

The new `scripts/woocommerce-importer/interactive.js` combines features from both old versions:

### From `interactive-importer.js`
- ✅ Menu-driven interface
- ✅ Configure each importer separately
- ✅ Run all enabled importers
- ✅ View status and mappings

### From `interactive-importer-enhanced.js`
- ✅ **NEW:** API health checks before import
- ✅ **NEW:** Dependency validation (categories before products, etc)
- ✅ **NEW:** Import previews (shows what will be imported)
- ✅ **NEW:** Better error handling

### New Features
- ✅ **ALL importers in one menu** (categories, users, products, variations, orders)
- ✅ **Category filtering** for products
- ✅ **Better UI/UX** with clear progress
- ✅ **Comprehensive documentation** in INTERACTIVE_GUIDE.md

## File-by-File Status

### Deprecated (Keep for backward compatibility)

These files now redirect to the new importer:

| File | Status | Purpose |
|------|--------|---------|
| `scripts/interactive-importer.js` | ⚠️ DEPRECATED | Forwards to new interactive |
| `scripts/interactive-importer-enhanced.js` | ⚠️ DEPRECATED | Forwards to new interactive |
| `scripts/import-products.js` | ⚠️ DEPRECATED | Forwards to new interactive |
| `scripts/dry-run-import.js` | ⚠️ DEPRECATED | Forwards to new interactive |

**These can be safely deleted in the future, but kept for backward compatibility.**

### Active

These are the new source of truth:

| File | Status | Purpose |
|------|--------|---------|
| `scripts/woocommerce-importer/interactive.js` | ✅ **ACTIVE** | Unified enhanced interactive importer |
| `scripts/woocommerce-importer/index.js` | ✅ **ACTIVE** | CLI commands |
| `scripts/woocommerce-importer/importers/*` | ✅ **ACTIVE** | Individual importers |
| `scripts/woocommerce-importer/utils/*` | ✅ **ACTIVE** | Shared utilities |
| `scripts/woocommerce-importer/dedup-all-entities.js` | ✅ **ACTIVE** | Deduplication tool |
| `scripts/woocommerce-importer/dedup-categories.js` | ✅ **ACTIVE** | Category deduplication |

### Documentation

| File | Purpose |
|------|---------|
| `scripts/woocommerce-importer/INTERACTIVE_GUIDE.md` | Complete interactive importer guide |
| `scripts/woocommerce-importer/QUICK_REFERENCE.md` | Quick command reference |
| `scripts/woocommerce-importer/README.md` | Full technical documentation |

## NPM Scripts Updated

```json
{
  "scripts": {
    "import:interactive": "node scripts/woocommerce-importer/interactive.js",
    "import:dedup": "node scripts/woocommerce-importer/dedup-all-entities.js",
    "import:dedup:categories": "node scripts/woocommerce-importer/dedup-categories.js"
  }
}
```

## Benefits of Cleanup

### 1. **Reduced Confusion**
- No more wondering which importer to use
- Single unified interactive importer
- Clear file organization

### 2. **No Code Duplication**
- Features from all old importers in one place
- Easier to maintain
- Fewer bugs

### 3. **Better Documentation**
- Guides specific to the new importer
- Quick reference for common tasks
- All in one folder

### 4. **Backward Compatibility**
- Old scripts still work
- No breaking changes
- Gradual migration possible

## Future Cleanup (Optional)

Once everyone has migrated (maybe in 6 months):

1. Delete the deprecated wrapper scripts:
   - `scripts/interactive-importer.js`
   - `scripts/interactive-importer-enhanced.js`
   - `scripts/import-products.js`
   - `scripts/dry-run-import.js`

2. Delete the old analysis files:
   - `scripts/INTERACTIVE_IMPORTER_ANALYSIS.md`
   - `scripts/IMPORTER_COMPARISON.md`
   - `scripts/COMPLETE_IMPORTER_GUIDE.md`

But there's **no rush** - keeping them for backward compatibility is fine.

## Recommendations

### For New Users
- Use `npm run import:interactive` (easiest way)
- Read `scripts/woocommerce-importer/INTERACTIVE_GUIDE.md`

### For Scripts/Automation
- Use `npm run import:interactive` with stdin
- Or use CLI: `node scripts/woocommerce-importer/index.js categories --limit 100`

### For Troubleshooting
- Check `scripts/woocommerce-importer/QUICK_REFERENCE.md`
- Look at mapping files in `scripts/woocommerce-importer/import-tracking/`
- Run deduplication: `npm run import:dedup`

## Summary

The cleanup consolidates 4 duplicate importers into 1 unified, enhanced version with:
- ✅ All previous functionality
- ✅ New features (health checks, previews, dependency validation)
- ✅ Better documentation
- ✅ Backward compatibility
- ✅ No breaking changes

**Everything works as before, but now it's cleaner and more maintainable!** 🧹✨

---

**Questions?** Check the guides:
- `scripts/woocommerce-importer/INTERACTIVE_GUIDE.md` - Full guide
- `scripts/woocommerce-importer/QUICK_REFERENCE.md` - Quick commands
