# Matomo Event Taxonomy

This document defines the only approved Matomo event schema for the storefront.

## Funnel Events (Canonical)

Use `trackFunnelStep(...)` for these only:

- `view_item`
- `add_to_cart`
- `begin_checkout`
- `purchase`

Rules:

- Keep funnel event names stable.
- Do not add extra funnel actions under `category: "funnel"`.
- If a new behavior is needed, use a non-funnel category.

## Non-Funnel Categories

Use `trackMatomoEvent(...)` with these categories:

- `checkout`
  - Examples: `place_order_attempt`, `add_shipping_info`, `add_payment_info`, `payment_redirect`, `payment_completed`, `payment_callback_success`, `payment_callback_failed`, `payment_callback_error`, `order_success_page_view`, `order_failure_page_view`, `error`
- `ecommerce`
  - Examples: `view_cart`, `remove_from_cart`, `update_quantity`
- `engagement`
  - Examples: `click_add_to_cart`, `share_product`, `open_comments`, `add_to_wishlist`, `remove_from_wishlist`
- `search`
  - Example: `search`

## Cardinality Rules

- `action` must be low-cardinality and from a fixed list.
- `name` should be optional and bounded:
  - Prefer IDs/codes over free text.
  - Never send raw backend error messages as `name`.
  - For errors, use stable codes like `NETWORK_ERROR`, `TIMEOUT`, `UNKNOWN_ERROR`.
- `value` should be numeric (price, quantity, totals).

## Dedupe Rules

- Use `onceKey` when re-renders can duplicate tracking.
- Do not emit both a funnel event and another equivalent event for the same conversion step.
  - Example: `add_to_cart` is canonical funnel signal; `click_add_to_cart` is engagement intent only.
