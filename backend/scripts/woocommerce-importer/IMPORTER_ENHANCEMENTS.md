# WooCommerce Importer Enhancements

## 🎉 Overview

The ProductImporter and VariationImporter have been significantly enhanced to support:
1. **Category-based product filtering** - Import products from specific WooCommerce categories
2. **Sale/discount pricing** - Properly map WooCommerce sale prices to Strapi discount fields
3. **Interactive mode** - Seamless integration with the interactive importer for easy configuration

## ✨ Feature 1: Category-Based Product Filtering

### Problem Solved
Previously, the importer would always fetch and process ALL products from WooCommerce, regardless of your needs. This was inefficient for:
- Incremental imports by category
- Targeting specific product lines
- Avoiding duplicate processing when products belong to multiple categories

### Solution
**Location**: `importers/ProductImporter.js:44-166` and `utils/ApiClient.js:120-137`

#### Changes Made:

1. **WooCommerceClient Enhancement** (`ApiClient.js`)
   - Modified `getProducts()` to accept optional `categoryId` parameter
   - When categoryId is provided, adds `category` filter to WooCommerce API request
   - Maintains backward compatibility (categoryId defaults to null for all products)

2. **ProductImporter Enhancement** (`ProductImporter.js`)
   - Added `categoryIds` array parameter to `import()` options
   - Implemented category iteration loop for multi-category imports
   - Added duplicate tracking across categories using `Set<productId>`
   - Per-category progress tracking with separate progress files
   - Intelligent skipping of products already imported from another category

3. **Progress State Management**
   - Updated `loadProgressState()`, `saveProgressState()`, `resetProgressState()` to accept `progressKey` parameter
   - Each category maintains its own progress file: `product-import-progress-cat-${categoryId}.json`
   - Allows resuming category-specific imports without affecting others

### Usage Examples:

#### Via CLI (Command Line)
```bash
# Single category
npm run import:products -- --categories 5 --limit 100

# Multiple categories
npm run import:products -- --categories "5,12,18" --limit 100

# Dry run with category filtering
npm run import:products -- --categories 5 --limit 50 --dry-run
```

#### Via Interactive Mode
```bash
node interactive-importer.js
# Choose: 2) Import products
# Answer: Filter by specific categories? → yes
# Input: 5,12,18
```

#### Via Code
```javascript
const ProductImporter = require('./importers/ProductImporter');
const importer = new ProductImporter(config, logger);

await importer.import({
  limit: 100,
  page: 1,
  categoryIds: [5, 12, 18],  // ← NEW PARAMETER
  dryRun: false
});
```

### How It Works Internally:

1. User specifies category IDs
2. For each category:
   - Load category-specific progress (may resume interrupted import)
   - Fetch products from WooCommerce filtered by category
   - For each product:
     - Check if already processed (in global Set)
     - Skip if duplicate, otherwise import
     - Track product ID to prevent re-processing
     - Save category-specific progress
3. Output: Products imported across all categories, no duplicates

### Example Output:
```
🏷️ Filtering by categories: [5, 12, 18]
📊 Resuming category 5 from page 1 (0 products already processed)
📄 Processing page 1 from category 5 (requesting 100 items)...
🔄 Processing 87 products from page 1...
⏭️ Skipping product 42 (Blue Shirt) - already imported from another category
✅ Completed page 1: 86 products processed
...
🎉 Import session completed: 258 products processed in this session
```

---

## ✨ Feature 2: Sale/Discount Pricing Support

### Problem Solved
Previously, the importer would ignore WooCommerce's `sale_price` field and only use:
- `wcVariation.price || wcVariation.regular_price`

This meant discounts wouldn't show in Strapi because:
- The discounted price would be lost
- Only the regular price would be imported

### Solution
**Location**: `importers/VariationImporter.js:335-377`

#### Changes Made:

1. **Pricing Logic Enhancement**
   - Added check for both `regular_price` and `sale_price` fields
   - Compares prices to identify valid discounts (sale_price < regular_price)
   - Maps prices to appropriate Strapi fields:
     - Regular price → `Price` field
     - Sale price → `DiscountPrice` field

2. **Price Conversion Flow**
   ```javascript
   const regularPrice = parseFloat(wcVariation.regular_price || wcVariation.price || 0);
   const salePrice = parseFloat(wcVariation.sale_price || 0);

   if (salePrice > 0 && salePrice < regularPrice) {
     // Discount detected
     strapiVariation.Price = convertPrice(regularPrice);
     strapiVariation.DiscountPrice = convertPrice(salePrice);
   } else {
     // No discount, use standard price
     strapiVariation.Price = convertPrice(wcVariation.price || wcVariation.regular_price);
   }
   ```

3. **Debug Logging**
   - Added detailed logging for discount cases: `💰 Variation 42: Regular price 1000000, Discount price 850000`
   - Helps verify correct price mapping during dry runs

### Strapi Schema Mapping:
```json
Product Variation Schema:
{
  "Price": {
    "type": "biginteger",
    "required": true,
    "min": "0"
  },
  "DiscountPrice": {
    "type": "biginteger",
    "min": "0"
  }
}
```

### Example Transformation:

**WooCommerce Data:**
```json
{
  "id": 42,
  "sku": "SHIRT-BLU-L",
  "regular_price": "1000000",  // 1M Toman
  "sale_price": "850000"        // 850K Toman (15% off)
}
```

**Strapi Result:**
```json
{
  "SKU": "SHIRT-BLU-L",
  "Price": 10000000,      // Regular (1M * 10 conversion)
  "DiscountPrice": 8500000, // Sale (850K * 10 conversion)
  "IsPublished": true
}
```

### Currency Handling:
The importer respects the configured currency multiplier:
```javascript
// In config.js
currency: {
  from: 'IRT',      // Iranian Toman
  to: 'IRR',        // Iranian Rial
  multiplier: 10    // 1 Toman = 10 Rial
}

// Applied in both regular and discount prices
Price = 1000000 * 10 = 10000000
DiscountPrice = 850000 * 10 = 8500000
```

### Usage:
No special configuration needed! Discount pricing is automatically detected and applied for all variations during import. Simply run variations import as usual:

```bash
# CLI
npm run add:variations --limit 100

# Interactive
node interactive-importer.js → Option 3: Import variations

# Code
await variationImporter.import({
  limit: 100,
  page: 1,
  dryRun: false
  // ↑ Sale prices are automatically handled
});
```

---

## ✨ Feature 3: Enhanced Interactive Mode

### Problem Solved
The interactive importer existed but didn't expose the new category filtering feature, making it difficult to use the full power of the enhanced importer without CLI knowledge.

### Solution
**Location**: `scripts/interactive-importer.js`

#### Changes Made:

1. **New Helper Function** (lines 63-78)
   - `askCategories()` - Interactive prompt for category IDs
   - Handles comma-separated input validation
   - Shows selected categories for confirmation

2. **Enhanced Products Import Menu** (lines 288-300)
   - Added question: "Filter by specific categories?"
   - Conditionally asks for category IDs
   - Passes categoryIds to importer

3. **Improved Menu Display** (lines 263-279)
   - Added emoji indicators for new features (✨)
   - Better organization with section headers
   - Shows "with category filtering" and "with discount pricing" notes

### Interactive Workflow:

```
🚀 Infinity Interactive Importer
═══════════════════════════════════════════════════════
📊 Import Options:
  1) Import categories
  2) Import products (with category filtering ✨)
  3) Import variations (with discount pricing ✨)
  ...

Enter choice: 2

Limit (50): 100
Starting page (1): 1
Filter by specific categories? [y/N]: y
Enter WooCommerce category IDs (comma-separated, e.g., 5,12,18): 5,12
✓ Selected categories: [5, 12]
Dry run [y/N]: n

🛍️ Starting product import from categories: [5, 12] (limit: 100, page: 1, dryRun: false)
...
```

---

## 📊 Summary of Changes

### Files Modified:

| File | Changes | Lines |
|------|---------|-------|
| `utils/ApiClient.js` | Added `categoryId` param to `getProducts()` | 120-137 |
| `importers/ProductImporter.js` | Category filtering loop, progress management | 44-233 |
| `importers/VariationImporter.js` | Sale price → DiscountPrice mapping | 335-377 |
| `scripts/interactive-importer.js` | Category prompt, enhanced menu | 63-300 |
| `README.md` | Documentation for new features | 175-251 |

### Key Design Decisions:

1. **Backward Compatibility**
   - All new parameters are optional with sensible defaults
   - Existing code using the importers continues to work unchanged

2. **Duplicate Prevention**
   - Products imported from one category won't be re-imported from another
   - Prevents data inconsistencies in multi-category scenarios

3. **Progress Tracking**
   - Each category has independent progress file
   - Allows safe resuming of partial imports without affecting others

4. **Pricing Logic**
   - Only sets DiscountPrice when a valid discount exists
   - Falls back to regular price logic if no discount detected
   - Respects currency conversion multiplier

5. **Logging**
   - All new operations log appropriately for debugging
   - Discount cases include clear logging for verification

---

## 🧪 Testing

### Test Scenarios:

1. **Category Filtering**
   ```bash
   # Dry run with category filtering
   npm run import:products -- --categories 5 --limit 10 --dry-run

   # Verify: Products from category 5 are listed
   # Verify: Duplicate skipping messages appear for products in multiple categories
   ```

2. **Discount Pricing**
   ```bash
   # Dry run with variations
   npm run add:variations --limit 10 --dry-run

   # Verify: Products with sale_price show discount logging
   # Verify: Price and DiscountPrice are set correctly
   ```

3. **Interactive Mode**
   ```bash
   node scripts/interactive-importer.js

   # Option 2: Products with category filtering
   # Option 3: Variations (discount pricing automatic)
   ```

---

## 🚀 Next Steps

To use the enhanced importer:

1. **For Category Filtering:**
   ```bash
   # Find category IDs in preview menu (option 9)
   node scripts/interactive-importer.js

   # Then use the filtered import
   npm run import:products -- --categories 5,12,18
   ```

2. **For Discount Pricing:**
   - No special action needed
   - Run variations import normally, discounts are automatically handled

3. **For Full Integration:**
   - Use interactive mode for guided import experience
   - Combines all features in easy-to-use menu

---

## 📝 Notes

- Category filtering is most useful when products belong to multiple categories in WooCommerce
- Discount pricing requires `sale_price` to be less than `regular_price` to trigger
- Progress tracking files are created automatically in `./import-tracking/`
- All operations support `--dry-run` for testing without data changes

