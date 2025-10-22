# WooCommerce to Strapi Importer

A comprehensive data migration tool for importing products, categories, variations, and orders from WooCommerce to Strapi with advanced duplicate prevention and progress tracking.

## 🌟 Features

- **Hierarchical Category Import** - Maintains parent-child relationships
- **Duplicate Prevention** - Never import the same item twice
- **Progress Tracking** - Real-time progress with ETA calculations
- **Error Handling** - Robust retry mechanisms and error recovery
- **Rate Limiting** - Respects API limits to avoid overwhelming servers
- **Dry Run Mode** - Test imports without making changes
- **Persian/Farsi Support** - Handles Iranian e-commerce data properly
- **Comprehensive Logging** - Detailed logs with timestamps and statistics
- **🖼️ Advanced Image Handling** - Automatic download and upload of product images
- **🚀 Performance Caching** - Smart caching prevents duplicate downloads/uploads

## 📦 Installation

```bash
cd scripts/woocommerce-importer
npm install
```

## 🚀 Quick Start

### Test with Dry Run (Recommended)
```bash
# Test category import without making changes
node index.js categories --limit 10 --dry-run

# Test with specific page
node index.js categories --page 2 --limit 5 --dry-run
```

### Import Categories
```bash
# Import first 50 categories
node index.js categories --limit 50

# Import all categories
node index.js categories --limit 1000
```

### Import All Data
```bash
# Import everything (categories, products, variations, orders)
node index.js all --limit 100
```

## 📋 Available Commands

| Command | Description | Options |
|---------|-------------|---------|
| `categories` | Import product categories | `--limit`, `--page`, `--dry-run` |
| `products` | Import products | `--limit`, `--page`, `--categories`, `--dry-run` |
| `variations` | Import product variations | `--limit`, `--page`, `--dry-run`, `--only-imported` |
| `variations-imported` | Import variations for imported products only | `--limit`, `--page`, `--dry-run` |
| `orders` | Import orders | `--limit`, `--page`, `--dry-run` |
| `all` | Import all data types | `--limit`, `--dry-run` |

## ⚙️ Configuration

The importer is configured via `config.js`. Key settings:

### WooCommerce Settings
```javascript
woocommerce: {
  baseUrl: 'https://infinitycolor.co/wp-json/wc/v3',
  auth: {
    consumerKey: 'your_key',
    consumerSecret: 'your_secret'
  }
}
```

### Strapi Settings
```javascript
strapi: {
  baseUrl: 'https://api.infinity.rgbgroup.ir/api',
  auth: {
    token: 'your_bearer_token'
  }
}
```

### Import Settings
```javascript
import: {
  batchSizes: {
    categories: 50,
    products: 20,
    variations: 100,
    orders: 30
  },
  statusMappings: {
    product: {
      'publish': 'Active',
      'draft': 'InActive'
    }
  }
}
```

## 🔄 How It Works

### 1. **Duplicate Prevention**
- Tracks WooCommerce ID → Strapi ID mappings
- Stores mappings in JSON files (`./import-tracking/`)
- Skips already imported items automatically
- Resumes interrupted imports seamlessly

### 2. **Hierarchical Category Import**
- Fetches all categories from WooCommerce
- Sorts by hierarchy (parents first)
- Creates parent-child relationships in Strapi
- Handles missing parent references gracefully

### 3. **Progress Tracking**
- Real-time progress with percentages
- Rate calculations (items/second)
- ETA estimates
- Detailed statistics at completion

### 4. **Error Handling**
- Automatic retry for failed requests
- Rate limiting to respect API limits
- Continue on error option
- Detailed error logging

## 📊 Example Output

```
[2025-07-26T01:10:46.521Z] INFO  🏷️ Starting category import...
[2025-07-26T01:10:46.527Z] INFO  📥 Fetching categories from WooCommerce...
[2025-07-26T01:10:48.876Z] INFO  ✅ Fetched 5 categories from WooCommerce
[2025-07-26T01:10:48.876Z] INFO  🌳 Sorted categories hierarchically: 2 root categories
[2025-07-26T01:10:48.876Z] INFO  📊 Starting Importing categories: 0/5 items
[2025-07-26T01:10:48.877Z] INFO  📈 Importing categories: 5/5 (100.0%) - Rate: 5000.0 items/sec - ETA: 0s
[2025-07-26T01:10:48.877Z] SUCCESS ✅ Importing categories completed: 5 items in 0.0s (5000.0 items/sec)
[2025-07-26T01:10:48.877Z] SUCCESS 🎉 Category import completed!
[2025-07-26T01:10:48.877Z] INFO  📊 Import Statistics:
[2025-07-26T01:10:48.877Z] INFO     Total processed: 5
[2025-07-26T01:10:48.877Z] INFO     Successfully imported: 5
[2025-07-26T01:10:48.877Z] INFO     Skipped (duplicates): 0
[2025-07-26T01:10:48.877Z] INFO     Failed: 0
[2025-07-26T01:10:48.877Z] INFO     Errors: 0
```

## 📁 File Structure

```
scripts/woocommerce-importer/
├── index.js                    # Main CLI entry point
├── config.js                   # Configuration settings
├── package.json               # Dependencies and scripts
├── README.md                  # This file
├── importers/
│   ├── CategoryImporter.js    # Category import logic
│   ├── ProductImporter.js     # Product import logic (placeholder)
│   ├── VariationImporter.js   # Variation import logic (placeholder)
│   └── OrderImporter.js       # Order import logic (placeholder)
├── utils/
│   ├── Logger.js              # Logging and progress tracking
│   ├── DuplicateTracker.js    # Duplicate prevention system
│   └── ApiClient.js           # WooCommerce & Strapi API clients
├── import-tracking/           # Duplicate prevention data
│   ├── category-mappings.json # WC→Strapi category mappings
│   ├── product-mappings.json  # WC→Strapi product mappings
│   └── ...
└── logs/                      # Import logs (auto-created)
    └── import-2025-07-26.log
```

## ✨ New Features (Enhanced Importer)

### 🏷️ Category-Based Product Filtering

Import products from specific WooCommerce categories instead of all products. This is useful for:
- Incremental imports by category
- Targeting specific product lines
- Avoiding duplicate processing when products belong to multiple categories

**Usage:**
```bash
# Import products from single category (ID: 5)
node index.js products --limit 100 --categories 5

# Import products from multiple categories
node index.js products --limit 100 --categories 5 12 18

# Or using comma-separated format
node index.js products --limit 100 --categories "5,12,18"

# Dry run to test category filtering
node index.js products --limit 50 --categories 5 --dry-run
```

**How It Works:**
- When `--categories` is specified, the importer loops through each category ID
- For each category, it fetches products filtered by that category from WooCommerce
- Tracks processed product IDs to avoid importing duplicates across categories
- Each category maintains its own progress file for resume capability
- Products already imported from another category are skipped with debug logging

**Example Output:**
```
🏷️ Filtering by categories: [5, 12, 18]
📊 Resuming category 5 from page 1 (0 products already processed)
📄 Processing page 1 from category 5 (requesting 50 items)...
⏭️ Skipping product 42 (Blue Shirt) - already imported from another category
```

### 💰 Sale/Discount Pricing Support

The importer now properly handles WooCommerce sale prices and discounts:

**Price Fields Mapped:**
- `regular_price` → Strapi `Price` field
- `sale_price` → Strapi `DiscountPrice` field (when sale price < regular price)

**How It Works:**
1. For each variation, the importer checks both `regular_price` and `sale_price`
2. If a valid sale price exists (> 0 and < regular price):
   - Sets `Price` to the regular price
   - Sets `DiscountPrice` to the sale price
   - Logs the discount for verification
3. If no valid discount, uses standard price logic

**Example WooCommerce Data:**
```json
{
  "id": 42,
  "regular_price": "1000000",  // 1 million Toman (100k Rial after conversion)
  "sale_price": "850000"       // 850k Toman (85k Rial after conversion)
}
```

**Result in Strapi:**
```json
{
  "SKU": "WC-1-42",
  "Price": 10000000,      // Regular price (converted to Rial)
  "DiscountPrice": 8500000 // Sale price (converted to Rial)
}
```

**Logging Example:**
```
💰 Variation 42: Regular price 1000000, Discount price 850000
```

## 🔧 Advanced Usage

### Resume Interrupted Imports
The importer automatically resumes from where it left off using duplicate tracking:

```bash
# First run - imports 50 items
node index.js categories --limit 50

# Second run - automatically skips first 50, continues from item 51
node index.js categories --limit 100
```

### Clear Import History
To reimport everything from scratch:

```bash
# Remove tracking files
rm -rf ./import-tracking/

# Start fresh import
node index.js categories --limit 100
```

### Debug Mode
For detailed debugging information:

```javascript
// In config.js
logging: {
  level: 'debug'  // Change from 'info' to 'debug'
}
```

## 🚧 Current Status

| Component | Status | Description |
|-----------|--------|-------------|
| ✅ **Categories** | **Complete** | Full hierarchical import with duplicate prevention |
| 🚧 **Products** | In Progress | Coming next - will import basic product data |
| 🚧 **Variations** | Planned | Will import product variations with SKUs and stock |
| 🚧 **Orders** | Planned | Will import orders with customer and payment data |

## 🛠️ Development

### Adding New Importers

1. Create new importer file in `importers/`
2. Extend base importer pattern
3. Add to main CLI in `index.js`
4. Update configuration in `config.js`

### Example Importer Structure
```javascript
class MyImporter {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.duplicateTracker = new DuplicateTracker(config, logger);
  }

  async import(options = {}) {
    // Implementation
  }
}
```

## 🐛 Troubleshooting

### Common Issues

**API Rate Limits**
- Increase `delayBetweenRequests` in config
- Reduce batch sizes

**Missing Parent Categories**
- Categories are imported hierarchically
- Parent categories must exist before children
- Check import order and logs

**Strapi Authentication Errors**
- Verify bearer token is valid
- Check token permissions in Strapi admin

### Debug Steps

1. Run with `--dry-run` first
2. Check logs in `./logs/` directory
3. Verify API connectivity:
   ```bash
   curl -u "key:secret" "https://infinitycolor.co/wp-json/wc/v3/products/categories?per_page=1"
   ```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

---

**Made with ❤️ for Infinity Store** 