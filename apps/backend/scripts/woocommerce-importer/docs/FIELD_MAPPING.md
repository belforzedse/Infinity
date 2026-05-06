# Field Mapping Reference

This document details exactly which fields are imported from WooCommerce to Strapi for each entity type.

## 📋 Field Mapping Overview

| Entity | WooCommerce Fields | Strapi Fields | Additional Processing |
|--------|-------------------|---------------|----------------------|
| **Product Category** | name, slug, parent, description | Title, Slug, parent, external_* | Category content creation |
| **Product** | name, description, status, images, categories | Title, Description, Status, CoverImage, Media | Image processing, category linking |
| **Product Variation** | sku, price, status, attributes, stock | SKU, Price, IsPublished, product_* | Attribute creation, stock management |
| **Order** | date_created, status, total, customer, items | Date, Status, ShippingCost, user, order_items | Customer creation, contract creation |

---

## 🏷️ Product Category Fields

### WooCommerce Input
```json
{
  "id": 2160,
  "name": "بارانی",
  "slug": "baroni", 
  "parent": 15,
  "description": "<h1>خرید بارانی زنانه...</h1>",
  "count": 25
}
```

### Strapi Output
```javascript
// Main Category
{
  Title: "بارانی",                    // ← name
  Slug: "baroni",                     // ← slug
  parent: 123,                        // ← parent (mapped Strapi ID)
  external_id: "2160",               // ← id (tracking)
  external_source: "woocommerce"     // (tracking)
}

// Category Content (if description exists)
{
  Title: "بارانی Description",         // ← name + " Description"
  Paragraph: "خرید بارانی زنانه...",   // ← description (HTML cleaned)
  IsPublished: true,
  IsRTL: true,                        // (Persian content)
  product_category: 123               // ← link to category
}
```

### Field Details
- **Title**: Direct mapping from `name`
- **Slug**: Direct mapping from `slug` 
- **parent**: WooCommerce parent ID → mapped to Strapi category ID
- **external_id**: WooCommerce `id` as string
- **external_source**: Always `"woocommerce"`

---

## 📦 Product Fields

### WooCommerce Input
```json
{
  "id": 1004583,
  "name": "تاپ الیزه C00575",
  "slug": "elise-top-c00575",
  "description": "<p>کرپ حریر...</p>",
  "short_description": "<p><strong>جنس</strong>:کرپ حریر</p>",
  "status": "publish",
  "average_rating": "4.5",
  "rating_count": 12,
  "categories": [
    {"id": 15, "name": "تاپ"}
  ],
  "images": [
    {
      "src": "https://infinitycolor.co/.../image.jpg",
      "alt": "تاپ الیزه"
    }
  ]
}
```

### Strapi Output
```javascript
{
  Title: "تاپ الیزه C00575",           // ← name
  Description: "کرپ حریر...",          // ← description (HTML cleaned)
  Status: "Active",                   // ← status (mapped)
  AverageRating: 4.5,                 // ← average_rating (parsed)
  RatingCount: 12,                    // ← rating_count
  CleaningTips: "جنس:کرپ حریر",       // ← short_description (if cleaning)
  ReturnConditions: "...",            // ← short_description (if not cleaning)
  product_main_category: 123,         // ← categories[0] (mapped)
  CoverImage: 456,                    // ← images[0] (uploaded)
  Media: [457, 458],                  // ← images[1+] (uploaded)
  external_id: "1004583",             // ← id (tracking)
  external_source: "woocommerce"      // (tracking)
}
```

### Field Details
- **Title**: Direct mapping from `name`
- **Description**: HTML cleaned from `description`
- **Status**: Mapped from `status` (`publish` → `Active`, others → `InActive`)
- **AverageRating**: Parsed float from `average_rating`
- **RatingCount**: Direct mapping from `rating_count`
- **CleaningTips/ReturnConditions**: Smart mapping from `short_description`
- **product_main_category**: First category mapped to Strapi ID
- **CoverImage**: First image uploaded to Strapi media
- **Media**: Additional images uploaded to Strapi media
- **external_id**: WooCommerce `id` as string
- **external_source**: Always `"woocommerce"`

### Image Processing
1. **Cover Image**: `images[0]` → Download → Upload to Strapi → Link to `CoverImage`
2. **Gallery Images**: `images[1+]` → Download → Upload to Strapi → Link to `Media`

---

## 🎨 Product Variation Fields

### WooCommerce Input
```json
{
  "id": 1004600,
  "sku": "ELISE-C00575-COFFEE",
  "price": "429000",
  "regular_price": "429000", 
  "status": "publish",
  "manage_stock": true,
  "stock_quantity": 28,
  "stock_status": "instock",
  "attributes": [
    {
      "id": 1,
      "name": "رنگ",
      "option": "نسکافه ای"
    }
  ],
  "_parentProduct": {
    "id": 1004583,
    "name": "تاپ الیزه C00575"
  }
}
```

### Strapi Output
```javascript
// Product Variation
{
  SKU: "ELISE-C00575-COFFEE",         // ← sku (or generated)
  Price: 4290000,                     // ← price (converted IRT→IRR)
  IsPublished: true,                  // ← status (mapped)
  product: 123,                       // ← _parentProduct.id (mapped)
  external_id: "1004600",             // ← id (tracking)
  external_source: "woocommerce"      // (tracking)
}

// Product Stock
{
  Count: 28,                          // ← stock_quantity
  product_variation: 456,             // ← variation ID
  external_id: "stock_1004600",       // (generated)
  external_source: "woocommerce"      // (tracking)
}

// Variation Color (if color attribute)
{
  Title: "نسکافه ای",                 // ← attributes[color].option
  Code: "#8B4513",                    // (generated from name)
  external_id: "color_نسکافه ای",     // (generated)
  external_source: "woocommerce"      // (tracking)
}
```

### Field Details
- **SKU**: Uses WooCommerce `sku` or generates unique one
- **Price**: Converted from IRT to IRR (×10)
- **IsPublished**: Mapped from `status` (`publish` → `true`)
- **product**: Parent product mapped to Strapi ID
- **Stock Count**: Direct mapping from `stock_quantity`
- **Attributes**: Creates color/size/model entities based on attribute names

### Price Conversion
```javascript
// WooCommerce: 429000 IRT
// Strapi: 4290000 IRR (multiply by 10)
```

---

## 🛒 Order Fields

### WooCommerce Input
```json
{
  "id": 1005829,
  "status": "processing",
  "date_created": "2025-07-26T04:06:11",
  "total": "718000",
  "shipping_total": "69000",
  "customer_id": 0,
  "customer_note": "لطفا زود ارسال کنید",
  "billing": {
    "first_name": "شیرین",
    "last_name": "نوری",
    "phone": "09138433429",
    "address_1": "کرمان_خیابان فیروزاباد...",
    "city": "کرمان",
    "postcode": "۷۶۱۵۷۳۴۹۷۶"
  },
  "line_items": [
    {
      "id": 1005830,
      "name": "تاپ الیزه C00575 - نسکافه ای",
      "product_id": 1004583,
      "variation_id": 1004600,
      "quantity": 1,
      "price": 649000,
      "sku": "ELISE-C00575-COFFEE"
    }
  ],
  "shipping_lines": [
    {
      "method_title": "پست پیشتاز",
      "total": "69000"
    }
  ]
}
```

### Strapi Output
```javascript
// Guest User (Local User)
{
  Phone: "09138433429",               // ← billing.phone
  IsActive: false,                    // (guest users inactive)
  IsVerified: false,                  // (guest users unverified)
  external_id: "guest_09138433429",   // (generated)
  external_source: "woocommerce_guest" // (tracking)
}

// Guest User Info
{
  FirstName: "شیرین",                 // ← billing.first_name
  LastName: "نوری",                   // ← billing.last_name
  user: 789                           // ← linked to local user
}

// Order
{
  Date: "2025-07-26T04:06:11.000Z",   // ← date_created (ISO)
  Status: "Started",                  // ← status (mapped)
  Type: "Automatic",                  // (default)
  ShippingCost: 690000,               // ← shipping_total (converted)
  Description: "لطفا زود ارسال کنید",  // ← customer_note
  Note: "WooCommerce Order #1005829", // (generated)
  user: 789,                          // ← linked to guest user
  external_id: "1005829",             // ← id (tracking)
  external_source: "woocommerce"      // (tracking)
}

// Order Item
{
  Count: 1,                           // ← line_items[].quantity
  PerAmount: 6490000,                 // ← line_items[].price (converted)
  ProductSKU: "ELISE-C00575-COFFEE",  // ← line_items[].sku
  ProductTitle: "تاپ الیزه C00575 - نسکافه ای", // ← line_items[].name
  product_variation: 456,             // ← line_items[].variation_id (mapped)
  order: 123,                         // ← linked to order
  external_id: "line_item_1005830",   // ← line_items[].id (tracking)
  external_source: "woocommerce"      // (tracking)
}

// Contract
{
  Amount: 7180000,                    // ← total (converted)
  Date: "2025-07-26T04:06:11.000Z",   // ← date_created (ISO)
  Type: "Cash",                       // (default)
  Status: "Confirmed",                // ← status (mapped)
  TaxPercent: 10,                     // (default)
  order: 123,                         // ← linked to order
  local_user: 789,                    // ← linked to guest user
  external_id: "contract_1005829",    // (generated)
  external_source: "woocommerce"      // (tracking)
}

// Contract Transaction
{
  Amount: 7180000,                    // ← total (converted)
  Type: "Gateway",                    // (default for online orders)
  Status: "Success",                  // ← status (mapped)
  Step: 1,                            // (default)
  Date: "2025-07-26T04:06:11.000Z",   // ← date_created (ISO)
  contract: 456,                      // ← linked to contract
  external_id: "transaction_1005829", // (generated)
  external_source: "woocommerce"      // (tracking)
}
```

### Field Details
- **Guest User Creation**: For `customer_id = 0`, creates guest user from billing
- **Order Status Mapping**: WooCommerce → Strapi status conversion
- **Price Conversion**: All amounts converted from IRT to IRR (×10)
- **Contract & Transaction**: Automatically created for payment tracking

---

## 🔄 Status Mappings

### Product Status
```javascript
{
  'publish': 'Active',
  'draft': 'InActive', 
  'private': 'InActive',
  'pending': 'InActive'
}
```

### Order Status
```javascript
{
  'pending': 'Paying',
  'processing': 'Started',
  'on-hold': 'Started', 
  'completed': 'Done',
  'cancelled': 'Cancelled',
  'refunded': 'Returned',
  'failed': 'Cancelled'
}
```

### Stock Status
```javascript
{
  'instock': true,     // IsPublished
  'outofstock': false,
  'onbackorder': true
}
```

---

## 💰 Currency Conversion

All monetary values are converted from Iranian Toman (IRT) to Iranian Rial (IRR):

```javascript
// Conversion formula
iraqi_rial = iranian_toman * 10

// Examples:
"429000" IRT → 4290000 IRR  (Product price)
"69000" IRT → 690000 IRR    (Shipping cost)
"718000" IRT → 7180000 IRR  (Order total)
```

---

## 🏷️ External Tracking Fields

All entities include tracking fields for duplicate prevention:

```javascript
{
  external_id: "original_woocommerce_id",    // WooCommerce ID as string
  external_source: "woocommerce"            // Source system identifier
}
```

Special cases:
- **Guest Users**: `external_source: "woocommerce_guest"`
- **Generated IDs**: `external_id: "generated_unique_id"` (contracts, stocks, etc.)

---

## 🔗 Relationship Mapping

### Category Hierarchy
- **Parent Categories**: Imported first
- **Child Categories**: Parent ID mapped to Strapi ID

### Product Relationships
- **Main Category**: First category becomes `product_main_category`
- **Additional Categories**: Stored for `product_other_categories` relation

### Variation Relationships
- **Product Link**: Parent product mapped to Strapi ID
- **Attributes**: Color/Size/Model entities created and linked
- **Stock**: Separate stock entity linked to variation

### Order Relationships
- **User**: Guest user created from billing information
- **Order Items**: Linked to variations and order
- **Contract**: Created for payment tracking
- **Transaction**: Created for payment processing

---

**Total Fields Imported**: 50+ fields across all entity types
**Relationships Created**: 15+ different relationship types
**Status**: ✅ Production Ready 