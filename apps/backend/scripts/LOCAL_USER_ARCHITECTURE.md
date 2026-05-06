# Local User System Architecture

## Overview

The Infinity backend uses a **custom local user system** instead of Strapi's built-in `users-permissions` plugin. This provides more flexibility for e-commerce operations and integrates with the product catalog, orders, payments, and wallet systems.

## Database Schema

### Core Tables

#### 1. **local_users** (Main User Entity)

The primary user table with authentication and status information.

```typescript
{
  id: number                    // Primary key
  Phone: string                // Required, unique (e.g., "09100000000")
  Password: string             // Stored in plaintext (⚠️ security consideration)
  IsVerified: boolean          // OTP verification status (default: false)
  IsActive: boolean            // User account status (default: true)
  user_role: FK                // Reference to local_user_roles (ID)
  createdAt: datetime
  updatedAt: datetime
  removedAt: datetime?          // Soft delete timestamp

  // Relations
  user_info: oneToOne -> local_user_infos
  user_wallet: oneToOne -> local_user_wallets
  user_addresses: oneToMany -> local_user_addresses
  product_reviews: oneToMany -> product_reviews
  cart: oneToOne -> carts
  orders: oneToMany -> orders
  contracts: oneToMany -> contracts
  discounts: manyToMany -> discounts
  external_id?: string         // For WooCommerce/external system integration
  external_source?: string     // Source system (e.g., "woocommerce")
}
```

#### 2. **local_user_infos** (Extended Profile)

Personal information linked one-to-one with each user.

```typescript
{
  id: number                    // Primary key
  FirstName: string?           // User first name (e.g., "علی")
  LastName: string?            // User last name (e.g., "احمدی")
  NationalCode: string?        // National ID number
  BirthDate: date?             // Date of birth
  Sex: boolean?                // Gender (true=male, false=female)
  Bio: text?                   // User bio/description
  user: FK                     // Reference to local_users (1:1)
  createdAt: datetime
  updatedAt: datetime
}
```

#### 3. **local_user_roles** (Authorization Roles)

Defines roles that can be assigned to users.

```typescript
{
  id: number                    // Primary key
  Title: string                // Role name (e.g., "Admin", "Customer", "Merchant")
  users: oneToMany -> local_users
  user_permissions: manyToMany -> local_user_permissions
  createdAt: datetime
  updatedAt: datetime
}
```

**Current Roles (IDs):**
- `0` - Customer (default)
- `1` - Merchant
- `2` - Admin ⭐

#### 4. **local_user_permissions** (Fine-grained Access Control)

Defines specific permissions that can be assigned to roles.

```typescript
{
  id: number                    // Primary key
  Title: string                // Permission name (e.g., "manage_products", "view_orders")
  user_roles: manyToMany -> local_user_roles
  createdAt: datetime
  updatedAt: datetime
}
```

#### 5. **local_user_wallets** (In-app Wallet)

Stores wallet balance for each user (in-app currency, stored as IRR).

```typescript
{
  id: number                    // Primary key
  user: FK                     // Reference to local_users (1:1)
  Balance: number              // Wallet balance in IRR (integer, no decimals)
  createdAt: datetime
  updatedAt: datetime

  // Relation
  wallet_transactions: oneToMany -> local_user_wallet_transactions
}
```

**Important:**
- Wallet balances are stored in **IRR** (Iranian Rial), not Toman
- No decimal places (integer only)
- Used for in-app credit and refunds

#### 6. **local_user_wallet_transactions** (Wallet History)

Audit trail of all wallet transactions.

```typescript
{
  id: number                    // Primary key
  user: FK                     // Reference to local_users
  wallet: FK                   // Reference to local_user_wallets
  Type: enum                   // "Debit" | "Credit"
  Amount: number               // Transaction amount in IRR
  Description: string?         // "Order refund", "Payment", etc.
  Reference: string?           // Order ID, transaction ID, etc.
  createdAt: datetime
}
```

#### 7. **local_user_addresses** (Shipping Addresses)

Multiple shipping addresses per user.

```typescript
{
  id: number                    // Primary key
  user: FK                     // Reference to local_users
  FullName: string
  Phone: string
  AddressLine: string          // Street address
  Province: string             // State/Province (e.g., "تهران")
  City: string                 // City name
  PostalCode: string
  IsDefault: boolean           // Primary address for shipments
  createdAt: datetime
  updatedAt: datetime
}
```

#### 8. **local_user_logs** (Audit Trail)

Tracks all user account changes for debugging and compliance.

```typescript
{
  id: number                    // Primary key
  local_user: FK               // Reference to local_users
  Action: enum                 // "Create" | "Update" | "Delete"
  Description: string          // "Local user created", "Phone verified", etc.
  Changes: JSON?               // { fieldName: { from: old, to: new } }
  createdAt: datetime
}
```

**Auto-populated by lifecycle hooks** (see `/content-types/local-user/lifecycles.ts`)

## Authentication Flow

### 1. OTP-Based Registration/Login

```
User enters phone → Server generates OTP → SMS sent → User enters OTP → User created/logged in
```

**Endpoints:**
- `POST /api/auth/welcome` - Check if user exists
- `POST /api/auth/otp` - Request OTP (stored in Redis, 5 min expiry)
- `POST /api/auth/login` - Verify OTP and create/login user

**Internals:**
- OTP tokens are 6 random digits
- OTP tokens are stored in **Redis** (not database)
- Redis TTL: **300 seconds** (5 minutes)
- On successful OTP verification:
  - Existing user: `IsVerified` set to true
  - New user: Auto-created with role=0 (Customer)

### 2. Password-Based Login

```
POST /api/auth/login-with-password
{
  "phone": "09100000000",
  "password": "ADMIN_PASSWORD"
}
```

**Response:**
```json
{
  "message": "login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**JWT Details:**
- Secret: `process.env.JWT_SECRET`
- Payload: `{ userId: number }`
- Expiry: **30 days**

### 3. Password Reset

```
User requests OTP → Enters OTP + new password → Password updated
```

**Endpoint:**
- `POST /api/auth/reset-password`

## User Creation Flow

When a new user is created (either via OTP or API), the system automatically creates related entities:

```
createUser() → Local User Entity
           ├─→ Local User Info (FirstName, LastName)
           ├─→ Local User Wallet (Balance: 0)
           └─→ Shopping Cart (empty)
```

**Code:** `src/api/local-user/services/local-user.ts`

## Role & Permission System

### Default Roles

| Role ID | Title | Use Case |
|---------|-------|----------|
| 0 | Customer | Regular users (default) |
| 1 | Merchant | Sellers/vendors |
| 2 | Admin | System administrators |

### Assigning Roles

```typescript
// Create user with specific role
await strapi.entityService.create("api::local-user.local-user", {
  data: {
    Phone: "09100000000",
    Password: "password123",
    IsVerified: true,
    IsActive: true,
    user_role: 2  // Admin
  }
})

// Update user role
await strapi.entityService.update("api::local-user.local-user", userId, {
  data: { user_role: 2 }
})
```

### Checking Permissions

Permissions are many-to-many relationships between roles and permissions. The system checks:

```typescript
// In middleware/authentication.ts
if (user.user_role?.user_permissions?.includes(requiredPermission)) {
  // Allow action
}
```

## Security Considerations

### ⚠️ Current Implementation

**Password Storage:**
- Passwords are stored in **PLAINTEXT** in the database
- Comparison is direct: `user.Password === inputPassword`
- This is a **security vulnerability** and should be fixed with bcrypt

**JWT Handling:**
- Tokens are issued with 30-day expiry
- No token revocation mechanism
- Consider adding refresh token rotation

### Recommended Improvements

1. **Hash passwords with bcrypt:**
   ```typescript
   const bcrypt = require('bcryptjs');
   const hashedPassword = await bcrypt.hash(password, 10);
   ```

2. **Add token refresh mechanism:**
   - Short-lived access tokens (15 min)
   - Refresh tokens (7 days)
   - Token revocation on logout

3. **Rate limiting on OTP:**
   - Max 3 OTP requests per phone/hour
   - Account lockout after 5 failed attempts

## Integration Points

### With Orders
```
local_users → orders (1:many)
           → contracts (1:many) [financial records]
```

### With Shopping
```
local_users → cart (1:1)
           → product_likes (1:many) [wishlist]
           → product_reviews (1:many) [ratings & reviews]
           → discounts (many:many) [available discount codes]
```

### With Payments
```
local_users → contracts [payment agreements]
           → wallet [wallet payments & refunds]
```

### With Shipping
```
local_users → user_addresses (1:many) [delivery locations]
```

## Admin User Creation

### Using the Seeding Script

```bash
npm run seed:admin
```

**Creates:**
- Phone: `09100000000`
- Password: `ADMIN_PASSWORD` (changeable)
- Role: Admin (ID: 2)
- Status: Verified & Active

**To reset existing admin:**
```bash
npm run seed:admin -- --reset
```

### Manual Creation via API

```bash
curl -X POST http://localhost:1337/api/local-users \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "Phone": "09100000000",
      "Password": "ADMIN_PASSWORD",
      "IsVerified": true,
      "IsActive": true,
      "user_role": 2
    }
  }'
```

## Database Relationships Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    local_users (center)                  │
│  Phone, Password, IsVerified, IsActive, user_role       │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        v              v              v
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│local_user_   │ │local_user_   │ │local_user_   │
│infos (1:1)   │ │wallets (1:1) │ │addresses (1:M)
│ FirstName    │ │ Balance      │ │ AddressLine
│ LastName     │ │              │ │ City/Province
└──────────────┘ └──────────────┘ └──────────────┘
                       │
                       v
            ┌──────────────────────┐
            │wallet_transactions   │
            │(audit trail)         │
            └──────────────────────┘

┌──────────────┐
│local_user_   │
│roles (N:1)   │
│ Title        │
└──────────────┘
     │
     └─────> user_permissions (M:M)

┌──────────────┐        ┌──────────────┐
│orders (1:M)  ├───────>│order_items   │
│contracts (1:M)       │(product_var) │
│cart (1:1)    │       └──────────────┘
└──────────────┘
```

## Performance Tips

1. **Populate relations carefully:**
   ```typescript
   // Avoid deep population - can cause N+1 queries
   const user = await strapi.entityService.findOne("api::local-user.local-user", id, {
     populate: {
       user_info: true,
       user_wallet: true,
       user_role: { populate: { user_permissions: true } }
     }
   });
   ```

2. **Use pagination for large datasets:**
   ```typescript
   const users = await strapi.db
     .query("api::local-user.local-user")
     .findMany({
       limit: 50,
       offset: 0,
       orderBy: { createdAt: 'desc' }
     });
   ```

3. **Index frequently queried fields:**
   - `Phone` (already unique)
   - `IsActive`
   - `user_role`
   - `createdAt`

## Testing

### Create test user:
```bash
npm run seed:admin
```

### Login test:
```bash
curl -X POST http://localhost:1337/api/auth/login-with-password \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "09100000000",
    "password": "ADMIN_PASSWORD"
  }'
```

### Query user via API:
```bash
curl -X GET http://localhost:1337/api/local-users/1 \
  -H "Authorization: Bearer <token>"
```

## File Structure

```
src/api/local-user/
├── content-types/
│   └── local-user/
│       ├── schema.json
│       └── lifecycles.ts        [Audit logging]
├── controllers/
│   └── local-user.ts
├── services/
│   └── local-user.ts            [createUser, updateUser]
└── routes/
    └── local-user.ts

src/api/local-user-role/
├── content-types/
│   └── local-user-role/
│       └── schema.json

src/api/local-user-info/
├── content-types/
│   └── local-user-info/
│       └── schema.json

src/api/auth/
├── controllers/
│   └── auth.ts                  [OTP, login, reset]
├── services/
│   └── auth.ts                  [OTP generation]
├── routes/
│   └── auth.ts
└── utils/
    └── validations.ts           [Phone validation]
```

## Related Documentation

- Authentication: `src/api/auth/`
- Payment Integration: `src/api/payment-gateway/`
- Order Management: `src/api/order/`
- Cart System: `src/api/cart/`
- Admin Dashboard: Frontend `/admin/` routes
