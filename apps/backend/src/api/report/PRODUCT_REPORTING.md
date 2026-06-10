# Product Reporting — Metric Definitions

Authoritative reference for the super-admin product-intelligence workspace
(`/reports/products/*`). Every displayed metric is defined here, with its source,
included statuses, and known limitations. Implementation lives in
[`services/product-analytics.ts`](./services/product-analytics.ts) and
[`controllers/report.ts`](./controllers/report.ts).

## Sale definition (the base population)

An order counts as a **sale** when it has **net-positive successful settlement**.

```
paid_orders =
  orders o
  JOIN contracts c
  JOIN contract_transactions ct
  WHERE ct.status = 'Success'
  GROUP BY order
  settled_irr = SUM(CASE WHEN ct.type = 'Return' THEN -ct.amount ELSE ct.amount END)
  HAVING settled_irr > 0          -- excludes fully-refunded / cancelled
  refund_irr  = SUM(ct.amount) WHERE ct.type = 'Return' AND ct.status = 'Success'
```

Consequences:

- `Paying` orders (no successful transaction) are **excluded** — they may never settle.
- Fully-refunded / `Cancelled` orders net to `<= 0` and are **excluded**.
- Partial refunds keep the order (still net-positive) and reduce its metrics via `refund_irr`.
- Date window is applied to **`orders.date`** (the sale date), bucketed in the store timezone.

All product-money metrics are then computed from the **`order_items`** of these
paid orders, using the immutable snapshot fields (`ProductTitle`, `ProductSKU`,
`PerAmount`, `Count`) so renamed/deleted products still report correctly.

## Currency & timezone

- `order_items.PerAmount` and product prices are **Toman**.
- `contract_transactions.amount` is **IRR**; divide by 10 → Toman (`irrToToman`).
- Timestamps are stored UTC; trend buckets shift to `REPORT_TIMEZONE`
  (default `Asia/Tehran`) before `date_trunc` so Jalali day boundaries are correct.

## Metric matrix

| Metric | Formula | Source | Included / excluded | Refund/cancel | Limitations |
|---|---|---|---|---|---|
| Units sold | `Σ oi.Count` | order_items of paid_orders | paid only | net of fully-refunded orders | — |
| **Gross product sales** (Toman) | `Σ (oi.PerAmount × oi.Count)` | order_items | product lines only — **excludes shipping & tax** | gross (pre-refund) | — |
| Discounts (allocated) | `Σ order.AppliedDiscountAmount × lineGross / orderGross` | orders + order_items | paid only | — | order-level only; no per-item discount field → **pro-rated** |
| Refunds (allocated) | `Σ (refund_irr/10) × lineGross / orderGross` | contract_transactions `type='Return'`, `status='Success'` | paid only | this *is* the refund | refunds are order/contract-level → **pro-rated** to items |
| **Net product sales** | `Gross − allocDiscount − allocRefund` | derived | paid only | net | **estimate** (flagged “تخمینی”) due to pro-rating |
| Orders with product | `COUNT(DISTINCT order_id)` | order_items | paid only | — | — |
| Avg selling price | `Gross / Units` | derived | — | — | gross basis |
| AOV | `Gross / paid orders` | derived | — | — | product-gross basis (excludes shipping/tax) |
| Current stock / status | `product_stocks.Count`, `reserved_count` | product_variation → product_stock | live snapshot | n/a | deleted variations → `unknown` |
| In / Low / Out | `Count > T` / `0 < Count ≤ T` / `Count ≤ 0`; `T = REPORT_LOW_STOCK_THRESHOLD` (default 5) | product_stocks | active variations | n/a | threshold configurable |
| Days of cover | `Count ÷ (unitsSold ÷ windowDays)` | derived | — | n/a | estimate; `null`/∞ when no sales in window |
| Trend bucket | `date_trunc(grp, (orders.date AT TIME ZONE 'UTC') AT TIME ZONE tz)` | orders | paid only | net | day/week/month auto-chosen by range |

## Previous-period comparison

KPIs compare against the immediately-preceding equal-length window
(`previousPeriod`). Percentage change is **`null` when the baseline is 0**
(`periodDelta`) so the UI renders “—” instead of a misleading ∞ / 100%.

## Validation & safety

- Sort is restricted to an allow-list (`PERFORMANCE_SORT_COLUMNS`) — arbitrary
  columns are rejected, preventing SQL injection via `sort`.
- `pageSize` is clamped to `MAX_PAGE_SIZE` (100); export is hard-capped at 10,000 rows.
- Date ranges are normalized (swapped if reversed).
- All endpoints require `Superadmin` or `Store manager` (`ensureRoleAccess`).
- Strapi link-table / FK names are resolved from `information_schema` **once per
  process** (memoized), replacing the previous per-request schema probing.

## Data gaps — deliberately NOT shown

These cannot be computed reliably from currently-recorded data:

- **Profit / margin** — no cost-of-goods field exists on product or variation.
- **Per-product conversion rate** — only a site-wide Matomo funnel exists;
  `product.SeenCount` is cumulative (not time-bounded) and `product_views` is not
  yet aggregated here.
- **Per-product brand** — there is no brand entity (only `site-identity` branding);
  filtering/grouping is by **category** only.
- **Historical stock-on-a-past-date / inventory aging** — `product_stock_log`
  records movements but reliable point-in-time reconstruction is not implemented;
  slow/fast-moving is derived from **sales velocity** in the window instead.

To add any of these later: record unit cost on `product-variation`; aggregate
`product-view` per product per day; introduce a brand content-type.
