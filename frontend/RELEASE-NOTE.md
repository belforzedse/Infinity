# Release Notes

## Anipo Frontend
- Shipping preview calls /carts/shipping-preview on address/shipping change
- User orders list shows tracking link when ShippingBarcode exists
- Super Admin order details display Anipo fields (barcode, post price, tax, weight, box size)

## 2025-09-20
- Super Admin: Anipo barcode button + server-side metadata via ClientLayout.
- SEO: Local favicon in public and Next.js icons metadata.
- SEO: Home and auth page metadata added (server-only).
- Next.js fix: Removed metadata from client pages to avoid runtime errors.
- Wallet: Added wallet service (balance fetch, start top-up), wallet as checkout payment method with balance display/disable logic, POST form redirect to Mellat with RefId, and wallet/snappay assets.
