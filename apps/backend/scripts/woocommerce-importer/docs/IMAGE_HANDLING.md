# Image Handling in WooCommerce Importer

## 🎯 Overview

The WooCommerce importer includes comprehensive image handling that automatically downloads product images from WooCommerce and uploads them to your Strapi media library.

## 🖼️ How It Works

### Image Processing Flow

```
WooCommerce Product Images → Download → Strapi Media Library → Link to Product
    ↓                          ↓              ↓                ↓
1. Extract URLs           2. Download     3. Upload      4. Link Relations
   from JSON                 Images         to Strapi      CoverImage & Media
```

### Image Types Handled

1. **Cover Image**: First image in the WooCommerce images array
   - Maps to: `CoverImage` field in Strapi Product
   - Single image relationship

2. **Gallery Images**: All remaining images from WooCommerce
   - Maps to: `Media` field in Strapi Product  
   - Multiple images relationship

## 🔧 Technical Implementation

### ImageUploader Class

The `ImageUploader` utility class handles:

- ✅ **Download Management**: Fetches images from WooCommerce URLs
- ✅ **Upload Processing**: Uploads to Strapi media library
- ✅ **Caching**: Prevents duplicate downloads/uploads
- ✅ **Error Handling**: Robust retry and fallback mechanisms
- ✅ **File Validation**: Size, type, and format checks
- ✅ **Filename Generation**: Clean, Persian-friendly names

### Key Features

#### 🚀 **Performance Optimized**

```javascript
// Caching system prevents duplicate work
uploadCache: Map<URL, UploadedFile>
downloadCache: Map<URL, Buffer>

// Rate limiting prevents API overload
delayBetweenUploads: 500ms
```

#### 🛡️ **Validation & Safety**

```javascript
// File size validation
maxSize: 10MB

// Supported formats
allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp']

// Timeout protection
downloadTimeout: 30s
uploadTimeout: 60s
```

#### 🌍 **Persian/Farsi Support**

```javascript
// Unicode-friendly filename generation
cleanBaseName = baseName.replace(
  /[^a-zA-Z0-9\u0600-\u06FF\u0750-\u077F-_]/g, '-'
);
```

## 📝 Configuration

### Enable/Disable Image Upload

```javascript
// config.js
import: {
  images: {
    enableUpload: true,    // Set to false to skip images
    maxSize: 10 * 1024 * 1024,
    allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    downloadTimeout: 30000,
    uploadTimeout: 60000,
    delayBetweenUploads: 500,
    cacheImages: true
  }
}
```

### Strapi Schema Requirements

```json
// Product schema must have:
{
  "CoverImage": {
    "type": "media",
    "multiple": false,
    "required": false,
    "allowedTypes": ["images"]
  },
  "Media": {
    "type": "media", 
    "multiple": true,
    "required": false,
    "allowedTypes": ["images", "videos"]
  }
}
```

## 🔄 Import Process

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