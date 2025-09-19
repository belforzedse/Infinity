# Release Notes

## Anipo Integration
- Shipping preview endpoint with detailed logs
- Barcode issuance endpoint: POST /orders/:id/anipo-barcode
- Order fields persisted: ShippingBarcode, ShippingPostPrice, ShippingTax, ShippingWeight, ShippingBoxSizeId
- Service logs include request/response (keyword masked) and PayTypeID=0 workaround
