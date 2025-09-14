# 🚀 Getting started with Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

## 🐳 Using Docker

This project includes Docker setup for development and deployment.

### Development

To run using Docker for development:

```bash
# Start the services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove volumes (data will be lost)
docker-compose down -v
```

The application will be available at http://localhost:1337.

### Production

For production deployment:

```bash
# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Manual Setup

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

```
yarn strapi deploy
```

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## 📂 Data Files

The project includes JSON data files in the `database` directory that can be used for seeding or reference:

- `iran-cities.json` - Complete list of all Iranian provinces and their cities in Persian.

## 🛠️ Migrations

This project includes database migrations to set up necessary data. To run migrations:

```bash
# Run all pending migrations
npm run strapi migrate

# Create a new migration
npx strapi generate migration migration-name

# Run a specific migration up
npm run strapi migrate:run -- --name=migration-name.js
```

Note: Rollback/down migrations are not currently supported.

### Available Migrations

- `2025.03.24T06.00.20.shipping-province-data.js` - Adds all provinces of Iran in Persian to the shipping_provinces table.
- `2025.03.24T06.09.52.shipping-cities-data.js` - Adds all cities of Iran in Persian to the shipping_cities table with province relationships.

## 🔌 API Endpoints

### Product Favorites

The API provides endpoints to manage product favorites for authenticated users:

#### Toggle Product as Favorite

```
POST /api/product-likes/toggle
```

This endpoint toggles a product as favorite for the authenticated user.
If the product is already a favorite, it will be removed. If not, it will be added.

##### Request Body

```json
{
  "productId": 123
}
```

##### Headers

- `Authorization: Bearer YOUR_JWT_TOKEN`

##### Response Example (Adding to favorites)

```json
{
  "success": true,
  "message": "Product added to favorites",
  "isFavorite": true
}
```

##### Response Example (Removing from favorites)

```json
{
  "success": true,
  "message": "Product removed from favorites",
  "isFavorite": false
}
```

#### Get User's Favorite Products

```
GET /api/product-likes/user/me
```

This endpoint retrieves all products that the authenticated user has added to favorites, including complete product variation data.
The response is paginated.

##### Query Parameters

- `page` (optional): Page number for pagination (default: 1)
- `pageSize` (optional): Number of items per page (default: 25)

##### Headers

- `Authorization: Bearer YOUR_JWT_TOKEN`

##### Response Example

```json
{
  "data": [
    {
      "id": 1,
      "product": {
        "id": 123,
        "title": "Sample Product",
        "description": "Product description",
        "price": 99.99,
        "images": [...],
        "product_category": {...},
        "product_tags": [...],
        "product_variations": [
          {
            "id": 456,
            "Price": 99.99,
            "SKU": "SKU123",
            "product_color": {
              "id": 1,
              "Title": "Red"
            },
            "product_size": {
              "id": 2,
              "Title": "Large"
            },
            "product_variation_model": {
              "id": 3,
              "Title": "Model X"
            },
            "product_stock": {
              "id": 789,
              "Count": 50
            }
          }
        ]
      }
    },
    // More products...
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 2,
      "total": 28
    }
  }
}
```

### Product Reviews

The API provides endpoints to manage product reviews for authenticated users:

#### Submit a Product Review

```
POST /api/product-reviews/submit
```

This endpoint allows an authenticated user to submit a review for a product. Each user can only submit one review per product. If the user has already reviewed the product, the existing review will be updated instead of creating a new one.

##### Request Body

```json
{
  "productId": 123,
  "rate": 5,
  "content": "This product is amazing! I highly recommend it."
}
```

- `productId`: ID of the product being reviewed
- `rate`: Rating from 0 to 5
- `content`: Review text content

##### Headers

- `Authorization: Bearer YOUR_JWT_TOKEN`

##### Response Example (New Review)

```json
{
  "id": 42,
  "Rate": 5,
  "Content": "This product is amazing! I highly recommend it.",
  "Date": "2023-07-15T10:30:00.000Z",
  "Status": "Need for Review",
  "user": {
    "id": 5
  },
  "product": {
    "id": 123
  },
  "isNew": true
}
```

##### Response Example (Updated Review)

```json
{
  "id": 42,
  "Rate": 5,
  "Content": "Updated review content after trying the product longer.",
  "Date": "2023-07-15T10:30:00.000Z",
  "Status": "Need for Review",
  "user": {
    "id": 5
  },
  "product": {
    "id": 123
  },
  "isUpdated": true
}
```

#### Get Current User's Reviews

```
GET /api/product-reviews/user/me
```

This endpoint retrieves all reviews submitted by the authenticated user.
The response is paginated.

##### Headers

- `Authorization: Bearer YOUR_JWT_TOKEN`

##### Response Example

```json
{
  "data": [
    {
      "id": 42,
      "Rate": 5,
      "Content": "This product is amazing! I highly recommend it.",
      "Date": "2023-07-15T10:30:00.000Z",
      "Status": "Need for Review",
      "product": {
        "id": 123,
        "title": "Sample Product",
        "description": "Product description"
      }
    }
    // More reviews...
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 3
    }
  }
}
```

### User Addresses

The API provides endpoints to manage user addresses:

#### Get Current User's Addresses

```
GET /api/local-user-addresses/me
```

This endpoint retrieves all addresses for the authenticated user.
The response is paginated.

##### Headers

- `Authorization: Bearer YOUR_JWT_TOKEN`

##### Response Example

```json
{
  "data": [
    {
      "id": 15,
      "PostalCode": "1234567890",
      "Description": "Near the blue building",
      "FullAddress": "Example Street, No. 123",
      "createdAt": "2023-08-10T12:30:00.000Z",
      "shipping_city": {
        "id": 120,
        "Title": "Tehran",
        "Code": "021",
        "shipping_province": {
          "id": 8,
          "Title": "Tehran"
        }
      }
    },
    {
      "id": 16,
      "PostalCode": "9876543210",
      "Description": "Second floor",
      "FullAddress": "Another Street, No. 456",
      "createdAt": "2023-08-15T14:45:00.000Z",
      "shipping_city": {
        "id": 321,
        "Title": "Isfahan",
        "Code": "031",
        "shipping_province": {
          "id": 4,
          "Title": "Isfahan"
        }
      }
    }
    // More addresses...
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 2
    }
  }
}
```

#### Create New Address

```
POST /api/local-user-addresses/create
```

This endpoint creates a new address for the authenticated user with validation.

##### Request Body

```json
{
  "shipping_city": 120,
  "PostalCode": "1234567890",
  "FullAddress": "Example Street, No. 123",
  "Description": "Near the blue building"
}
```

- `shipping_city`: ID of the shipping city (required)
- `PostalCode`: 10-digit postal code (required)
- `FullAddress`: Complete address details (required)
- `Description`: Additional address information (optional)

##### Headers

- `Authorization: Bearer YOUR_JWT_TOKEN`

##### Response Example

```json
{
  "data": {
    "id": 17,
    "PostalCode": "1234567890",
    "Description": "Near the blue building",
    "FullAddress": "Example Street, No. 123",
    "createdAt": "2023-08-20T09:15:00.000Z",
    "updatedAt": "2023-08-20T09:15:00.000Z",
    "shipping_city": {
      "id": 120,
      "Title": "Tehran",
      "Code": "021",
      "shipping_province": {
        "id": 8,
        "Title": "Tehran"
      }
    },
    "user": 5
  }
}
```

##### Validation Rules

- `shipping_city` must be a valid shipping city ID in the database
- `PostalCode` must be a 10-digit number
- `FullAddress` is required and cannot be empty

### Shipping Methods

The API provides endpoints to retrieve shipping method options:

#### Get Available Shipping Methods

```
GET /api/shippings
```

This endpoint retrieves all available shipping methods.

##### Query Parameters

- `filters[IsActive][$eq]` (optional): Filter by active status (true/false)
- `pagination[page]` (optional): Page number for pagination (default: 1)
- `pagination[pageSize]` (optional): Number of items per page (default: 25)
- `sort` (optional): Sort field and direction (e.g., `sort=Price:asc`)

##### Response Example

```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "Title": "Standard Shipping",
        "Price": 10000,
        "IsActive": true,
        "createdAt": "2023-08-01T12:00:00.000Z",
        "updatedAt": "2023-08-01T12:00:00.000Z"
      }
    },
    {
      "id": 2,
      "attributes": {
        "Title": "Express Shipping",
        "Price": 25000,
        "IsActive": true,
        "createdAt": "2023-08-01T12:00:00.000Z",
        "updatedAt": "2023-08-01T12:00:00.000Z"
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 2
    }
  }
}
```

#### Get Provinces

```
GET /api/shipping-provinces
```

This endpoint retrieves all available provinces for shipping addresses.

##### Query Parameters

- `pagination[page]` (optional): Page number for pagination (default: 1)
- `pagination[pageSize]` (optional): Number of items per page (default: 25)
- `sort` (optional): Sort field and direction (e.g., `sort=Title:asc`)

##### Response Example

```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "Title": "Tehran",
        "createdAt": "2023-08-01T12:00:00.000Z",
        "updatedAt": "2023-08-01T12:00:00.000Z"
      }
    },
    {
      "id": 2,
      "attributes": {
        "Title": "Isfahan",
        "createdAt": "2023-08-01T12:00:00.000Z",
        "updatedAt": "2023-08-01T12:00:00.000Z"
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 2
    }
  }
}
```

#### Get Cities

```
GET /api/shipping-cities
```

This endpoint retrieves all available cities for shipping addresses.

##### Query Parameters

- `filters[shipping_province][id][$eq]` (optional): Filter cities by province ID
- `pagination[page]` (optional): Page number for pagination (default: 1)
- `pagination[pageSize]` (optional): Number of items per page (default: 25)
- `sort` (optional): Sort field and direction (e.g., `sort=Title:asc`)
- `populate` (optional): Relations to populate (e.g., `populate=shipping_province`)

##### Response Example

```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "Title": "Tehran",
        "Code": "021",
        "createdAt": "2023-08-01T12:00:00.000Z",
        "updatedAt": "2023-08-01T12:00:00.000Z",
        "shipping_province": {
          "data": {
            "id": 1,
            "attributes": {
              "Title": "Tehran"
            }
          }
        }
      }
    },
    {
      "id": 2,
      "attributes": {
        "Title": "Isfahan",
        "Code": "031",
        "createdAt": "2023-08-01T12:00:00.000Z",
        "updatedAt": "2023-08-01T12:00:00.000Z",
        "shipping_province": {
          "data": {
            "id": 2,
            "attributes": {
              "Title": "Isfahan"
            }
          }
        }
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 2
    }
  }
}
```

### Shopping Cart

The API provides endpoints to manage shopping carts for authenticated users:

#### Add Item to Cart

```
POST /api/carts/add-item
```

This endpoint adds a product variation to the user's cart.

##### Request Body

```json
{
  "productVariationId": 123,
  "count": 2
}
```

- `productVariationId`: ID of the product variation to add
- `count`: Quantity to add (default: 1)

##### Headers

- `Authorization: Bearer YOUR_JWT_TOKEN`

##### Response Example

```json
{
  "data": {
    "id": 42,
    "Count": 2,
    "Sum": 199.98,
    "cart": 5,
    "product_variation": 123
  }
}
```

#### Update Cart Item

```
PUT /api/carts/update-item
```

This endpoint updates the quantity of a product variation in the cart.

##### Request Body

```json
{
  "cartItemId": 42,
  "count": 3
}
```

- `cartItemId`: ID of the cart item to update
- `count`: New quantity

##### Headers

- `Authorization: Bearer YOUR_JWT_TOKEN`

##### Response Example

```json
{
  "data": {
    "id": 42,
    "Count": 3,
    "Sum": 299.97,
    "cart": 5,
    "product_variation": 123
  }
}
```

#### Remove Item from Cart

```
DELETE /api/carts/remove-item/:id
```

This endpoint removes an item from the cart.

##### Route Parameters

- `id`: ID of the cart item to remove

##### Headers

- `Authorization: Bearer YOUR_JWT_TOKEN`

##### Response Example

```json
{
  "data": {
    "message": "Cart item removed successfully"
  }
}
```

#### Check Cart Stock

```
GET /api/carts/check-stock
```

This endpoint checks if all items in the cart have sufficient stock. If stock issues are found:

- Items with zero stock will be automatically removed from the cart
- Items with insufficient stock will have their quantities adjusted to match available stock

##### Headers

- `Authorization: Bearer YOUR_JWT_TOKEN`

##### Response Example (Valid Stock)

```json
{
  "data": {
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
}
```

##### Response Example (Stock Issues)

```json
{
  "data": {
    "success": false,
    "message": "Stock issues prevent order creation",
    "itemsRemoved": [...],
    "itemsAdjusted": [...],
    "cart": {...}
  }
}
```

#### Finalize Cart to Order

```
POST /api/carts/finalize
```

This endpoint converts the cart into an order after checking stock availability. It will automatically adjust or remove items based on stock availability before creating the order. A contract is also created for each order to manage payment and financial aspects.

The system automatically performs the following financial calculations:

- Calculates subtotal from all items in the cart
- Checks for applicable discounts based on active general discounts
- Calculates tax based on the configured tax percentage (default 10%)
- Adds shipping cost to the total
- Creates a contract with all financial details

##### Request Body

```json
{
  "shipping": 2,
  "shippingCost": 10000,
  "description": "Please deliver after 6pm",
  "note": "Gift wrapping requested",
  "callbackURL": "/orders/payment-callback"
}
```

- `shipping`: ID of the shipping method
- `shippingCost` (optional): Cost of shipping
- `description` (optional): Additional description for the order
- `note` (optional): Additional note for the order
- `callbackURL` (optional): URL for payment gateway callback

##### Response Example (Success)

```json
{
  "data": {
    "success": true,
    "message": "Order created successfully. Redirecting to payment gateway.",
    "orderId": 42,
    "contractId": 24,
    "redirectUrl": "https://payment-gateway.example.com/pay/12345",
    "financialSummary": {
      "subtotal": 199980,
      "discount": 20000,
      "tax": 17998,
      "shipping": 10000,
      "total": 207978
    }
  }
}
```

##### Response Example (Failure)

```json
{
  "data": {
    "success": false,
    "message": "Stock issues prevent order creation",
    "itemsRemoved": [...],
    "itemsAdjusted": [...],
    "cart": {...}
  }
}
```

#### Contract Creation

When an order is finalized, a contract is automatically created with the following attributes:

- `local_user`: The user who placed the order
- `Type`: "Cash" (default) or "Credit"
- `Status`: Initially set to "Not Ready"
- `Amount`: Total order amount (including items, discounts, tax, and shipping)
- `SubtotalAmount`: Sum of all items before discounts and tax
- `DiscountAmount`: Applied discount amount
- `TaxAmount`: Calculated tax amount
- `ShippingAmount`: Shipping cost
- `TaxPercent`: Tax percentage (10% by default)
- `Date`: Current date and time
- `order`: Reference to the associated order

The contract status is updated along with the order status during the payment process:

- When payment fails, both order and contract status are set to "Cancelled"
- When payment succeeds, contract status is updated to "Confirmed"

### User Wallet

The API provides endpoints for users to manage and view their wallet.

#### Get Current User's Wallet

```
GET /api/local-user-wallet/me
```

This endpoint retrieves the wallet information for the authenticated user.

##### Headers

- `Authorization: Bearer YOUR_JWT_TOKEN`

##### Response Example

```json
{
  "success": true,
  "data": {
    "id": 42,
    "balance": "50000",
    "lastTransactionDate": "2023-09-10T15:30:00.000Z",
    "description": "Account wallet"
  }
}
```

### Payment Gateway Integration

The API includes integration with the Beh Pardakht Mellat payment gateway using modern REST API for processing online payments.

#### Payment Flow

1. When an order is finalized using the `/api/carts/finalize` endpoint, the system automatically initiates a payment request to the Beh Pardakht Mellat gateway using REST API.
2. The response includes a `redirectUrl` that the client should redirect the user to for completing the payment.
3. After payment is complete or cancelled, the gateway redirects back to the configured callback URL with the transaction details via POST request.
4. The system then verifies and settles the payment using REST API calls, updating the order status accordingly.

#### Finalize Cart to Order with Payment

```
POST /api/carts/finalize
```

This endpoint converts the cart into an order after checking stock availability and initiates a payment request to the configured payment gateway.

##### Request Body

```json
{
  "shipping": 2,
  "shippingCost": 10000,
  "description": "Please deliver after 6pm",
  "note": "Gift wrapping requested",
  "callbackURL": "/orders/payment-callback"
}
```

- `shipping`: ID of the shipping method
- `shippingCost` (optional): Cost of shipping
- `description` (optional): Additional description for the order
- `note` (optional): Note for the order
- `callbackURL` (optional): Custom callback URL for the payment gateway

##### Headers

- `Authorization: Bearer YOUR_JWT_TOKEN`

##### Response Example (Success)

```json
{
  "data": {
    "success": true,
    "message": "Order created successfully. Redirecting to payment gateway.",
    "orderId": 123,
    "contractId": 24,
    "redirectUrl": "https://bpm.shaparak.ir/pgwchannel/startpay.mellat?RefId=12345abcde",
    "refId": "12345abcde",
    "financialSummary": {
      "subtotal": 199980,
      "discount": 20000,
      "tax": 17998,
      "shipping": 10000,
      "total": 207978
    }
  }
}
```

##### Response Example (Payment Gateway Error)

```json
{
  "data": {
    "success": false,
    "error": "Payment gateway not configured or not active"
  }
}
```

#### Payment Verification Callback

```
POST /api/orders/payment-callback
```

This endpoint is called by the payment gateway after payment processing is complete.

##### POST Parameters (Automatically provided by the gateway)

- `ResCode`: The result code (0 for success)
- `SaleOrderId`: The order ID
- `SaleReferenceId`: The transaction reference ID
- `RefId`: The reference ID from payment request
- `OrderId`: The order ID

##### Response

The endpoint will redirect to:

- Success page: `/payment/success?orderId=[orderId]` if payment is successful
- Failure page: `/payment/failure?error=[errorMessage]` if payment fails

#### Check Order Payment Status

```
GET /api/orders/:id/payment-status
```

This endpoint allows the frontend to check an order's payment status.

##### Path Parameters

- `id`: The ID of the order to check

##### Headers

- `Authorization: Bearer YOUR_JWT_TOKEN`

##### Response Example (Success)

```json
{
  "data": {
    "success": true,
    "orderId": 123,
    "status": "Started",
    "isPaid": true
  }
}
```

The `isPaid` field will be `true` if the order status is one of: "Started", "Shipment", or "Done".

##### Response Example (Error)

```json
{
  "data": {
    "success": false,
    "error": "You do not have permission to access this order"
  }
}
```

### Product Search API

The API provides an endpoint to search for products:

#### Search Products

```
GET /api/products/search
```

This endpoint allows searching for products using a query string. The search matches against product name, description, short description, tags, and category.

##### Query Parameters

- `q` (required): Search query string
- `page` (optional): Page number for pagination (default: 1)
- `pageSize` (optional): Number of items per page (default: 10)

##### Response Example

```json
{
  "data": [
    {
      "id": 1,
      "name": "Sample Product",
      "description": "This is a sample product description",
      "short_description": "Sample product",
      "price": 99.99,
      "product_main_category": {
        "id": 2,
        "name": "Electronics"
      },
      "product_tags": [
        {
          "id": 1,
          "name": "Featured"
        }
      ],
      "product_variations": [
        {
          "id": 1,
          "Price": 99.99,
          "product_variation_color": {
            "id": 1,
            "title": "Black"
          },
          "product_variation_size": {
            "id": 2,
            "title": "Medium"
          },
          "product_variation_model": {
            "id": 1,
            "title": "Standard"
          },
          "product_stock": {
            "id": 1,
            "Count": 25
          }
        }
      ],
      "CoverImage": {
        "url": "/uploads/cover_image_123.jpg"
      }
    }
    // More products...
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "pageCount": 3,
      "total": 28
    }
  }
}
```

##### Error Response Example

```json
{
  "error": "Search query (q) is required"
}
```

The search functionality performs the following:

1. Searches product name, description, and short description for the query string
2. Searches related product tags for the query string
3. Searches product categories for the query string
4. Returns results sorted by creation date (newest first)
5. Includes product variations, colors, sizes, models, and stock information in the response

## 2025-09-14 02:04 UTC

- fix(gateway-snappay): normalize mobile to 98XXXXXXXXXX; stronger transactionId
- fix(order): decrement stock only after settlement; add transactional TODO
- refactor(cart): split ops/libs; avoid cart clear at gateway-init
- docs: add Cursor rules and bug report artifact

## 2025-09-14 07:00 UTC

- fix(snappay): preserve E.164 `+98XXXXXXXXXX` mobile across helper/service; add guard to abort on unsuccessful eligibility; wrap token request with try/catch and cancel order/contract on hard errors
- chore(logging): add SnappPay callback identifiers and verify/settle result logs in `src/api/order/controllers/order.ts`; add eligibility request/result logs in `src/api/payment-gateway/controllers/payment-gateway.ts`
- policy: no changes — cart cleared only after successful gateway init; stock decremented only after settlement (see Cursor rules)
