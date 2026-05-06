# 🖼️ Image Upload Configuration - DISABLED BY DEFAULT

## What Changed

**Image uploading is now DISABLED by default** when importing products. This means:

- ✅ Products will be imported WITHOUT uploading images
- ✅ Existing images in Strapi will NOT be updated
- ✅ Imports will be **faster** (no image downloading/processing)
- ✅ No more waiting for image uploads
- ✅ Images already in your database stay as they are

---

## Default Behavior

### Before (Old)
```
Import Product → Download images from WooCommerce → Upload to Strapi
⏱️ Slow (image processing takes time)
```

### Now (New - Default)
```
Import Product → Skip image handling
⏱️ Fast (only product data)
```

---

## How It Works

### When Images are DISABLED (Default)
```
Product import logs:
  ✅ Created product: "شومیز نخی" → ID: 105
  ⏭️ Image upload disabled - skipping images
```

### When Images are ENABLED
```
Product import logs:
  ✅ Created product: "شومیز نخی" → ID: 105
  📸 Processing 3 images for: شومیز نخی
  ✅ Uploaded cover image
  ✅ Uploaded 2 gallery images
  📂 Images synced for product: شومیز نخی
```

---

## How to Enable Image Upload

### Option 1: Environment Variable
```bash
# Enable image uploads for this import session
IMPORT_IMAGES_ENABLE_UPLOAD=true npm run import:interactive
```

### Option 2: .env File
```bash
# Edit your .env file
IMPORT_IMAGES_ENABLE_UPLOAD=true
```

Then run normally:
```bash
npm run import:interactive
```

### Option 3: Edit Config
In `scripts/woocommerce-importer/config.js`, change:
```javascript
enableUpload: process.env.IMPORT_IMAGES_ENABLE_UPLOAD === 'true', // Disabled by default
```

To:
```javascript
enableUpload: true, // Force enabled
```

---

## When to Use Each Setting

### Images DISABLED ✅ (Default)
Use when:
- You just want to import product data quickly
- You already have images in Strapi
- You don't want to re-upload images
- You want to save time and bandwidth
- First-time import (just get the data in)

### Images ENABLED ✅ (Optional)
Use when:
- You want to import product images from WooCommerce
- Your Strapi database doesn't have images yet
- You want to sync WooCommerce images
- You're okay with slower import (image processing takes time)
- You ran the import without images before and now want to add them

---

## Configuration Details

```javascript
// In config.js
import: {
  images: {
    enableUpload: false,  // ← Disabled by default
    maxSize: 10 * 1024 * 1024,  // 10MB limit
    allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    downloadTimeout: 30000,  // 30 seconds
    uploadTimeout: 60000,    // 60 seconds
    delayBetweenUploads: 500, // 500ms delay
    cacheImages: true,       // Cache downloaded images
    conversion: {
      convertWebpToJpg: true,  // Convert WebP to JPEG
      jpegQuality: 90,
      pngCompressionLevel: 8,
      enableOptimization: true
    }
  }
}
```

---

## Environment Variables

Control image upload settings via environment variables:

```bash
# Enable/disable image uploads
IMPORT_IMAGES_ENABLE_UPLOAD=true|false

# Image file size limit
IMPORT_IMAGES_MAX_SIZE=10485760  # bytes (10MB default)

# Allowed file types
IMPORT_IMAGES_ALLOWED_TYPES=jpg,jpeg,png,gif,webp

# Timeouts (in milliseconds)
IMPORT_IMAGES_DOWNLOAD_TIMEOUT=30000
IMPORT_IMAGES_UPLOAD_TIMEOUT=60000

# Delay between uploads (to avoid overwhelming API)
IMPORT_IMAGES_DELAY=500

# Cache images locally?
IMPORT_IMAGES_CACHE=true

# WebP conversion
IMPORT_IMAGES_CONVERT_WEBP=true
IMPORT_IMAGES_JPEG_QUALITY=90
IMPORT_IMAGES_PNG_COMPRESSION=8
IMPORT_IMAGES_ENABLE_OPTIMIZATION=true
```

---

## Performance Impact

### With Images DISABLED (Default)
```
10 products in ~5 seconds
✅ Fast!
```

### With Images ENABLED
```
10 products with images in ~30-60 seconds
(depends on image sizes and internet speed)
```

**Disabling images saves ~80% of import time!**

---

## Workflow Recommendation

### Two-Step Approach
```bash
# Step 1: Import all products (fast, no images)
IMPORT_IMAGES_ENABLE_UPLOAD=false npm run import:interactive
# Takes 5-10 minutes for 1000 products

# Step 2: Later, add images separately (if needed)
IMPORT_IMAGES_ENABLE_UPLOAD=true npm run import:interactive
# Takes 30-60 minutes for 1000 products with images
```

### Or: Just Import Data
```bash
# Don't import images at all - keep existing ones
npm run import:interactive
# Images are left as-is in your Strapi database
```

---

## FAQ

### Q: Will my existing images be deleted?
**A:** No! If images are disabled (default), existing images are **never touched**. They stay exactly as they are.

### Q: Can I import images later?
**A:** Yes! You can run the importer with `IMPORT_IMAGES_ENABLE_UPLOAD=true` later to add images.

### Q: Why is this disabled by default?
**A:** Because:
1. **Speed** - Importing images is slow (network, processing)
2. **Reliability** - Fewer things can go wrong
3. **Control** - You can decide when to upload images
4. **Safety** - No risk of overwriting existing images

### Q: What if I need images imported automatically?
**A:** Set the environment variable:
```bash
IMPORT_IMAGES_ENABLE_UPLOAD=true npm run import:interactive
```

### Q: How do I check if images are enabled/disabled?
**A:** When you run import, it will log:
```
✅ Uploaded cover image      ← Images ARE uploading
```
or
```
⏭️ Image upload disabled      ← Images are NOT uploading
```

### Q: What happens to image settings if I don't set the env var?
**A:** It defaults to DISABLED. You must explicitly enable it:
```bash
IMPORT_IMAGES_ENABLE_UPLOAD=true
```

---

## Before & After

### Before This Change
- Images always uploaded automatically
- Slow imports
- Couldn't skip image processing
- Hard to debug image issues

### After This Change
- Images disabled by default ✅
- Fast imports ✅
- Choose when to upload images ✅
- Easier to troubleshoot ✅
- Better control ✅

---

## Summary

| Setting | Default | Speed | What Happens |
|---------|---------|-------|--------------|
| **Images Disabled** | ✅ Yes | Fast ⚡ | Products imported, images left alone |
| **Images Enabled** | ❌ No | Slow 🐢 | Products + images imported from WooCommerce |

**To enable images:**
```bash
IMPORT_IMAGES_ENABLE_UPLOAD=true npm run import:interactive
```

**That's it!** 🎉

---

Created: 2025-10-25
Status: ✅ Complete
