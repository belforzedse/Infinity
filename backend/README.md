# Infinity Store Backend

## Anipo Shipping
- Env: ANIPO_KEYWORD (required), ANIPO_BASE_URL (optional)
- Preview: POST /carts/shipping-preview (auth)
- Issue Barcode: POST /orders/:id/anipo-barcode (auth)
- Order fields: ShippingBarcode, ShippingPostPrice, ShippingTax, ShippingWeight, ShippingBoxSizeId

## Logging
- Single-string logs with JSON payloads (keyword masked)

