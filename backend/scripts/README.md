# Product Import Scripts

This directory contains scripts for importing product data from `strapi_import_enhanced.json` into your Strapi instance.

## Overview

The import process handles:

- **Products**: Main product information with titles, descriptions, images
- **Categories**: Product categories with hierarchical support
- **Variations**: Product variations with SKUs, pricing, and stock
- **Images**: Automatic download and upload of product images from external URLs
- **Relationships**: Proper linking between products, categories, variations, and stock

## Files

- `test-api-connection.js` - Tests API connectivity and validates schema
- `import-products.js` - Main import script for products and related data
- `README.md` - This documentation file

## Prerequisites

1. **Dependencies**: Install required packages

   ```bash
   npm install
   ```

2. **API Configuration**: The scripts are configured with:

   - **Base URL**: `https://api.infinity.rgbgroup.ir` (updated from deprecated darkube)
   - **API Token**: Already configured in the scripts (frontend credentials)
   - **Source File**: `strapi_import_enhanced.json` (in project root)

3. **Strapi Instance**: Your Strapi instance must be running and accessible

## Usage

### Step 1: Test API Connection

Before importing, test the API connection and check the current schema:

```bash
npm run test:api
```

Or directly:

```bash
node scripts/test-api-connection.js
```

This will:

- ✅ Test API connectivity
- 📊 Check all required endpoints
- 📋 Analyze current schema structure
- 📈 Show current record counts
- 🚀 Confirm readiness for import

### Step 2: Run the Import

If the API test passes, start the import:

```bash
npm run import:products
```

Or directly:

```bash
node scripts/import-products.js
```

## Import Process

### Data Flow

1. **Categories First**: Creates/finds categories from the JSON data
2. **Image Download**: Downloads images from external URLs
3. **Image Upload**: Uploads images to Strapi media library
4. **Product Creation**: Creates products with all metadata
5. **Variation Creation**: Creates default variations for each product
6. **Stock Management**: Creates stock records for variations

### Features

- **Duplicate Prevention**: Checks for existing records before creating
- **Rate Limiting**: Implements delays to prevent API overload
- **Batch Processing**: Processes products in batches of 5
- **Error Handling**: Continues processing even if individual items fail
- **Progress Tracking**: Shows detailed progress and statistics
- **Image Handling**: Supports WebP, JPEG, PNG formats
- **Persian/Arabic Support**: Handles RTL text and Unicode properly

### Data Mapping

#### JSON → Strapi Product

```json
{
  "title": "Product Title",           // → Title
  "description": "Description",       // → Description
  "short_description": "Short desc",  // → Description (fallback)
  "stock_status": "instock",          // → Status ("Active"/"InActive")
  "featured_image": {...},            // → CoverImage
  "gallery": [...],                   // → Media
  "categories": [...],                // → product_main_category + product_other_categories
  "price": { "amount": 100000 },      // → Variation Price
  "sku": "SKU123",                    // → Variation SKU
  "stock_quantity": 10                // → Stock Count
}
```

#### Category Creation

- **Title**: Direct from JSON categories array
- **Slug**: Auto-generated from title (Persian-friendly)
- **Hierarchy**: Supports parent-child relationships

#### Variation Creation

- **SKU**: Uses JSON SKU or generates unique one
- **Price**: Maps from price.amount field
- **Published**: Based on stock_status
- **Stock**: Creates linked stock record

## Configuration

### API Settings

Located at the top of each script:

```javascript
// Use current API base URL (not deprecated darkube)
const STRAPI_URL = "https://api.infinity.rgbgroup.ir";
// Use frontend credentials token for consistency
const API_TOKEN = "STRAPI_API_TOKEN";
const JSON_FILE_PATH = "./strapi_import_enhanced.json";
```

### Batch Settings

```javascript
const batchSize = 5; // Products per batch
const delayBetweenBatches = 3000; // 3 seconds
const imageDownloadTimeout = 15000; // 15 seconds
```

## Monitoring

### Progress Indicators

- 🏷️ Product processing with counts
- 📥 Image download progress
- ✅ Successful operations
- ❌ Error reporting
- ⏳ Batch timing information

### Final Statistics

```
📊 IMPORT STATISTICS
Categories:
  ✅ Created: 15
  📂 Existing: 3
  ❌ Errors: 0

Products:
  ✅ Created: 180
  📦 Existing: 53
  ❌ Errors: 2

Variations:
  ✅ Created: 180
  🔄 Existing: 53
  ❌ Errors: 2

Images:
  ✅ Uploaded: 850
  ❌ Errors: 15
```

## Error Handling

### Common Issues

1. **API Connection Failed**

   - Check Strapi server status
   - Verify API token validity
   - Check network connectivity

2. **Image Download Errors**

   - External URLs may be unreachable
   - Rate limiting from source server
   - Network timeout issues

3. **Schema Validation Errors**

   - Required fields missing in Strapi
   - Field type mismatches
   - Unique constraint violations

4. **Permission Errors**
   - API token may lack required permissions
   - Content type permissions not configured

### Recovery

The import script is designed to be **resumable**:

- Skips existing records automatically
- Continues after errors
- Can be run multiple times safely

## Performance

### Optimization Features

- **Parallel Processing**: Multiple operations within batches
- **Image Caching**: Avoids re-downloading existing images
- **Efficient Queries**: Uses filters to check existing records
- **Memory Management**: Streams image data instead of loading into memory

### Expected Performance

- **Products**: ~50-100 products per minute
- **Images**: Depends on external server speed
- **Total Time**: ~30-60 minutes for 233 products

## Troubleshooting

### Debug Mode

Add console logging for detailed debugging:

```javascript
// Add this for more verbose output
console.log("Debug:", JSON.stringify(data, null, 2));
```

### Manual Testing

Test individual operations:

```javascript
// Test single category creation
const category = await createOrGetCategory("Test Category");

// Test single image upload
const image = await uploadImageToStrapi(imageData, "test.jpg");
```

### Validation

Check imported data in Strapi admin:

1. Navigate to Content Manager
2. Check Products, Categories, Variations
3. Verify relationships are properly linked
4. Confirm images are uploaded correctly

## Schema Requirements

### Products Schema

```json
{
  "Title": "string (required)",
  "CoverImage": "media (required)",
  "Description": "text",
  "Status": "enum ['Active', 'InActive']",
  "Media": "media (multiple)",
  "product_main_category": "relation",
  "product_other_categories": "relation"
}
```

### Categories Schema

```json
{
  "Title": "string (required)",
  "Slug": "string (required, unique)"
}
```

### Variations Schema

```json
{
  "SKU": "string (required, unique)",
  "Price": "biginteger (required)",
  "IsPublished": "boolean",
  "product": "relation (required)",
  "product_stock": "relation"
}
```

## Support

For issues or questions:

1. Check the console output for specific error messages
2. Run the API test script to validate configuration
3. Review the Strapi logs for server-side errors
4. Ensure all required content types are configured correctly
