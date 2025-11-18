# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Infinity Backend**, an e-commerce backend built on **Strapi 4.25.21** (a headless CMS framework). The system handles products, shopping carts, orders, payments, user management, and more. It uses PostgreSQL for persistence and Redis for caching/sessions.

## Development Commands

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
- **Authentication**: Strapi users-permissions plugin (migrated from custom auth system)

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

#### 2. Strapi Users-Permissions Authentication
The system uses **Strapi's users-permissions plugin** for authentication:
- JWT tokens are issued/verified using `strapi.plugin("users-permissions").service("jwt")`
- Users are stored in `plugin::users-permissions.user` content type
- Auth routes are in `src/api/auth/` and use the plugin's JWT service
- User profile data is stored in `api::local-user-info.local-user-info` linked to plugin users
- Routes use `auth: { scope: [] }` or `auth: false` for authentication

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

### Database
- `DATABASE_CLIENT`: Database client (postgres)
- `DATABASE_HOST`: Database host (localhost or infinity-postgres)
- `DATABASE_PORT`: Database port (5432)
- `DATABASE_NAME`: Database name (infinity_db, prod, dev)
- `DATABASE_USERNAME`: Database username
- `DATABASE_PASSWORD`: Database password
- `DATABASE_SSL`: SSL mode (false for local, true for production)

### Redis
- `REDIS_URL`: Redis connection URL (redis://:password@host:6379)
- `REDIS_PASSWORD`: Redis password

### Security
- `JWT_SECRET`: JWT signing key
- `APP_KEYS`: Comma-separated app keys
- `API_TOKEN_SALT`: API token salt
- `ADMIN_JWT_SECRET`: Admin JWT secret
- `TRANSFER_TOKEN_SALT`: Transfer token salt

### Server
- `HOST`: Server host (0.0.0.0)
- `PORT`: Server port (1337)
- `URL`: Public URL (https://api.infinitycolor.org)

### Payment Gateways

**Mellat Bank:**
- `MELLAT_TERMINAL_ID`: Terminal ID (required, no fallback)
- `MELLAT_USERNAME`: Username (required, no fallback)
- `MELLAT_PASSWORD`: Password (required, no fallback)
- `MELLAT_GATEWAY_URL`: Gateway URL (optional)
- `MELLAT_PAYMENT_URL`: Payment page URL (optional)

**SnappPay:**
- `SNAPPAY_BASE_URL`: API base URL (default: https://api.snappay.ir)
- `SNAPPAY_CLIENT_ID`: Client ID (required, no fallback)
- `SNAPPAY_CLIENT_SECRET`: Client secret (required, no fallback)
- `SNAPPAY_USERNAME`: Username (required, no fallback)
- `SNAPPAY_PASSWORD`: Password (required, no fallback)
- `SNAPPAY_RETURN_URL`: Return URL (optional)

### SMS Gateway (IP Panel)
- `IP_PANEL_API_URL`: API endpoint
- `IP_PANEL_API_KEY`: API key
- `IP_PANEL_PATTERN_CODE`: Pattern code
- `IP_PANEL_SENDER`: Sender number

**⚠️ SECURITY NOTE**: All payment gateway credentials MUST be in environment variables. Hardcoded fallbacks in code are a security risk and should be removed.

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

## Database Initialization & Deployment

### Critical Environment Setup

**Docker/Deployment:**
- `docker-compose.yml`: Shared across all environments (prod, staging, experimental)
- `init-db.sh`: Auto-creates database on container startup (idempotent)
- Both production and staging use **identical service names**: `infinity-postgres`, `infinity-redis`, `infinity-strapi`
- Service discovery works because they run on **separate servers**, not naming conflicts

**Environment Files:**
- `main.env`: Production configuration (`DATABASE_HOST=infinity-postgres`, `DATABASE_NAME=prod`)
- `dev.env`: Staging configuration (`DATABASE_HOST=infinity-postgres`, `DATABASE_NAME=dev`)
- GitHub Actions extracts `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_NAME` and creates `db.env`

**Important:** Both environments use the SAME hostname (`infinity-postgres`) because:
- They run on separate Docker hosts (different servers)
- Same container name on different hosts causes no conflict
- Allows single docker-compose.yml for all deployments

### Database Auto-Initialization

1. **init-db.sh runs on PostgreSQL startup:**
   ```bash
   CREATE DATABASE IF NOT EXISTS "$POSTGRES_DB";
   ```
   - Idempotent (safe to run multiple times)
   - Creates database before Strapi connects
   - Prevents "database does not exist" errors

2. **Strapi auto-migration on first connection:**
   - Creates all tables from schemas
   - Runs pending migrations from `/database/migrations/`
   - Calls `bootstrap()` function in `src/index.ts`

3. **Bootstrap seeding (runs every startup, idempotent):**
   - `ensureIranLocations()`: Seeds provinces and cities if missing
   - `migrateLocalUsers()`: One-time migration of legacy users to plugin system
   - `ensurePluginRoles()`: Creates roles if missing, updates permissions

### Shipping City Data

- **Auto-seeded on startup** via `ensureIranLocations()` in `src/index.ts`
- Reads from:
  - `database/iran-cities.json` - Province and city names
  - `database/iran_cities (for api document) (2).sql` - City/province codes
- Creates: `shipping_province` and `shipping_city` records
- Idempotent: checks if data exists, skips if already seeded
- Critical: SQL file must be in `database/` directory, not in root

### GitHub Actions Deployment Flow

Production deployment (push to `main`):
1. Extract environment from `PROD_BACKEND_ENV_FILE` secret
2. Create `main.env` file with credentials
3. Generate `db.env` from `DATABASE_*` variables
4. Start containers: `docker compose --env-file main.env up -d`
5. `init-db.sh` creates `prod` database
6. Strapi auto-creates schema
7. Bootstrap seeds Iran locations

## Known Issues & Technical Debt

### Critical Issues
1. **Hardcoded Secrets**: Payment gateway services have fallback credentials in code
   - Files: `snappay.ts`, `mellat.ts`, `mellat-v2.ts`, `mellat-v3.ts`
   - Action: Remove all fallback values, require env vars
2. **Low Test Coverage**: Only 7 test files for 191 TypeScript files
   - Action: Expand test coverage, especially for payment flows
3. **Stock Decrement Timing**: Wallet payments decrement stock before settlement
   - File: `src/api/cart/controllers/handlers/finalizeToOrder.ts`
   - Action: Move stock decrement to callback flow

### High Priority Issues
1. **Type Safety**: 50+ `as any` casts need proper type definitions
2. **Logging**: 15+ `console.log` calls should use structured logging
3. **Monolithic Services**: `cart.service.ts` (376 lines) needs refactoring
4. **Missing Request Validation**: No zod/schema validation middleware

See `DX_ANALYSIS.md` for complete analysis and roadmap.

## Working with Modified Files

Recent changes:
- `init-db.sh`: Database initialization script (auto-creates database)
- `docker-compose.yml`: Now mounts init script for database creation
- `database/iran_cities (for api document) (2).sql`: Moved to database/ directory for seeding
- `src/api/cart/controllers/handlers/gateway-helpers.ts`: Payment gateway logic
- `src/api/order/controllers/helpers/adminAdjustItems.ts`: Admin order adjustments
- `src/api/product-category/content-types/product-category/schema.json`: Category schema updates
- `src/api/payment-gateway/services/snappay-category-mapper.ts`: New SnappPay category mapping

## Git Workflow

- Main development branch: `dev`
- Deployments: `main` (prod), `dev` (staging), `experimental`
- Recent commits show focus on error handling, SKU fallback logic, and payment gateway integration
- Use descriptive commit messages with prefixes like `fix(orders):`, `feat(payment):`, etc.
