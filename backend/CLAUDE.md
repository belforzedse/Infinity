# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overviewe

This is **Infinity Backend**, an e-commerce backend built on **Strapi 4.25.21** (a headless CMS framework). The system handles products, shopping carts, orders, payments, user management, and more. It uses PostgreSQL for persistence and Redis for caching/sessions.

## Development Commandsshaq

### Starting the Server
```bash
npm run develop          # Development mode with auto-reload
npm run start            # Production start
npm run start:prod       # Production start with NODE_ENV=production
```

### Building
```bash
npm run build            # Build for development
npm run build:prod       # Build for production with NODE_ENV=production
```

### TypeScript
```bash
npm run type:generate    # Generate TypeScript types from Strapi schemas
```

### Utility Scripts
```bash
npm run import:products         # Import products from external source
npm run dry-run                 # Dry-run product import
npm run add:variations          # Add product variations
npm run retry:images            # Retry failed image uploads
npm run test:api                # Test API connection
npm run debug:mellat            # Debug Mellat payment gateway
npm run test:mellat-v3          # Test Mellat v3 integration
npm run test:callback-url       # Test payment callback URL
```

## Architecture

### Technology Stack
- **Framework**: Strapi 4.25.21 (Node.js CMS)
- **Database**: PostgreSQL (primary), supports MySQL/SQLite
- **Cache/Session**: Redis
- **Language**: TypeScript
- **Payment Gateways**: Mellat Bank (v2, v3), SnappPay
- **Authentication**: JWT-based custom auth (not using Strapi's default users-permissions)

### Directory Structure

```
src/
├── api/                    # API endpoints (50+ content types)
│   ├── auth/              # Custom authentication
│   ├── cart/              # Shopping cart logic
│   ├── order/             # Order management
│   ├── payment-gateway/   # Payment integrations (Mellat, SnappPay)
│   ├── product*/          # Product, variations, categories, reviews, likes
│   ├── local-user*/       # Custom user system (users, addresses, wallets, roles)
│   ├── shipping*/         # Shipping methods, cities, provinces
│   ├── discount/          # Discount codes
│   └── contract*/         # Financial contracts and transactions
├── middlewares/           # Custom middlewares
│   └── authentication.ts  # JWT validation middleware
├── components/            # Reusable Strapi components
├── extensions/            # Strapi plugin extensions
├── admin/                 # Strapi admin panel customizations
└── index.ts              # Bootstrap file (Redis, lifecycles, documentation overrides)

config/
├── database.ts           # Multi-database configuration
├── plugins.ts            # REST cache configuration
├── server.ts             # Server settings
├── middlewares.ts        # Middleware stack
├── admin.ts              # Admin panel config
└── api.ts                # API settings

scripts/                  # Standalone utility scripts
```

### Key Architectural Patterns

#### 1. Controller-Handler Pattern
Controllers delegate to handler functions in `controllers/handlers/` subdirectories:
```
src/api/cart/controllers/
├── cart.ts                    # Slim controller (delegates)
└── handlers/
    ├── addItem.ts             # Handler for adding cart items
    ├── finalizeToOrder.ts     # Handler for checkout flow
    └── gateway-helpers.ts     # Payment gateway abstraction
```

#### 2. Custom Authentication
The system uses a **custom JWT auth** system (`api::local-user.local-user`) instead of Strapi's built-in `users-permissions` plugin:
- JWT tokens are validated in `src/middlewares/authentication.ts`
- User object is attached to `ctx.state.user`
- Auth routes are in `src/api/auth/`

#### 3. Lifecycle Hooks
Strapi lifecycles are used for automatic side effects:
- `src/api/product/lifecycles.ts`: Auto-creates `product-size-helper` on product creation
- `src/api/product-variation/lifecycles.ts`: Manages variation-related logic
- Registered in `src/index.ts` via `strapi.db.lifecycles.subscribe()`

#### 4. Payment Gateway Abstraction
Multiple payment gateways are supported:
- **Mellat Bank**: `mellat.ts`, `mellat-v2.ts`, `mellat-v3.ts`
- **SnappPay**: `snappay.ts`, `snappay-category-mapper.ts`
- **Wallet**: In-app wallet payment (instant settlement)
- Gateway selection happens in `finalizeToOrder` handler

#### 5. Financial Flow
```
Cart → (finalizeToOrder) → Order + Contract → Payment Gateway → Callback → Stock Decrement
```
- **Contract**: Represents financial agreement (amount, discount, shipping cost)
- **Order**: Contains order items (product variations, quantities)
- **Stock decrement**: Happens on successful payment callback (or immediately for wallet)
- **Order-log**: Audit trail for all order state changes

#### 6. Redis Integration
Redis client is initialized in `src/index.ts`:
```typescript
export const RedisClient = createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD,
})
```
Used for caching and session management.

#### 7. REST Cache Strategy
Configured in `config/plugins.ts` with memory provider. All 50+ content types are cached with 24-hour TTL.

## Important Implementation Details

### User Management
- **local-user**: Main user entity
- **local-user-info**: Extended user profile
- **local-user-address**: User shipping addresses
- **local-user-wallet**: In-app wallet balance (stored in IRR, not Toman)
- **local-user-wallet-transaction**: Wallet transaction history
- **local-user-role** & **local-user-permission**: Custom RBAC system

### Product System
- **product**: Base product entity
- **product-variation**: SKU-level variations (color, size, model)
- **product-stock**: Inventory tracking (per variation)
- **product-stock-log**: Stock change audit trail
- **product-category**: Hierarchical categories
- **product-review**: User reviews with likes/replies
- **product-like**: Wishlist functionality
- **product-faq**: Product Q&A
- **product-size-helper**: Size guide data (JSON)

### Cart & Order Flow
1. User adds items to cart (`addItem` handler)
2. Cart validates stock availability (`checkStock` handler)
3. User applies discount codes (`applyDiscount` handler)
4. Preview shipping costs (`shippingPreview` handler)
5. Finalize to order (`finalizeToOrder` handler):
   - Validates shipping method & address
   - Creates Order + Contract
   - Initiates payment (gateway or wallet)
6. Payment callback updates order status
7. Stock is decremented on successful payment

### Payment Gateway Notes
- **Mellat v3** is the current primary gateway
- **SnappPay** requires category mapping (`snappay-category-mapper.ts`)
- **Wallet payments** bypass gateway and immediately mark order as "Started"
- All payments are logged in `order-log` for debugging
- Callback URL is constructed server-side (`https://api.infinity.rgbgroup.ir/api/...`)

### Error Handling
- Handlers return structured error responses:
  ```typescript
  return ctx.badRequest("Error message", {
    data: {
      success: false,
      errorCode: "DESCRIPTIVE_CODE",
      message: "User-friendly message (Persian)",
    },
  });
  ```
- Order-log entries are created for debugging payment failures

### Logging
Use `strapi.log.info()`, `strapi.log.error()`, etc. for structured logging. Logs include orderId, userId, and relevant context.

## Common Patterns

### Accessing Strapi Services
```typescript
const cartService = strapi.service("api::cart.cart");
const result = await cartService.someMethod();
```

### Database Queries
```typescript
// Entity Service (high-level)
await strapi.entityService.findOne("api::order.order", orderId, {
  populate: { order_items: true }
});

// Query Engine (low-level)
await strapi.db.query("api::order.order").findOne({
  where: { id, user: { id: user.id } },
  populate: { order_items: { populate: { product_variation: true } } },
});
```

### Custom Routes
Some APIs have `custom-router.ts` files for non-CRUD routes:
```
src/api/local-user/routes/custom-router.ts
src/api/product-review/routes/custom-router.ts
```

## Environment Variables

Key variables (see `.env.example`):
- `DATABASE_URL`, `DATABASE_CLIENT`, `DATABASE_*`: DB connection
- `REDIS_URL`, `REDIS_PASSWORD`: Redis connection
- `JWT_SECRET`: JWT signing key
- `HOST`, `PORT`: Server binding
- Payment gateway credentials (Mellat terminal ID, SnappPay API keys)

## Type Safety

After modifying schemas, regenerate types:
```bash
npm run type:generate
```
This updates type definitions in `types/generated/` based on Strapi schemas.

## Debugging Payment Issues

1. Check `order-log` entries for the order
2. Review `scripts/debug-mellat.js` for gateway testing
3. Use `npm run test:mellat-v3` to test Mellat integration
4. Check `src/api/payment-gateway/services/mellat-v3.ts` for implementation details

## Working with Modified Files

Recent changes:
- `src/api/cart/controllers/handlers/gateway-helpers.ts`: Payment gateway logic
- `src/api/order/controllers/helpers/adminAdjustItems.ts`: Admin order adjustments
- `src/api/product-category/content-types/product-category/schema.json`: Category schema updates
- `src/api/payment-gateway/services/snappay-category-mapper.ts`: New SnappPay category mapping

## Git Workflow

- Main development branch: `dev`
- Recent commits show focus on error handling, SKU fallback logic, and payment gateway integration
- Use descriptive commit messages with prefixes like `fix(orders):`, `feat(payment):`, etc.
