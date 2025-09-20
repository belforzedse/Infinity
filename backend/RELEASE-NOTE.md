# Release Notes

## 2025-09-20

- Wallet checkout fix: Defer stock decrement and order status updates for wallet payments to gateway callback settlement. The finalize handler now only debits the wallet and writes an audit log ("pending settlement").
- Wallet top-up (Mellat) module added: `wallet-topup` content type, controller, routes, and service with robust absolute callback URL construction and improved error logging. ReferenceId composed as `${SaleOrderId}-${SaleReferenceId}`.
- Generated types updated for new wallet-topup type and shipping/order fields.

## Anipo Integration
- Shipping preview endpoint with detailed logs
- Barcode issuance endpoint: POST /orders/:id/anipo-barcode
- Order fields persisted: ShippingBarcode, ShippingPostPrice, ShippingTax, ShippingWeight, ShippingBoxSizeId
- Service logs include request/response (keyword masked) and PayTypeID=0 workaround
