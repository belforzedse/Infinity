# Infinity Store Backend

## Anipo Shipping

- Env: ANIPO_KEYWORD (required), ANIPO_BASE_URL (optional)
- Preview: POST /carts/shipping-preview (auth)
- Issue Barcode: POST /orders/:id/anipo-barcode (auth)
- Order fields: ShippingBarcode, ShippingPostPrice, ShippingTax, ShippingWeight, ShippingBoxSizeId

## Wallet

- Top-up via Mellat:
  - POST `/wallet/charge-intent` (auth) → creates pending top-up, calls Mellat V3, returns `redirectUrl`, `refId`.
  - POST `/wallet/payment-callback` (public) → verify + settle; marks top-up success/failure; on success credits user wallet and creates `local-user-wallet-transaction` Type="Add". Uses absolute callback URL based on `server.url` and avoids duplicate `/api`.
- Checkout with wallet (full wallet only):
  - In finalize handler, wallet balance is debited and a Type="Minus" transaction is recorded.
  - Per stock policy, stock decrement and order status changes occur only after payment settlement in callback.

## Logging

- Single-string logs with JSON payloads (keyword masked)
