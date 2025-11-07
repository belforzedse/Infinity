# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Infinity Store Frontend** is a modern, RTL-first e-commerce user interface built with:
- **Next.js 15** (App Router, server/client components)
- **TypeScript** (strict mode)
- **Tailwind CSS** (with Persian text optimization)
- **Jotai** (atomic state management)
- **React Hook Form** (form state)
- **React Query patterns** (API caching)

The frontend integrates with a Strapi v4 backend API for all data and handles authentication, product discovery, cart management, checkout, and user accounts.

## Development Commands

### Starting Development
```bash
npm run dev                          # Start dev server on port 2888
```
Opens http://localhost:2888 with automatic HMR.

### Building & Production
```bash
npm run build                        # Production build
npm run start                        # Start production server (port 3000)
```

### Code Quality
```bash
npm run lint                         # Run ESLint
npm run lint:fix                     # Fix lint issues
npm run format                       # Format with Prettier
npm run format:check                 # Check formatting without changes
npm run type-check                   # TypeScript strict check (--noEmit)
npm run validate                     # Run lint + format:check + type-check
```

### Testing
```bash
npm run test                         # Run Jest tests (jsdom environment)
npm run test:watch                   # Watch mode for TDD
npm run test:coverage                # Generate coverage report
```

### Cleanup
```bash
npm run clean                        # Remove .next, node_modules cache
```

## Architecture

### Directory Structure

```
src/
├── app/                            # Next.js App Router (pages & layouts)
│   ├── (public)/                  # Public pages (home, PLP, PDP)
│   │   ├── page.tsx               # Homepage
│   │   ├── categories/            # Category browsing
│   │   ├── [product]/             # Product detail (PDP)
│   │   └── search/                # Search results
│   ├── (user)/                    # Protected user pages
│   │   ├── account/               # Profile management
│   │   ├── orders/                # Order history
│   │   ├── addresses/             # Saved shipping addresses
│   │   ├── wallet/                # Wallet balance & transactions
│   │   └── likes/                 # Wishlist
│   ├── (product)/                 # Super-admin product management
│   │   ├── manage-products/       # Product CRUD
│   │   ├── manage-categories/     # Category CRUD
│   │   └── manage-variations/     # Variation management
│   ├── (super-admin)/             # Super-admin dashboard
│   │   ├── dashboard/             # Analytics & reports
│   │   ├── users/                 # User management
│   │   ├── orders/                # Order management
│   │   └── settings/              # System settings
│   ├── payment/                   # Payment callback handlers
│   │   ├── mellat-callback/       # Mellat gateway response
│   │   └── snappay-callback/      # SnappPay response
│   ├── api/                       # Next.js API routes (if any)
│   ├── layout.tsx                 # Root layout
│   ├── loading.tsx                # Loading UI
│   ├── not-found.tsx              # 404 page
│   ├── Providers.tsx              # Auth & state providers
│   └── globals.css                # Global Tailwind styles
│
├── components/                     # Reusable React components
│   ├── Layout/                    # Layout components (Header, Footer, Sidebar)
│   ├── Product/                   # Product display components
│   │   ├── ProductCard.tsx        # Grid card for PLP
│   │   ├── ProductDetail.tsx      # PDP content
│   │   ├── VariationSelector.tsx  # Color/size/model picker
│   │   └── ReviewSection.tsx      # Reviews & ratings
│   ├── Cart/                      # Shopping cart
│   │   ├── CartDrawer.tsx         # Side drawer UI
│   │   └── CartItem.tsx           # Cart item component
│   ├── Checkout/                  # Checkout flow
│   │   ├── ShippingForm.tsx       # Address & method selection
│   │   ├── PaymentSelector.tsx    # Gateway selection
│   │   └── OrderReview.tsx        # Final confirmation
│   ├── Auth/                      # Authentication
│   │   ├── LoginForm.tsx          # Login/register
│   │   ├── OTPInput.tsx           # OTP verification
│   │   └── ProtectedRoute.tsx     # Route protection
│   └── UI/                        # Shadcn/ui components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Dialog.tsx
│       ├── Select.tsx
│       └── ... (from components.json)
│
├── services/                       # API client layer (Strapi)
│   ├── auth/                      # Authentication endpoints
│   │   ├── sendOTP.ts             # Send OTP to phone
│   │   ├── verifyOTP.ts           # Verify OTP token
│   │   ├── loginPassword.ts       # Password login
│   │   ├── register.ts            # User registration
│   │   ├── resetPassword.ts       # Password reset
│   │   └── exists.ts              # Check if user exists
│   ├── cart/                      # Shopping cart endpoints
│   │   ├── addItem.ts             # Add product to cart
│   │   ├── removeItem.ts          # Remove cart item
│   │   ├── checkStock.ts          # Validate stock
│   │   ├── applyDiscount.ts       # Apply discount code
│   │   ├── shippingPreview.ts     # Calculate shipping cost
│   │   └── finalizeToOrder.ts     # Checkout
│   ├── product/                   # Product endpoints
│   │   ├── getProducts.ts         # List with filters
│   │   ├── getProductDetail.ts    # Single product + variations
│   │   ├── getCategories.ts       # Category list
│   │   ├── searchProducts.ts      # Search
│   │   └── getReviews.ts          # Product reviews
│   ├── user/                      # User profile endpoints
│   │   ├── getProfile.ts          # Current user info
│   │   ├── updateProfile.ts       # Edit profile
│   │   ├── getOrders.ts           # Order history
│   │   ├── getAddresses.ts        # Saved addresses
│   │   ├── addAddress.ts          # Save address
│   │   └── getWallet.ts           # Wallet balance & history
│   ├── order/                     # Order endpoints
│   │   ├── getOrderDetail.ts      # Single order
│   │   └── cancelOrder.ts         # Cancel order
│   └── index.ts                   # Main export
│
├── hooks/                          # Custom React hooks
│   ├── useCurrentUser.ts          # Get authenticated user (from atom)
│   ├── useUser.ts                 # User data & operations
│   ├── useAddToCart.ts            # Add to cart logic
│   ├── useProductLike.ts          # Wishlist toggle
│   ├── api/                       # API-specific hooks
│   │   ├── useProduct.ts          # Fetch single product
│   │   ├── useProducts.ts         # Fetch product list
│   │   ├── useOrders.ts           # Fetch user orders
│   │   └── useCart.ts             # Fetch cart contents
│   └── __tests__/                 # Hook tests
│
├── atoms/                          # Jotai global state
│   ├── userAtom.ts                # Authenticated user (null | User)
│   ├── cartAtom.ts                # Shopping cart state
│   ├── authAtom.ts                # Auth status & tokens
│   ├── Order.ts                   # Current order state
│   ├── loading.ts                 # Global loading state
│   ├── provinceAtom.ts            # Shipping provinces
│   └── super-admin/               # Admin-specific atoms
│       ├── selectedProductAtom.ts # Selected product in admin
│       └── dashboardAtom.ts       # Dashboard data
│
├── lib/                            # Utilities & helpers
│   ├── api-client.ts              # Axios instance with auth headers
│   ├── jotaiStore.ts              # Jotai store configuration
│   ├── utils.ts                   # General utilities (cn, etc.)
│   └── atoms/                     # Atom utilities
│
├── utils/                          # Helper functions
│   ├── formatPrice.ts             # Format currency (IRR → display)
│   ├── formatDate.ts              # Format timestamps
│   ├── storage.ts                 # LocalStorage helpers
│   ├── validation.ts              # Form validators (phone, email)
│   ├── api-helpers.ts             # API error handling
│   └── currency.ts                # Currency conversion helpers
│
├── constants/                      # Configuration constants
│   ├── api.ts                     # API endpoints, base URLs
│   ├── shipping.ts                # Shipping methods, provinces
│   ├── payment.ts                 # Payment gateways
│   └── validation.ts              # Validation rules
│
├── types/                          # TypeScript type definitions
│   ├── auth.ts                    # Auth types
│   ├── product.ts                 # Product types
│   ├── order.ts                   # Order types
│   ├── user.ts                    # User types
│   ├── api.ts                     # API response types
│   └── index.ts                   # Re-exports
│
├── styles/                         # Global styles
│   └── (other stylesheets)
│
└── contexts/                       # React contexts (legacy, prefer Jotai)
    └── (legacy patterns)

__tests__/                          # Integration tests
├── auth.test.ts
├── cart.test.ts
└── checkout.test.ts
```

## Key Patterns & Concepts

### 1. API Client Layer (`src/lib/api-client.ts`)

All backend communication goes through typed service functions in `src/services/`:

```typescript
// Frontend component
import { getProductDetail } from '@/services/product/getProductDetail'

export async function ProductPage({ params }) {
  const product = await getProductDetail(params.product)
  return <ProductDetail product={product} />
}
```

Benefits:
- Centralized API logic
- Type-safe requests & responses
- Error handling in one place
- Easy mocking for tests

### 2. Jotai Atomic State (`src/atoms/`)

Global state is managed as atoms:

```typescript
// atoms/userAtom.ts
import { atom } from 'jotai'
export const userAtom = atom<User | null>(null)

// components/Profile.tsx
import { useAtom } from 'jotai'
import { userAtom } from '@/atoms/userAtom'

export function Profile() {
  const [user, setUser] = useAtom(userAtom)
  return <div>{user?.name}</div>
}
```

### 3. Protected Routes

Routes in `(user)/` require authentication:

```typescript
// src/app/(user)/orders/page.tsx
import { requireAuth } from '@/lib/auth-guard'

export default async function OrdersPage() {
  const user = await requireAuth() // Redirects if not logged in
  return <OrdersList userId={user.id} />
}
```

### 4. Server & Client Components

Use Next.js patterns for optimal performance:

```typescript
// Server component (fetch data at build/request time)
export default async function ProductPage({ params }) {
  const product = await getProduct(params.id)
  return <ProductDisplay product={product} />
}

// Client component (use hooks, state)
'use client'
import { useState } from 'react'

export function VariationSelector({ product }) {
  const [selected, setSelected] = useState()
  return (...)
}
```

### 5. Form Handling with React Hook Form

```typescript
'use client'
import { useForm } from 'react-hook-form'

export function CheckoutForm() {
  const { register, handleSubmit, formState: { errors } } = useForm()

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('address', { required: true })} />
      {errors.address && <span>Required</span>}
    </form>
  )
}
```

### 6. Payment Callback Handling

```typescript
// src/app/payment/mellat-callback/page.tsx
'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function MellatCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refId = searchParams.get('RefId')

  useEffect(() => {
    // Verify payment with backend
    // Update order status
    // Redirect to success/error page
  }, [refId])
}
```

## Environment Variables

Variables are auto-loaded from:
- **`dev.env`** - Development environment (used in dev mode)
- **`main.env`** - Production environment (used when `NODE_ENV=production`)
- **`.env.local`** - Personal overrides (gitignored, not committed)

Key variables:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:1337/api
NEXT_PUBLIC_IMAGE_BASE_URL=http://localhost:1337/

# Authentication
NEXT_PUBLIC_STRAPI_TOKEN=your-token-here

# Feature Flags
NEXT_PUBLIC_ENABLE_SNAPPAY=true
NEXT_PUBLIC_ENABLE_MELLAT=true
```

The loader (`load-env.js`) automatically merges files based on `NODE_ENV`.

## Common Tasks

### Adding a New Page

1. Create folder in `src/app/(section)/new-page/`
2. Add `page.tsx`:
   ```typescript
   export default function NewPage() {
     return <div>Content</div>
   }
   ```
3. Use dynamic routes with `[param]` for dynamic segments

### Fetching Data from Backend

1. Create service in `src/services/domain/action.ts`:
   ```typescript
   import { apiClient } from '@/lib/api-client'

   export async function getData() {
     return apiClient.get('/endpoint')
   }
   ```

2. Use in page or hook:
   ```typescript
   import { getData } from '@/services/domain/action'

   const data = await getData()
   ```

### Using Global State

1. Create atom in `src/atoms/myAtom.ts`:
   ```typescript
   import { atom } from 'jotai'

   export const myAtom = atom(initialValue)
   ```

2. Use in component:
   ```typescript
   'use client'
   import { useAtom } from 'jotai'
   import { myAtom } from '@/atoms/myAtom'

   export function MyComponent() {
     const [value, setValue] = useAtom(myAtom)
     return <div onClick={() => setValue(newValue)}>Click</div>
   }
   ```

### Adding a New API Endpoint

1. Create service function in `src/services/domain/action.ts`
2. Import `apiClient` from `@/lib/api-client`
3. Make typed request:
   ```typescript
   export async function myAction(id: number): Promise<MyType> {
     const { data } = await apiClient.post('/endpoint', { id })
     return data
   }
   ```
4. Use in component or hook

## Testing

### Unit Tests (Jest + React Testing Library)

```bash
npm run test               # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Generate coverage
```

Test files use `.test.ts` or `.test.tsx` suffix.

Example:
```typescript
import { render, screen } from '@testing-library/react'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Integration Testing

Test critical flows like:
- Authentication (login, register, OTP)
- Shopping cart (add, remove, apply discount)
- Checkout (validate address, select shipping, payment)
- Order history

## Performance Optimization

- **Image optimization**: Use Next.js `<Image>` component with CDN URL
- **Code splitting**: Routes automatically split by Next.js
- **Caching**: API responses cached in Jotai atoms
- **Lazy loading**: Dynamic imports for heavy components
- **CSS**: Tailwind with tree-shaking, minimal bundle

## Security

- **JWT tokens**: Stored in memory (Jotai atom), NOT localStorage
- **HTTPS only**: All API calls go to HTTPS endpoints
- **CSRF protection**: Backend validates request origin
- **Auth guard**: Protected routes redirect unauthenticated users
- **Password handling**: Never logged or exposed in client code

## RTL & Internationalization

- **Language**: Persian (Farsi) primary language
- **Direction**: All layouts use `dir="rtl"` at root
- **Text**: Use `jalaliday` for Persian calendar dates
- **Currency**: Display in Persian numerals (خ instead of 4)
- **Validation**: Phone numbers validated against Iranian format

## Debugging

### Common Issues

**"Cannot find module X"**
- Check import path (case-sensitive on Linux)
- Verify path mapping in `tsconfig.json`

**"API 404 errors"**
- Check `NEXT_PUBLIC_API_BASE_URL` in environment
- Verify backend is running on correct port

**"Jotai atom not updating"**
- Ensure component is marked with `'use client'`
- Check atom is correctly imported & used

**"Form submission fails"**
- Check form validation rules in `react-hook-form`
- Verify API endpoint in service function

### Viewing Backend Docs

Backend API is documented in Strapi admin panel:
- `http://localhost:1337/admin` - Strapi admin
- Auto-generated Swagger/OpenAPI docs

## Build & Deployment

### Build Process

```bash
npm run build
```

Creates optimized Next.js production build in `.next/` directory.

### Docker

```bash
docker build -f main.Dockerfile -t infinity-frontend:prod .
docker run --rm -p 3000:3000 infinity-frontend:prod
```

Environment variables are loaded from `main.env` automatically.

## Useful Resources

- **Figma Design**: https://www.figma.com/design/x4y3qlCXNd3ZB6ocY09PPm/infinity-Store
- **Next.js Docs**: https://nextjs.org/docs
- **Jotai Docs**: https://jotai.org
- **Tailwind CSS**: https://tailwindcss.com
- **React Hook Form**: https://react-hook-form.com
- **Shadcn/ui**: https://ui.shadcn.com
- **TypeScript**: https://www.typescriptlang.org/docs

## Related Documentation

- Root `CLAUDE.md` - Project overview and structure
- Backend `CLAUDE.md` - Strapi API architecture (`../infinity-backend/CLAUDE.md`)
- `README.md` - Quick start guide (this file)
