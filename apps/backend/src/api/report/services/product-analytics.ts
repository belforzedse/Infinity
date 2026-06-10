/**
 * Product analytics service.
 *
 * Centralises all product-reporting SQL building, schema (link-table) resolution,
 * and the pure metric helpers used by the report controller. Everything in here is
 * deliberately framework-light so the pure helpers can be unit-tested in isolation
 * and the query builders share a single, audited definition of a "paid sale".
 *
 * Sale definition (confirmed): an order counts when it has net-positive successful
 * settlement. We join orders -> contracts -> contract_transactions, keep only
 * `status = 'Success'`, treat `type = 'Return'` as a negative settlement, group by
 * order and require the net amount to be > 0. This naturally excludes `Paying`
 * (no success transaction) and fully-refunded / cancelled orders (net <= 0).
 *
 * Currency: order_item.PerAmount and product prices are stored in Toman.
 * contract_transactions.amount is stored in IRR; divide by 10 to convert to Toman.
 *
 * See PRODUCT_REPORTING.md for the authoritative metric matrix and known limitations.
 */

import { parsePositiveInt } from "../../../utils/parsePositiveInt";

export const REPORT_TIMEZONE = process.env.REPORT_TIMEZONE || "Asia/Tehran";
export const DEFAULT_LOW_STOCK_THRESHOLD = parsePositiveInt(
  process.env.REPORT_LOW_STOCK_THRESHOLD,
  5,
);
export const MAX_PAGE_SIZE = 100;

export type Grouping = "day" | "week" | "month";
export type StockStatus = "in" | "low" | "out";

// ---------------------------------------------------------------------------
// Pure helpers (no DB) — unit tested directly.
// ---------------------------------------------------------------------------

export interface Delta {
  current: number;
  previous: number;
  /** Absolute change (current - previous). */
  change: number;
  /**
   * Percentage change. `null` when the previous period is zero (an undefined
   * ratio) so the UI can render "—" instead of a misleading Infinity / 100%.
   */
  changePct: number | null;
}

/**
 * Compute the comparison between a current and previous period value.
 * Zero-period safe: percentage is null when the baseline is 0.
 */
export function periodDelta(current: number, previous: number): Delta {
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;
  const change = cur - prev;
  const changePct = prev === 0 ? null : Number(((change / prev) * 100).toFixed(2));
  return { current: cur, previous: prev, change, changePct };
}

/**
 * Pro-rate an order-level amount (discount or refund) onto a single line by its
 * share of the order's gross. Returns 0 when the order gross is non-positive so
 * we never divide by zero. Used for both discount and refund allocation; refunds
 * are order/contract-level only, so item attribution is necessarily an estimate.
 */
export function allocate(lineGross: number, orderGross: number, orderAmount: number): number {
  const lg = Number(lineGross) || 0;
  const og = Number(orderGross) || 0;
  const amt = Number(orderAmount) || 0;
  if (og <= 0 || lg <= 0 || amt === 0) return 0;
  return (amt * lg) / og;
}

/** Classify a current stock count into in/low/out using the configured threshold. */
export function classifyStock(
  count: number | null | undefined,
  threshold: number = DEFAULT_LOW_STOCK_THRESHOLD,
): StockStatus {
  const c = Number(count) || 0;
  if (c <= 0) return "out";
  if (c <= threshold) return "low";
  return "in";
}

/**
 * Estimate how many days of stock remain at the current sales velocity.
 * `null` means "no sales in window" (infinite cover) — the UI shows ∞ / "—".
 */
export function daysOfCover(
  currentStock: number | null | undefined,
  unitsSold: number,
  windowDays: number,
): number | null {
  const stock = Number(currentStock) || 0;
  const units = Number(unitsSold) || 0;
  if (units <= 0 || windowDays <= 0) return null;
  const perDay = units / windowDays;
  if (perDay <= 0) return null;
  return Number((stock / perDay).toFixed(1));
}

/** Inclusive day-count of a [start, end] window (never less than 1). */
export function windowDays(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

/**
 * Given a [start, end] window, return the immediately-preceding equal-length
 * window so KPI comparisons line up like-for-like.
 */
export function previousPeriod(start: Date, end: Date): { start: Date; end: Date } {
  const span = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime());
  const prevStart = new Date(start.getTime() - span);
  return { start: prevStart, end: prevEnd };
}

/** Pick a sensible bucket grouping for a window when the client asks for "auto". */
export function autoGrouping(start: Date, end: Date): Grouping {
  const days = windowDays(start, end);
  if (days <= 45) return "day";
  if (days <= 180) return "week";
  return "month";
}

export function normalizeGrouping(value: unknown, start: Date, end: Date): Grouping {
  const v = typeof value === "string" ? value.toLowerCase() : "";
  if (v === "day" || v === "week" || v === "month") return v;
  return autoGrouping(start, end);
}

/** Allow-list of sortable columns for the performance table (prevents SQL injection via sort). */
export const PERFORMANCE_SORT_COLUMNS: Record<string, string> = {
  units: "units",
  gross: "gross",
  net: "net",
  discounts: "discounts",
  refunds: "refunds",
  orders: "orders_count",
  avgPrice: "avg_price",
  stock: "current_stock",
  title: "product_title",
};

export function normalizeSort(
  sort: unknown,
): { column: string; direction: "asc" | "desc" } {
  let key = "gross";
  let dir: "asc" | "desc" = "desc";
  if (typeof sort === "string" && sort.length > 0) {
    const [rawKey, rawDir] = sort.split(":");
    if (rawKey && PERFORMANCE_SORT_COLUMNS[rawKey]) key = rawKey;
    if (rawDir && rawDir.toLowerCase() === "asc") dir = "asc";
    if (rawDir && rawDir.toLowerCase() === "desc") dir = "desc";
  }
  return { column: PERFORMANCE_SORT_COLUMNS[key], direction: dir };
}

export function clampPageSize(value: unknown, fallback = 25): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, MAX_PAGE_SIZE);
}

export function clampPage(value: unknown): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return 1;
  return n;
}

/** IRR (contract transaction amount) -> Toman. */
export function irrToToman(irr: number | null | undefined): number {
  return (Number(irr) || 0) / 10;
}

/** Shape a raw performance SQL row into the API payload (pure; unit-tested). */
export interface RawPerformanceRow {
  product_variation_id: number | null;
  product_id: number | null;
  product_title: string | null;
  product_sku: string | null;
  product_type: string | null;
  category_title: string | null;
  units: string | number | null;
  gross: string | number | null;
  discounts: string | number | null;
  refunds_irr: string | number | null;
  orders_count: string | number | null;
  current_stock: string | number | null;
  reserved_stock: string | number | null;
}

export interface ProductPerformanceRow {
  productVariationId: number | null;
  productId: number | null;
  productTitle: string;
  productSKU: string;
  productType: string | null;
  category: string | null;
  units: number;
  gross: number;
  discounts: number;
  refunds: number;
  net: number;
  ordersCount: number;
  avgPrice: number;
  currentStock: number | null;
  reservedStock: number | null;
  stockStatus: StockStatus | "unknown";
  imageUrl?: string | null;
}

export function serializeProductRow(
  row: RawPerformanceRow,
  threshold: number = DEFAULT_LOW_STOCK_THRESHOLD,
): ProductPerformanceRow {
  const units = Number(row.units) || 0;
  const gross = Number(row.gross) || 0;
  const discounts = Number(row.discounts) || 0;
  const refunds = irrToToman(Number(row.refunds_irr) || 0);
  const net = Math.max(0, Math.round(gross - discounts - refunds));
  const hasStock = row.current_stock !== null && row.current_stock !== undefined;
  const currentStock = hasStock ? Number(row.current_stock) || 0 : null;
  return {
    productVariationId: row.product_variation_id ?? null,
    productId: row.product_id ?? null,
    productTitle: row.product_title || "—",
    productSKU: row.product_sku || "—",
    productType: row.product_type ?? null,
    category: row.category_title ?? null,
    units,
    gross: Math.round(gross),
    discounts: Math.round(discounts),
    refunds: Math.round(refunds),
    net,
    ordersCount: Number(row.orders_count) || 0,
    avgPrice: units > 0 ? Math.round(gross / units) : 0,
    currentStock,
    reservedStock: hasStock ? Number(row.reserved_stock) || 0 : null,
    stockStatus: currentStock === null ? "unknown" : classifyStock(currentStock, threshold),
  };
}

// ---------------------------------------------------------------------------
// Schema resolution — resolve Strapi link tables ONCE per process.
//
// Strapi 4 link-table and FK-column names are deterministic but the column for a
// relation is named after the *target entity singular* (e.g. `performed_by` ->
// `user_id`), so we detect names from information_schema rather than hard-coding
// them. Detection runs once and is memoised; this replaces the previous
// per-request schema probing in the product-sales endpoint.
// ---------------------------------------------------------------------------

type Knex = any;

interface LinkTable {
  table: string;
  cols: Set<string>;
}

let cachedLinks: Promise<LinkTable[]> | null = null;

/** All Strapi `*_links` join tables with their columns, scanned once per process. */
async function getLinkTables(knex: Knex): Promise<LinkTable[]> {
  if (cachedLinks) return cachedLinks;
  cachedLinks = (async () => {
    const res = await knex.raw(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name LIKE '%_links'`,
    );
    const tables = (res.rows || res[0] || []).map((r: any) => String(r.table_name));
    const out: LinkTable[] = [];
    for (const table of tables) {
      out.push({ table, cols: await columns(knex, table) });
    }
    return out;
  })();
  return cachedLinks;
}

export interface ResolvedJoins {
  /** order_items oi -> orders o */
  oiToOrder: string;
  /** order_items oi -> product_variations pv ; plus the id expression to select. */
  oiToVariation: { join: string; idExpr: string };
  /** orders o -> contracts c */
  orderToContract: string;
  /** contracts c -> contract_transactions ct */
  contractToTx: string;
  /** product_variations pv -> products p */
  variationToProduct: string;
  /** product_variations pv -> product_stocks ps (LEFT) */
  variationToStock: string;
  /** products p -> product_categories pc (LEFT); category title expression. */
  productToCategory: { join: string; titleExpr: string };
}

let cachedJoins: Promise<ResolvedJoins> | null = null;

async function columns(knex: Knex, table: string): Promise<Set<string>> {
  const res = await knex.raw(
    `SELECT column_name FROM information_schema.columns WHERE table_name = ?`,
    [table],
  );
  return new Set((res.rows || res[0] || []).map((r: any) => String(r.column_name)));
}

async function hasColumn(knex: Knex, table: string, column: string): Promise<boolean> {
  return (await columns(knex, table)).has(column);
}

function pickColumn(cols: Set<string>, ...candidates: string[]): string | undefined {
  for (const c of candidates) if (cols.has(c)) return c;
  // suffix match fallback (e.g. some installs prefix link columns)
  for (const c of candidates) {
    for (const col of cols) if (col.endsWith(c)) return col;
  }
  return undefined;
}

/**
 * Resolve a relation that may be stored either as a Strapi link table or as a
 * direct FK column on the "owning" table. Returns a ready-to-embed JOIN clause
 * assuming the owner alias is already in scope.
 */
async function resolveRelation(
  knex: Knex,
  opts: {
    ownerIdCol: string; // column in link table pointing at owner (e.g. order_item_id)
    targetIdCol: string; // column in link table pointing at target (e.g. order_id)
    ownerAlias: string;
    ownerKey?: string; // owner PK expression (default `${ownerAlias}.id`)
    targetTable: string;
    targetAlias: string;
    directFkTable: string; // table to check for a direct FK
    directFkCandidates: string[]; // direct FK column candidates on directFkTable
    directFkOn: "owner" | "target"; // which side holds the direct FK
    join?: "JOIN" | "LEFT JOIN";
    /**
     * When several link tables carry the same FK column pair (e.g. main vs. other
     * categories both have product_id + product_category_id), prefer the table
     * whose name contains this substring.
     */
    preferName?: string;
  },
): Promise<string> {
  const joinType = opts.join || "JOIN";
  const ownerKey = opts.ownerKey || `${opts.ownerAlias}.id`;

  // Prefer a link table that carries BOTH required FK columns (order-agnostic).
  const links = await getLinkTables(knex);
  const candidates = links.filter(
    ({ cols }) => cols.has(opts.ownerIdCol) && cols.has(opts.targetIdCol),
  );
  const chosen =
    (opts.preferName && candidates.find((c) => c.table.includes(opts.preferName!))) ||
    candidates[0];
  if (chosen) {
    const lAlias = `l_${opts.targetAlias}`;
    return `${joinType} ${chosen.table} ${lAlias} ON ${lAlias}.${opts.ownerIdCol} = ${ownerKey} ${joinType} ${opts.targetTable} ${opts.targetAlias} ON ${opts.targetAlias}.id = ${lAlias}.${opts.targetIdCol}`;
  }

  // Fallback: direct FK column on the main table.
  const fkCols = await columns(knex, opts.directFkTable);
  const fk = pickColumn(fkCols, ...opts.directFkCandidates);
  if (fk) {
    if (opts.directFkOn === "owner") {
      return `${joinType} ${opts.targetTable} ${opts.targetAlias} ON ${opts.targetAlias}.id = ${opts.ownerAlias}.${fk}`;
    }
    return `${joinType} ${opts.targetTable} ${opts.targetAlias} ON ${opts.targetAlias}.${fk} = ${ownerKey}`;
  }
  throw new Error(`RELATION_NOT_FOUND: could not resolve relation for ${opts.targetTable}`);
}

export async function resolveJoins(knex: Knex): Promise<ResolvedJoins> {
  if (cachedJoins) return cachedJoins;
  cachedJoins = (async () => {
    const oiToOrder = await resolveRelation(knex, {
      ownerIdCol: "order_item_id",
      targetIdCol: "order_id",
      ownerAlias: "oi",
      targetTable: "orders",
      targetAlias: "o",
      directFkTable: "order_items",
      directFkCandidates: ["order_id", "order"],
      directFkOn: "owner",
    });

    // order_items -> product_variations (optional; deleted variations leave it null)
    let oiToVariation: { join: string; idExpr: string };
    try {
      const join = await resolveRelation(knex, {
        ownerIdCol: "order_item_id",
        targetIdCol: "product_variation_id",
        ownerAlias: "oi",
        targetTable: "product_variations",
        targetAlias: "pv",
        directFkTable: "order_items",
        directFkCandidates: ["product_variation_id"],
        directFkOn: "owner",
        join: "LEFT JOIN",
      });
      oiToVariation = { join, idExpr: "pv.id" };
    } catch {
      if (await hasColumn(knex, "order_items", "product_variation_id")) {
        oiToVariation = { join: "", idExpr: "oi.product_variation_id" };
      } else {
        oiToVariation = { join: "", idExpr: "NULL::int" };
      }
    }

    const orderToContract = await resolveRelation(knex, {
      ownerIdCol: "order_id",
      targetIdCol: "contract_id",
      ownerAlias: "o",
      targetTable: "contracts",
      targetAlias: "c",
      directFkTable: "contracts",
      directFkCandidates: ["order_id", "order"],
      directFkOn: "target",
    });

    const contractToTx = await resolveRelation(knex, {
      ownerIdCol: "contract_id",
      targetIdCol: "contract_transaction_id",
      ownerAlias: "c",
      targetTable: "contract_transactions",
      targetAlias: "ct",
      directFkTable: "contract_transactions",
      directFkCandidates: ["contract_id", "contract"],
      directFkOn: "target",
    });

    const variationToProduct = await resolveRelation(knex, {
      ownerIdCol: "product_variation_id",
      targetIdCol: "product_id",
      ownerAlias: "pv",
      targetTable: "products",
      targetAlias: "p",
      directFkTable: "product_variations",
      directFkCandidates: ["product_id", "product"],
      directFkOn: "owner",
    });

    let variationToStock = "";
    try {
      variationToStock = await resolveRelation(knex, {
        ownerIdCol: "product_variation_id",
        targetIdCol: "product_stock_id",
        ownerAlias: "pv",
        targetTable: "product_stocks",
        targetAlias: "ps",
        directFkTable: "product_stocks",
        directFkCandidates: ["product_variation_id"],
        directFkOn: "target",
        join: "LEFT JOIN",
      });
    } catch {
      variationToStock = "";
    }

    let productToCategory = { join: "", titleExpr: "NULL::text" };
    try {
      const join = await resolveRelation(knex, {
        ownerIdCol: "product_id",
        targetIdCol: "product_category_id",
        ownerAlias: "p",
        targetTable: "product_categories",
        targetAlias: "pc",
        directFkTable: "products",
        directFkCandidates: ["product_main_category_id"],
        directFkOn: "owner",
        join: "LEFT JOIN",
        preferName: "main",
      });
      productToCategory = { join, titleExpr: "pc.title" };
    } catch {
      productToCategory = { join: "", titleExpr: "NULL::text" };
    }

    return {
      oiToOrder,
      oiToVariation,
      orderToContract,
      contractToTx,
      variationToProduct,
      variationToStock,
      productToCategory,
    };
  })();
  return cachedJoins;
}

/** Test/maintenance helper to clear the memoised schema resolution. */
export function __resetJoinCache() {
  cachedJoins = null;
  cachedLinks = null;
}

// ---------------------------------------------------------------------------
// SQL fragments shared by every product query.
// ---------------------------------------------------------------------------

/**
 * The canonical "paid orders" CTE. Produces one row per qualifying order with:
 *   - order_date:  the order timestamp (UTC) for trend bucketing
 *   - order_discount: order-level applied discount (Toman)
 *   - settled_irr: net successful settlement in IRR (Returns subtracted)
 *   - refund_irr:  sum of successful Return transactions in IRR (>= 0)
 * Bindings: [start, end] on order date.
 */
export function paidOrdersCte(joins: ResolvedJoins): string {
  return `
    paid_orders AS (
      SELECT
        o.id AS order_id,
        o.date AS order_date,
        COALESCE(o.applied_discount_amount, 0) AS order_discount,
        SUM(CASE WHEN ct.type = 'Return' THEN -ct.amount ELSE ct.amount END)::numeric AS settled_irr,
        COALESCE(SUM(CASE WHEN ct.type = 'Return' THEN ct.amount ELSE 0 END), 0)::numeric AS refund_irr
      FROM orders o
      ${joins.orderToContract}
      ${joins.contractToTx}
      WHERE ct.status = 'Success'
        AND o.date BETWEEN ? AND ?
      GROUP BY o.id, o.date, o.applied_discount_amount
      HAVING SUM(CASE WHEN ct.type = 'Return' THEN -ct.amount ELSE ct.amount END) > 0
    )
  `;
}

/**
 * The per-line "itemized" CTE built on top of paid_orders. One row per order item
 * of a paid order, carrying the line gross plus the per-order gross (window sum)
 * so order-level discount/refund can be pro-rated to the line. Assumes a
 * `paid_orders` CTE is already declared in the same statement.
 */
export function itemizedCte(joins: ResolvedJoins): string {
  return `
    itemized AS (
      SELECT
        ${joins.oiToVariation.idExpr} AS product_variation_id,
        oi.product_title,
        oi.product_sku,
        oi.count AS cnt,
        (oi.per_amount * oi.count)::numeric AS line_gross,
        o.id AS order_id,
        po.order_date,
        po.order_discount,
        po.refund_irr,
        SUM((oi.per_amount * oi.count)::numeric) OVER (PARTITION BY o.id) AS order_gross
      FROM order_items oi
      ${joins.oiToOrder}
      ${joins.oiToVariation.join}
      JOIN paid_orders po ON po.order_id = o.id
    )
  `;
}

/**
 * Aggregate `itemized` to one row per variation (or per SKU when the variation
 * was deleted), with pro-rated discount and refund. Assumes `itemized` is declared.
 */
export function aggCte(): string {
  return `
    agg AS (
      SELECT
        product_variation_id,
        MAX(product_title) AS product_title,
        product_sku,
        SUM(cnt)::bigint AS units,
        SUM(line_gross)::numeric AS gross,
        COUNT(DISTINCT order_id)::bigint AS orders_count,
        SUM(CASE WHEN order_gross > 0 THEN order_discount * line_gross / order_gross ELSE 0 END)::numeric AS discounts,
        SUM(CASE WHEN order_gross > 0 THEN refund_irr * line_gross / order_gross ELSE 0 END)::numeric AS refunds_irr
      FROM itemized
      GROUP BY product_variation_id, product_sku
    )
  `;
}

/**
 * The enrichment SELECT that joins `agg` to current product / category / stock
 * data. Returns the SELECT + FROM/JOINs (no WHERE / ORDER / LIMIT) so callers can
 * append filters and paging. Columns line up with {@link RawPerformanceRow}.
 */
export function performanceCoreSelect(joins: ResolvedJoins): string {
  const variationToProductLeft = leftify(joins.variationToProduct);
  const hasCategory = Boolean(joins.productToCategory.join);
  const categoryIdExpr = hasCategory ? "pc.id" : "NULL::int";
  return `
    SELECT
      agg.product_variation_id,
      p.id AS product_id,
      agg.product_title,
      agg.product_sku,
      p.product_type,
      ${joins.productToCategory.titleExpr} AS category_title,
      ${categoryIdExpr} AS category_id,
      agg.units,
      agg.gross,
      agg.discounts,
      agg.refunds_irr,
      agg.orders_count,
      ps.count AS current_stock,
      ps.reserved_count AS reserved_stock
    FROM agg
    LEFT JOIN product_variations pv ON pv.id = agg.product_variation_id
    ${variationToProductLeft}
    ${joins.variationToStock}
    ${joins.productToCategory.join}
  `;
}

/** Turn an inner-JOIN fragment into LEFT JOINs (used where the left row may be null). */
function leftify(fragment: string): string {
  // Only safe for fragments that contain plain `JOIN` (no existing LEFT/RIGHT).
  return fragment.replace(/(^|\s)JOIN\s/g, "$1LEFT JOIN ");
}

/** date_trunc expression that buckets a UTC timestamp in the report timezone. */
export function tzBucketExpr(column: string, grouping: Grouping): string {
  // (col AT TIME ZONE 'UTC') reinterprets the stored timestamp as UTC, then
  // AT TIME ZONE tz shifts it to local wall-clock before truncating.
  return `date_trunc('${grouping}', (${column} AT TIME ZONE 'UTC') AT TIME ZONE '${REPORT_TIMEZONE}')`;
}
