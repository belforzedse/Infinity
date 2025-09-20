# Infinity Store Frontend

This repository contains the Infinity Store Next.js frontend.

## Recent Changes
- Super Admin: Anipo barcode generation button in order details.
- SEO: Favicon localized; metadata normalized to server components.
- Fix: Metadata removed from client components (Next.js requirement).
- Wallet: Added wallet service and UI integration (balance display, checkout wallet option, top-up redirect).

# Infinity Store Frontend

## Anipo Integration
- Checkout preview via POST /carts/shipping-preview
- User orders show Anipo tracking link if barcode exists
- Super Admin order details display Anipo fields

## Wallet
- Service: `src/services/wallet/index.ts` exposes `getMyWallet()` and `startTopup(amountIrr)`.
- Checkout: `ShoppingCart/‌Bill/PaymentGateway.tsx` adds `wallet` option; `ShoppingCart/‌Bill/index.tsx` computes required amount and passes balance/required.
- User: `Wallet/Balance.tsx` shows real balance (IRR → toman), `Wallet/IncreaseBalance.tsx` triggers Mellat form POST with `RefId`.
