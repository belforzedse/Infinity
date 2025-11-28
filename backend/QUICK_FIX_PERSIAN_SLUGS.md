# Quick Fix for Persian Slug Issue

## Problem
Product pages with Persian slugs (like `/pdp/بافت-موهر-یقه-گرد-m0043`) show "product not found" because:
1. Existing products may have slugs generated with the old (broken) logic
2. The slug lookup might have encoding issues

## Solution

### Step 1: Regenerate Slugs for Existing Products

**Use the regeneration script (Recommended):**

```bash
cd backend
node scripts/regenerate-product-slugs.js
```

This script will:
- Find all active products
- Regenerate slugs using the fixed Persian-compatible logic
- Update only products where the slug changed
- Show progress and summary

**Alternative: Use Strapi Console**

If the script doesn't work, you can run it in Strapi console:

```bash
cd backend
npm run strapi console
```

Then in the console:
```javascript
await require('./scripts/regenerate-product-slugs.js')()
```

### Step 2: Verify a Product
Test with a product that has a Persian title:
```bash
# In Strapi console
const product = await strapi.entityService.findOne('api::product.product', 73, {
  fields: ['id', 'Title', 'Slug']
});
console.log('Product:', product);
console.log('Slug:', product.Slug);
```

### Step 3: Test the URL
Visit: `http://localhost:2888/pdp/[slug-from-step-2]`

## Payment System Impact

**✅ Payments are NOT affected by slug changes.**

The payment system uses:
- Product IDs (not slugs)
- Product Variation IDs
- Order IDs

Slugs are only used for:
- SEO-friendly URLs
- Frontend routing
- User-facing links

Cart, orders, and payment callbacks all use numeric IDs, so changing slugs won't break any payment flows.

