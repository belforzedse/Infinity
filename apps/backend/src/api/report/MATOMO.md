# Matomo Analytics — Backend & Reporting

How Matomo is integrated across the platform: reporting (read), server-side
ecommerce tracking (write), configuration, and capability boundaries.

## Architecture

```
Browser ──(matomo.js + _paq)──▶ Matomo  ◀──(Reporting API, token_auth)── Strapi report service
   pageviews / events / site search          server-side reads only,
   (lib/analytics/matomo.ts)                  normalized into typed DTOs

Strapi payment confirmation ──(Tracking API matomo.php, idgoal=0)──▶ Matomo
   server-side, idempotent, fire-and-forget (matomo-tracker.ts)
```

- **The Matomo API token never reaches the browser.** Only the frontend
  `NEXT_PUBLIC_MATOMO_URL` / `NEXT_PUBLIC_MATOMO_SITE_ID` are public.
- The reporting service (`services/matomo.ts`) calls a **fixed, hardcoded set of
  Matomo methods**. No request parameter can choose the method or override the
  base URL → no arbitrary proxying and no SSRF.
- Report endpoints (`/reports/traffic/dashboard`, `/reports/traffic/realtime`)
  are gated to the **Superadmin** role.

## Environment variables (backend)

| Var | Required | Notes |
| --- | -------- | ----- |
| `MATOMO_BASE_URL` | yes | e.g. `https://analytics.infinitycolor.org` |
| `MATOMO_SITE_ID` | yes | prod = `1`, staging = `2` |
| `MATOMO_API_TOKEN` | yes | server-side only; used for Reporting + Tracking API |
| `MATOMO_TIMEOUT_MS` | no | default 8000 |
| `MATOMO_SERVER_TRACKING_ENABLED` | no | server ecommerce tracking; defaults **on** when configured. Set `false` to disable |
| `MATOMO_TRACKING_URL_BASE` | no | storefront origin used in tracked order URLs; falls back to `FRONTEND_BASE_URL` then `https://infinitycolor.co` |
| `REPORT_TIMEZONE` | no | default `Asia/Tehran`; report day boundaries |
| `TRAFFIC_DASHBOARD_CACHE_TTL_MS` / `TRAFFIC_REALTIME_CACHE_TTL_MS` | no | report cache TTLs |

Frontend: `NEXT_PUBLIC_MATOMO_URL`, `NEXT_PUBLIC_MATOMO_SITE_ID`,
`NEXT_PUBLIC_MATOMO_ENABLE_DEV` (opt-in to enable tracking in dev/test).

## Reporting service (`services/matomo.ts`)

- Date boundaries are computed in `REPORT_TIMEZONE` (Asia/Tehran), not UTC.
- All sub-reports run via `Promise.allSettled` — a single failing/slow section
  degrades to empty data + a `tracking.sectionErrors` entry and
  `tracking.partial = true`, instead of failing the whole dashboard.
- `previousRange()` yields the immediately-preceding equal-length window;
  `comparison.*` deltas reuse `periodDelta` from `product-analytics.ts`
  (`changePct` is `null` when the baseline is 0 — never a misleading ∞/100%).
- `tracking.capabilities` reports which optional report areas responded, so the
  dashboard can hide/flag unavailable features rather than render broken panels.

### Currency reconciliation

The dashboard's **authoritative** orders/revenue come from Strapi contract
transactions (Toman). Matomo behavioral/ecommerce numbers are shown separately
and labeled as such. Server-side ecommerce tracking sends **Toman** amounts — the
Matomo site currency must be configured to Toman for revenue to reconcile.

## Server-side ecommerce tracking (`services/matomo-tracker.ts`)

`trackOrderToMatomo(strapi, orderId)` records a confirmed order to the Matomo
Tracking API (`matomo.php`, `idgoal=0`). It is invoked **fire-and-forget** from
`clearCartAfterPayment` (the gateway-agnostic success chokepoint) and:

- runs only after payment is verified and the order is committed;
- never throws into the payment path and is time-bounded — a slow/down Matomo
  cannot block, delay, or fail a payment (worst case: one missing data point);
- is **idempotent** via a Redis `SET NX` marker (`matomo:order-tracked:{id}`,
  30-day TTL). Refreshes, webhook retries, and repeated callbacks cannot
  double-record. If Redis is unavailable, tracking is **skipped** (a miss is
  safer than a duplicate);
- ties the order to the same opaque internal user id used client-side (`uid`),
  preserving cross-device attribution.

### Refunds & cancellations

Not auto-tracked yet. Options when needed:
- Refund: send a Matomo ecommerce order with the **same `ec_id`** and the reduced
  `revenue` (Matomo replaces the prior order for that id within the period), or
  record a refund via `Goals` reporting.
- Cancellation: the Strapi-truth revenue already excludes cancelled/fully-refunded
  orders (net settlement ≤ 0), so the authoritative dashboard figures stay correct
  regardless of Matomo. A follow-up could reconcile the Matomo ecommerce order.

## Capability matrix

| Capability | Status |
| ---------- | ------ |
| Visits summary, trend, referrers, pages, devices, countries | Core — implemented |
| Channel types, search engines, socials | Core — implemented now |
| Native Site Search (keywords + no-result) | Core — implemented now (frontend `trackSiteSearch` + report) |
| Browsers, OS families, languages, new-vs-returning | Core — implemented now |
| Previous-period comparison | Implemented now (computed server-side) |
| Server-side ecommerce orders | Implemented now |
| Custom dimensions (auth/page/product/category) | Implemented now (ids must be configured in Matomo admin) |
| Realtime (Live plugin) | Implemented |
| Funnels (multi-step), A/B testing, Form/Media Analytics | **Require optional/premium Matomo plugins** — detected & hidden if absent |

## Broader report integration

`getProductBehavioral(slug, range)` is a reusable, fully-graceful helper
(returns `null` on any error/unconfigured) used by `report.productDetail` to add
a `behavioral` block (pageviews / unique / avg time / bounce) for a product's
`/pdp/{slug}` page — clearly distinct from the transactional truth in the same
response. The same helper pattern can be extended to search, promotion,
category, and checkout-failure reports.
