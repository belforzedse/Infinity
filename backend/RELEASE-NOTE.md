# Infinity Store Backend - Release Notes

## 2025-09-19 19:30 UTC

### Features

- Shipping preview endpoint: `POST /carts/shipping-preview` with auth middleware. Computes declared value preferring `DiscountPrice` and returns Anipo-estimated shipping.
- Anipo client service implemented (`barcodePrice`, `getBarcode`, `remaining`, `paymentGatewayLink`).

### Fixes

- Cart finalize: Use Anipo preview to override shipping cost when available; short-circuit buy-in-person (id=4) to zero.
- Observability: Write `order-log` entry when Anipo preview is unavailable (e.g., missing keyword/network error).
- Data: Populate `product.Weight` in cart queries for accurate gram-based weight.

### Environment

- Added `ANIPO_KEYWORD` and optional `ANIPO_BASE_URL` placeholders to `dev.env` and `main.env`.

### Affected Files

- `src/api/cart/controllers/handlers/shippingPreview.ts`
- `src/api/cart/controllers/cart.ts`
- `src/api/cart/routes/a-custom-router.ts`
- `src/api/cart/services/cart.ts`
- `src/api/cart/services/lib/get-user-cart.ts`
- `src/api/cart/services/lib/order.ts`
- `src/api/shipping/services/anipo.ts`
- `dev.env`, `main.env`

## 2025-09-14 07:00 UTC

### Fixes

- SnappPay mobile formatting: preserve `+98XXXXXXXXXX` end-to-end; normalize if missing plus in service.
- Eligibility guard: abort token request when SnappPay eligibility is unsuccessful.
- Defensive error handling: wrap token request; cancel order/contract on hard error.

### Logging

- Added identifiers in payment callback and results for verify/settle.
- Added eligibility request/result logs for observability.

### Policies (unchanged)

- Cart cleared only after successful gateway initiation.
- Stock is decremented only after successful settlement.

### Files Changed

- `src/api/cart/controllers/handlers/gateway-helpers.ts`
- `src/api/payment-gateway/services/snappay.ts`
- `src/api/order/controllers/order.ts` (logs)
- `src/api/payment-gateway/controllers/payment-gateway.ts` (logs)
