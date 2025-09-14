# Infinity Store Backend - Release Notes

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
