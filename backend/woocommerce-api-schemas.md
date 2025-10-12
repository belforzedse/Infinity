# WooCommerce API Schemas for Import

## Overview
This document contains the WooCommerce REST API schemas fetched from `https://infinitycolor.co/` for importing products, variations, categories, and orders into our Strapi-based e-commerce system.

**API Credentials Used:**
- Consumer Key: `WOOCOMMERCE_CONSUMER_KEY`
- Consumer Secret: `WOOCOMMERCE_CONSUMER_SECRET`
- Base URL: `https://infinitycolor.co/wp-json/wc/v3/`

---

## 🛍️ Product Schema (Variable Product)

**Endpoint:** `/products?per_page=1`

### Key Fields for Import:
```json
{
  "id": 1004583,
  "name": "تاپ الیزه C00575",
  "slug": "elise-top-c00575",
  "permalink": "https://infinitycolor.co/product/elise-top-c00575/",
  "date_created": "2025-07-25T13:35:29",
  "date_modified": "2025-07-25T17:51:41",
  "type": "variable",
  "status": "publish",
  "featured": false,
  "catalog_visibility": "visible",
  "description": "",
  "short_description": "<p><strong>جنس</strong>:کرپ حریر</p>...",
  "sku": "",
  "price": "429000",
  "regular_price": "",
  "sale_price": "",
  "on_sale": false,
  "purchasable": true,
  "total_sales": 1,
  "virtual": false,
  "downloadable": false,
  "manage_stock": false,
  "stock_quantity": null,
  "weight": "",
  "dimensions": {
    "length": "",
    "width": "",
    "height": ""
  },
  "shipping_required": true,
  "categories": [
    {
      "id": 15,
      "name": "تاپ",
      "slug": "top"
    }
  ],
  "tags": [],
  "images": [
    {
      "id": 1004585,
      "date_created": "2025-07-25T17:07:22",
      "src": "https://infinitycolor.co/wp-content/uploads/2024/07/IMG_20240301_124656_946.jpg",
      "name": "IMG_20240301_124656_946",
      "alt": ""
    }
  ],
  "attributes": [
    {
      "id": 1,
      "name": "رنگ",
      "position": 0,
      "visible": true,
      "variation": true,
      "options": [
        "نسکافه ای"
      ]
    }
  ],
  "default_attributes": [],
  "variations": [1004600],
  "grouped_products": [],
  "menu_order": 0,
  "price_html": "<span class=\"woocommerce-Price-amount amount\"><bdi>429,000&nbsp;<span class=\"woocommerce-Price-currencySymbol\">&#65020;</span></bdi></span>",
  "related_ids": [1000884, 1000888, 1000892, 1000902],
  "meta_data": []
}
```
e
### Mapping to Our Schema:
- `id` → External reference for duplicate checking
- `name` → `products.title`
- `slug` → Can be used for URL generation
- `description` → `products.description`
- `short_description` → Additional field or part of description
- `status` → Map to `products.status` ("publish" → "Active")
- `sku` → `product_variations.sku` (if available)
- `categories` → `product_categories` relationship
- `images` → Media attachments
- `attributes` → Variation definitions
- `variations` → Array of variation IDs to fetch

---

## 🎨 Product Variations Schema

**Endpoint:** `/products/{product_id}/variations?per_page=1`

### Key Fields for Import:
```json
{
  "id": 1004600,
  "type": "variation",
  "date_created": "2025-07-24T16:44:05",
  "date_modified": "2025-07-24T16:56:01",
  "description": "",
  "permalink": "https://infinitycolor.co/product/elise-top-c00575/?attribute_pa_color=...",
  "sku": "",
  "global_unique_id": "",
  "price": "429000",
  "regular_price": "429000",
  "sale_price": "",
  "on_sale": false,
  "status": "publish",
  "purchasable": true,
  "manage_stock": true,
  "stock_quantity": 28,
  "stock_status": "instock",
  "weight": "",
  "dimensions": {
    "length": "",
    "width": "",
    "height": ""
  },
  "image": {
    "id": 1004604,
    "src": "https://infinitycolor.co/wp-content/uploads/2024/07/IMG_20240301_124656_946.jpg",
    "name": "IMG_20240301_124656_946",
    "alt": ""
  },
  "attributes": [
    {
      "id": 1,
      "name": "رنگ",
      "option": "نسکافه ای"
    }
  ],
  "menu_order": 0,
  "meta_data": []
}
```

### Mapping to Our Schema:
- `id` → External reference for duplicate checking
- `sku` → `product_variations.sku`
- `price` → `product_variations.price`
- `regular_price` → Base price
- `sale_price` → Discount price calculation
- `stock_quantity` → `product_stocks.count`
- `stock_status` → Stock availability
- `attributes` → Map to color/size/model variations
- `image` → Specific variation image

---

## 📁 Category Schema

**Endpoint:** `/products/categories?per_page=1`

### Key Fields for Import:
```json
{
  "id": 2160,
  "name": "بارانی",
  "slug": "baroni",
  "parent": 0,
  "description": "<h1>خرید بارانی زنانه و دخترانه</h1>...",
  "display": "default",
  "image": null,
  "menu_order": 0,
  "count": 41
}
```

### Mapping to Our Schema:
- `id` → External reference for duplicate checking
- `name` → `product_categories.title`
- `slug` → `product_categories.slug`
- `parent` → `product_categories.parent_id` (0 = root category)
- `description` → `product_category_contents.paragraph`
- `image` → Category image attachment

---

## 📦 Order Schema

**Endpoint:** `/orders?per_page=1`

### Key Fields for Import:
```json
{
  "id": 1005829,
  "parent_id": 0,
  "status": "processing",
  "currency": "IRT",
  "date_created": "2025-07-26T04:06:11",
  "date_modified": "2025-07-26T04:08:01",
  "discount_total": "0",
  "discount_tax": "0",
  "shipping_total": "69000",
  "shipping_tax": "0",
  "cart_tax": "0",
  "total": "718000",
  "total_tax": "0",
  "customer_id": 0,
  "order_key": "wc_order_WbO2U4zSgVSJ6",
  "billing": {
    "first_name": "شیرین",
    "last_name": "نوری مازندرانی",
    "company": "",
    "address_1": "کرمان_خیابان فیروزاباد_کوچه ۴_پلاک ۱۵۵",
    "address_2": "",
    "city": "کرمان",
    "state": "KRN",
    "postcode": "۷۶۱۵۷۳۴۹۷۶",
    "country": "IR",
    "email": "",
    "phone": "09138433429"
  },
  "shipping": {
    "first_name": "شیرین",
    "last_name": "نوری مازندرانی",
    "address_1": "کرمان_خیابان فیروزاباد_کوچه ۴_پلاک ۱۵۵",
    "city": "کرمان",
    "state": "KRN",
    "postcode": "۷۶۱۵۷۳۴۹۷۶",
    "country": "IR"
  },
  "payment_method": "WC_Gateway_SnappPay",
  "payment_method_title": "پرداخت اقساطیِ اسنپ پی",
  "line_items": [
    {
      "id": 1005830,
      "name": "تاپ الیزه C00575 - نسکافه ای",
      "product_id": 1004583,
      "variation_id": 1004600,
      "quantity": 1,
      "tax_class": "",
      "subtotal": "649000",
      "subtotal_tax": "0",
      "total": "649000",
      "total_tax": "0",
      "taxes": [],
      "meta_data": [
        {
          "id": 8252584,
          "key": "رنگ",
          "value": "نسکافه ای"
        }
      ],
      "sku": "",
      "price": 649000,
      "image": {
        "id": "1004604",
        "src": "https://infinitycolor.co/wp-content/uploads/2024/07/IMG_20240301_124656_946-300x300.jpg"
      }
    }
  ],
  "shipping_lines": [
    {
      "id": 1005831,
      "method_title": "پست پیشتاز",
      "method_id": "flat_rate:1",
      "instance_id": "1",
      "total": "69000",
      "total_tax": "0",
      "taxes": []
    }
  ]
}
```

### Mapping to Our Schema:
- `id` → External reference for duplicate checking
- `status` → `orders.status` (needs status mapping)
- `date_created` → `orders.date`
- `total` → `contracts.amount`
- `customer_id` → Link to user (need to handle guest orders)
- `billing` → Customer address information
- `shipping` → Shipping address
- `line_items` → `order_items` with product references
- `shipping_lines` → Shipping cost information

---

## 🔄 Import Strategy

### 1. **Duplicate Prevention**
- Use WooCommerce `id` as external reference
- Store mapping in meta_data or separate tracking table
- Check existence before import

### 2. **Import Order**
1. **Categories** (hierarchical - import parents first)
2. **Products** (create base products)
3. **Variations** (create SKUs and stock)
4. **Orders** (create orders with references)

### 3. **Data Transformation**
- **Status Mapping**: WooCommerce statuses → Our system statuses
- **Currency**: IRT (Iranian Toman) → Convert to our currency format
- **Attributes**: Map WooCommerce attributes to our color/size/model system
- **Stock**: Map WooCommerce stock to our inventory system

### 4. **Error Handling**
- Log failed imports for retry
- Handle missing references gracefully
- Validate data before saving

---

## 📊 Status Mappings

### Product Status:
- `publish` → `Active`
- `draft` → `InActive`
- `private` → `InActive`

### Order Status:
- `pending` → `Paying`
- `processing` → `Started`
- `on-hold` → `Started`
- `completed` → `Done`
- `cancelled` → `Cancelled`
- `refunded` → `Returned`
- `failed` → `Cancelled`

### Stock Status:
- `instock` → Available
- `outofstock` → Out of stock
- `onbackorder` → Backorder

---

## 🔧 Implementation Notes

1. **Pagination**: Use `per_page` and `page` parameters for large datasets
2. **Rate Limiting**: Implement delays between API calls
3. **Authentication**: Use provided consumer key/secret
4. **Error Handling**: Handle API failures and invalid data
5. **Progress Tracking**: Log import progress for monitoring
6. **Rollback**: Ability to undo imports if needed

---

## 📁 Schema Files Created

- `woocommerce-product-schema.json` - Complete product example
- `woocommerce-variation-schema.json` - Product variation example  
- `woocommerce-category-schema.json` - Category example
- `woocommerce-order-schema.json` - Order example

These files contain the full API responses and can be used as reference during development. 