# Cart API Documentation

This guide documents the custom cart APIs for the Infinity Backend project. All APIs require authentication.

## Base URL

```
https://your-api-domain.com/api
```

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Endpoints

### 1. Get User's Cart

Retrieves the authenticated user's cart with its items.

**Endpoint:** `GET /carts/me`

**Success Response (200 OK):**

```json
{
  "id": 5,
  "Status": "Pending",
  "cart_items": [
    {
      "id": 42,
      "Count": 2,
      "Sum": 199.98,
      "product_variation": {
        "id": 123,
        "Price": 99.99,
        "product_stock": {
          "Count": 10
        },
        "product_variation_color": {
          "id": 5,
          "Title": "Blue"
        },
        "product_variation_size": {
          "id": 3,
          "Title": "M"
        },
        "product_variation_model": {
          "id": 2,
          "Title": "Standard"
        },
        "product": {
          "Title": "Sample Product",
          "SKU": "PROD-123"
        }
      }
    }
  ]
}
```

**Success Response (200 OK) - Empty Cart:**

```json
{
  "id": 5,
  "Status": "Empty",
  "cart_items": []
}
```

### 2. Add Item to Cart

Adds a product variation to the user's cart.

**Endpoint:** `POST /carts/add-item`

**Request Body:**

```json
{
  "productVariationId": 123,
  "count": 2
}
```

**Success Response (200 OK):**

```json
{
  "id": 42,
  "Count": 2,
  "Sum": 199.98,
  "cart": 5,
  "product_variation": 123
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "Product variation ID is required"
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "Insufficient stock"
}
```

### 3. Update Cart Item

Updates the quantity of an item in the cart.

**Endpoint:** `PUT /carts/update-item`

**Request Body:**

```json
{
  "cartItemId": 42,
  "count": 3
}
```

**Success Response (200 OK):**

```json
{
  "id": 42,
  "Count": 3,
  "Sum": 299.97,
  "cart": 5,
  "product_variation": 123
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "Cart item ID is required"
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "Insufficient stock"
}
```

**Error Response (403 Forbidden):**

```json
{
  "error": "You do not have permission to update this cart item"
}
```

### 4. Remove Item from Cart

Removes an item from the cart.

**Endpoint:** `DELETE /carts/remove-item/:id`

**URL Parameters:**

- `id`: The ID of the cart item to remove

**Success Response (200 OK):**

```json
{
  "message": "Cart item removed successfully"
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "Cart item ID is required"
}
```

**Error Response (403 Forbidden):**

```json
{
  "error": "You do not have permission to remove this cart item"
}
```

### 5. Check Cart Stock

Checks if all items in the cart have sufficient stock. Automatically adjusts quantities or removes items when stock issues are detected.

**Endpoint:** `GET /carts/check-stock`

**Success Response (200 OK) - No Issues:**

```json
{
  "success": true,
  "valid": true,
  "cart": {
    "id": 5,
    "Status": "Pending",
    "cart_items": [
      {
        "id": 42,
        "Count": 2,
        "Sum": 199.98,
        "product_variation": {
          "id": 123,
          "Price": 99.99,
          "product_stock": {
            "Count": 10
          }
        }
      }
    ]
  }
}
```

**Success Response (200 OK) - Items Adjusted:**

```json
{
  "success": true,
  "valid": false,
  "cartIsEmpty": false,
  "itemsAdjusted": [
    {
      "cartItemId": 42,
      "productVariationId": 123,
      "requested": 5,
      "available": 3,
      "newQuantity": 3,
      "message": "Quantity reduced from 5 to 3 due to limited stock"
    }
  ],
  "cart": {
    "id": 5,
    "Status": "Pending",
    "cart_items": [
      {
        "id": 42,
        "Count": 3,
        "Sum": 299.97,
        "product_variation": {
          "id": 123,
          "Price": 99.99,
          "product_stock": {
            "Count": 3
          }
        }
      }
    ]
  }
}
```

**Success Response (200 OK) - Items Removed:**

```json
{
  "success": true,
  "valid": false,
  "cartIsEmpty": false,
  "itemsRemoved": [
    {
      "cartItemId": 42,
      "productVariationId": 123,
      "requested": 5,
      "available": 0,
      "message": "Product is out of stock, item removed from cart"
    }
  ],
  "cart": {
    "id": 5,
    "Status": "Pending",
    "cart_items": [
      {
        "id": 43,
        "Count": 1,
        "Sum": 49.99,
        "product_variation": {
          "id": 124,
          "Price": 49.99,
          "product_stock": {
            "Count": 8
          }
        }
      }
    ]
  }
}
```

**Success Response (200 OK) - Empty Cart:**

```json
{
  "success": true,
  "valid": true,
  "message": "Cart is empty"
}
```

### 6. Finalize Cart to Order

Converts the cart into an order after checking stock availability. Automatically adjusts or removes items based on stock.

**Endpoint:** `POST /carts/finalize`

**Request Body:**

```json
{
  "shipping": 2,
  "shippingCost": 10000,
  "description": "Please deliver after 6pm",
  "note": "Gift wrapping requested"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Order created successfully",
  "orderId": 123
}
```

**Error Response (400 Bad Request) - Empty Cart:**

```json
{
  "error": "Cannot create order from empty cart"
}
```

**Error Response (400 Bad Request) - Stock Issues:**

```json
{
  "error": "Stock issues prevent order creation",
  "itemsRemoved": [
    {
      "cartItemId": 42,
      "productVariationId": 123,
      "requested": 5,
      "available": 0,
      "message": "Product is out of stock, item removed from cart"
    }
  ],
  "itemsAdjusted": [
    {
      "cartItemId": 43,
      "productVariationId": 124,
      "requested": 5,
      "available": 3,
      "newQuantity": 3,
      "message": "Quantity reduced from 5 to 3 due to limited stock"
    }
  ],
  "cart": {
    "id": 5,
    "Status": "Pending",
    "cart_items": [
      {
        "id": 43,
        "Count": 3,
        "Sum": 149.97,
        "product_variation": {
          "id": 124,
          "Price": 49.99,
          "product_stock": {
            "Count": 3
          }
        }
      }
    ]
  }
}
```

**Error Response (400 Bad Request) - Missing Shipping:**

```json
{
  "error": "Shipping information is required"
}
```

## Cart Status Values

The cart can have the following status values:

- `Empty`: No items in the cart
- `Pending`: Items in the cart, order not yet finalized
- `Payment`: Cart is in payment process
- `Left`: Cart was abandoned

## Key Implementation Notes

1. **Stock Management**:

   - The system automatically checks stock availability before adding/updating items
   - When stock is insufficient, quantities are automatically adjusted down to match available stock
   - Items with zero stock are automatically removed from the cart

2. **Transaction Safety**:

   - When finalizing to an order, a database transaction ensures all operations succeed or fail together
   - Stock is updated and stock logs are created only when the order is successfully created

3. **Empty Cart Handling**:
   - After an order is created, the cart status is set to "Empty" and all items are removed
   - This prepares the cart for future use
