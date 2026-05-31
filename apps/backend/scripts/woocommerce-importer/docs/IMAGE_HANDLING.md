# Media Handling in WooCommerce Importer

## 🎯 Overview

The WooCommerce importer downloads product **images and videos** from WooCommerce and uploads them to the Strapi media library, then links them to `CoverImage` and `Media` on each product.

## 🎬 Video Import

### Sources

1. **`images[]` array** — entries with `.mp4`, `.webm`, `.mov`, or `.m4v` URLs
2. **`meta_data[]`** — plugin keys (configurable via `IMPORT_VIDEOS_META_KEYS`):
   - `_product_video`, `product_video`, `_woo_product_video`, `product_video_gallery`, `_featured_video`, etc.

Run discovery on your store:

```bash
node discover-product-videos.js --limit=50 --page=1
```

### Cover vs gallery

- **CoverImage**: first **image** in `images[]`; if none, first **video**
- **Media**: remaining images + all other videos (including meta URLs)
- **Embed URLs** (YouTube/Vimeo): logged and skipped — not downloadable as Strapi files

### Video configuration

```javascript
// config.js → import.videos
videos: {
  enableUpload: true,              // IMPORT_VIDEOS_ENABLE_UPLOAD=false to disable
  maxSize: 256 * 1024 * 1024,       // 256MB default — set STRAPI_MAX_UPLOAD_SIZE_MB + IMPORT_VIDEOS_MAX_SIZE
  allowedTypes: ['mp4', 'webm', 'mov', 'm4v'],
  metaKeys: [/* see config.js defaults */],
  skipEmbedUrls: true,
  downloadTimeout: 120000,
  uploadTimeout: 120000,
}
```

### Validation

- Extension + response `Content-Type` must indicate `video/*`
- Oversized or invalid files log Persian warnings and are skipped (import continues)

---

## 🖼️ How It Works

### Media Processing Flow

```
WooCommerce Product Media → Download → Strapi Media Library → Link to Product
    ↓                          ↓              ↓                ↓
1. Extract URLs           2. Download     3. Upload      4. Link Relations
   (images + videos)         (WebP/images)   to Strapi      CoverImage & Media
                             raw videos
```

### Media Types Handled

1. **Cover**: First image in WooCommerce `images[]` (or first video if no images)
   - Maps to: `CoverImage` field in Strapi Product

2. **Gallery**: Remaining images + videos from `images[]` and `meta_data`
   - Maps to: `Media` field in Strapi Product

## 🔧 Technical Implementation

### ImageUploader Class

The `ImageUploader` utility class handles images **and videos**:

- ✅ **Download Management**: Fetches media from WooCommerce URLs
- ✅ **Image processing**: WebP conversion via `sharp` (images only)
- ✅ **Video upload**: Raw buffer upload with correct MIME (no `sharp`)
- ✅ **Caching**, **retries**, **validation**, **Persian-friendly filenames**

See also: [`utils/mediaUtils.js`](../utils/mediaUtils.js) for URL/MIME detection.

### Key Features

#### 🛡️ **Validation & Safety**

```javascript
// Images
maxSize: 10MB
allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp']

// Videos
maxSize: 256MB
allowedTypes: ['mp4', 'webm', 'mov', 'm4v']
```

## 📝 Configuration

### Enable/Disable Upload

```javascript
import: {
  images: { enableUpload: true, /* ... */ },
  videos: { enableUpload: true, /* ... */ },
}
```

### Strapi Schema Requirements

```json
{
  "CoverImage": { "allowedTypes": ["images", "videos"] },
  "Media": { "allowedTypes": ["images", "videos"] }
}
```

---

### 1. Product Creation

```javascript
// Create product first (without images)
const product = await strapiClient.createProduct(productData);
```

### 2. Image Processing

```javascript
// Download and upload images
const imageResults = await imageUploader.handleProductImages(wcProduct, product.id);

// Returns:
// {
//   coverImageId: 123,
//   galleryImageIds: [124, 125, 126]
// }
```

### 3. Product Update

```javascript
// Link images to product
await strapiClient.updateProduct(product.id, {
  CoverImage: imageResults.coverImageId,
  Media: imageResults.galleryImageIds
});
```

## 📊 Example WooCommerce Data

### Input (WooCommerce)

```json
{
  "id": 1004583,
  "name": "تاپ الیزه C00575",
  "images": [
    {
      "id": 1004585,
      "src": "https://infinitycolor.co/wp-content/uploads/2024/07/IMG_20240301_124656_946.jpg",
      "alt": "تاپ الیزه رنگ نسکافه ای"
    },
    {
      "id": 1004586, 
      "src": "https://infinitycolor.co/wp-content/uploads/2024/07/IMG_20240301_124702_123.jpg",
      "alt": "نمای پشت تاپ"
    }
  ]
}
```

### Output (Strapi)

```javascript
// Created files in media library:
[
  {
    id: 123,
    name: "product-1004583-cover-IMG_20240301_124656_946-1704120000000.jpg",
    url: "/uploads/product_1004583_cover_...",
    alternativeText: "تاپ الیزه رنگ نسکافه ای"
  },
  {
    id: 124,
    name: "product-1004583-gallery-2-IMG_20240301_124702_123-1704120001000.jpg", 
    url: "/uploads/product_1004583_gallery_...",
    alternativeText: "نمای پشت تاپ"
  }
]

// Product updated with:
{
  CoverImage: 123,
  Media: [124]
}
```

## 🎮 Usage Examples

### Basic Import with Images

```bash
# Import products with images
node index.js products --limit 10

# Import specific product (will include images)
node index.js products --wc-id 1004583
```

### Skip Images (Faster Import)

```javascript
// Temporarily disable in config.js
import: {
  images: {
    enableUpload: false  // Skip image processing
  }
}
```

### Dry Run (Test Image URLs)

```bash
# Check image availability without downloading
node index.js products --limit 5 --dry-run
```

## 🔍 Monitoring & Debugging

### Progress Tracking

```
📸 Processing 3 images for: تاپ الیزه C00575
📥 Downloading image: https://infinitycolor.co/wp-content/.../image.jpg
✅ Downloaded 245.67KB from: https://infinitycolor.co/...
✅ Uploaded to Strapi: product-1004583-cover-... (ID: 123)
📸 Processing 2 gallery images for: تاپ الیزه C00575
✅ Gallery image 2 uploaded: product-1004583-gallery-2-...
✅ Uploaded 2 gallery images
📸 Images linked to product: تاپ الیزه C00575
```

### Error Handling

```
❌ Failed to download image: Network timeout
⚠️ Image too large: 15.2MB > 10MB
❌ Failed to upload to Strapi: Invalid file format
📸 No cover image found for product: Some Product
```

### Cache Statistics

```javascript
// Get cache performance
const stats = imageUploader.getStats();
console.log(`Cache hits: ${stats.cacheSize}`);
console.log(`Downloads cached: ${stats.downloadCacheSize}`);
```

## 🚨 Troubleshooting

### Common Issues

#### 1. **Images Not Uploading**

```bash
# Check Strapi upload configuration
# Verify file size limits in Strapi admin
# Check network connectivity to WooCommerce
```

#### 2. **Large File Errors**

```javascript
// Increase limits in config.js
images: {
  maxSize: 20 * 1024 * 1024  // 20MB
}
```

#### 3. **Rate Limiting**

```javascript
// Increase delays
images: {
  delayBetweenUploads: 1000  // 1 second
}
```

#### 4. **Memory Issues**

```javascript
// Disable caching for very large imports
images: {
  cacheImages: false
}
```

### Debug Mode

```bash
# Enable detailed image logging
DEBUG=true node index.js products --limit 5
```

## 📈 Performance Tips

### 1. **Batch Processing**

```javascript
// Optimal batch sizes
batchSizes: {
  products: 10  // Lower for image-heavy imports
}
```

### 2. **Network Optimization**

```javascript
// Adjust timeouts based on connection
images: {
  downloadTimeout: 60000,  // 60s for slow connections
  uploadTimeout: 120000    // 2 minutes for large files
}
```

### 3. **Storage Management**

```javascript
// Regular cleanup
imageUploader.cleanup();  // Clear caches and temp files
```

## 🔒 Security Considerations

- ✅ **File Type Validation**: Only allowed image formats
- ✅ **Size Limits**: Prevents malicious large uploads  
- ✅ **URL Validation**: Validates source URLs
- ✅ **Filename Sanitization**: Prevents path traversal
- ✅ **Error Isolation**: Image failures don't stop import

## 📋 Dependencies

```json
{
  "axios": "^1.6.0",       // HTTP requests
  "form-data": "^4.0.0"    // Multipart uploads
}
```

---

**Status**: ✅ Production Ready  
**Performance**: Optimized with caching  
**Compatibility**: All WooCommerce image formats  
**Support**: Persian/Farsi filenames ✅ 