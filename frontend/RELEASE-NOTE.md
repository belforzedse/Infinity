# Infinity Store Frontend - Release Notes

## 2025-09-14 07:05 UTC

### Fixes

- PDP selectors: ensure buttons use `type="button"` to avoid unintended form submissions.

### Accessibility

- Added TODO note to improve selected color state semantics (keyboard operability / aria roles).

### Files Changed

- `src/components/PDP/Hero/Info/Color.tsx`
- `src/components/PDP/Hero/Info/Size.tsx`
- `src/components/PDP/Hero/Info/Model.tsx`

## 2025-09-19
- Checkout stability: fixed totals consistency with shipping preview and discount preview merge.
- Stabilized effect dependencies (shippingId, shippingCost, addressId).
- Preserved SnappPay eligibility state on API errors.
- Typed shipping preview and SnappPay eligibility responses; added error-safe fallbacks.
