/**
 * Report controller
 */

import type { RoleName } from "../../../utils/roles";
import { ROLE_NAMES, roleIsAllowed, fetchUserWithRole } from "../../../utils/roles";
import { parsePositiveInt } from "../../../utils/parsePositiveInt";
import {
  getMatomoRealtimePayload,
  getMatomoTrafficDashboardPayload,
  getProductBehavioral,
  normalizeRange,
} from "../services/matomo";
import * as productAnalytics from "../services/product-analytics";

type Interval = "day" | "week" | "month";

function isForceFresh(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

const TRAFFIC_DASHBOARD_CACHE_TTL_MS = parsePositiveInt(
  process.env.TRAFFIC_DASHBOARD_CACHE_TTL_MS,
  30_000,
);
const TRAFFIC_REALTIME_CACHE_TTL_MS = parsePositiveInt(
  process.env.TRAFFIC_REALTIME_CACHE_TTL_MS,
  10_000,
);
const trafficCache = new Map<string, { expiresAt: number; payload: any }>();

const PRODUCT_REPORT_ROLES: RoleName[] = [
  ROLE_NAMES.SUPERADMIN,
  ROLE_NAMES.STORE_MANAGER,
  ROLE_NAMES.FOUNDER,
];

const PRODUCT_REPORT_ACCESS_MESSAGE =
  "Access denied - Superadmin, Store manager or Founder role required";

function parseDate(value?: string, fallbackDays = 30): Date {
  if (!value) {
    const d = new Date();
    d.setDate(d.getDate() - fallbackDays);
    return d;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
}

async function ensureRoleAccess(ctx: any, allowedRoles: RoleName[], errorMessage: string) {
  const userId = ctx.state?.user?.id;
  const user = await fetchUserWithRole(strapi, userId);
  if (!user || !roleIsAllowed(user.role?.name, allowedRoles)) {
    ctx.forbidden(errorMessage);
    return null;
  }

  return user;
}

function getTrafficCacheKey(prefix: string, params: Record<string, string>) {
  const entries = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  return `${prefix}:${entries.map(([k, v]) => `${k}=${v}`).join("&")}`;
}

function getFromTrafficCache(key: string): any | null {
  const now = Date.now();
  const cached = trafficCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= now) {
    trafficCache.delete(key);
    return null;
  }
  return cached.payload;
}

function setTrafficCache(key: string, payload: any, ttlMs: number) {
  trafficCache.set(key, {
    expiresAt: Date.now() + ttlMs,
    payload,
  });
}

async function getOrderStats(start: Date, end: Date) {
  const knex = strapi.db.connection;

  // Strapi usually maps attributes to snake_case lower-case columns.
  try {
    const primaryRes = await knex.raw(
      `SELECT
         COUNT(*)::bigint AS total_orders,
         COUNT(*) FILTER (WHERE o.status = 'Done')::bigint AS paid_orders
       FROM orders o
       WHERE o.date BETWEEN ? AND ?`,
      [start, end],
    );
    const row = (primaryRes.rows || primaryRes[0] || [])[0] || {};
    return {
      totalOrders: Number(row.total_orders || 0),
      paidOrders: Number(row.paid_orders || 0),
    };
  } catch {
    // Some DBs may preserve legacy quoted column names.
    const fallbackRes = await knex.raw(
      `SELECT
         COUNT(*)::bigint AS total_orders,
         COUNT(*) FILTER (WHERE o."Status" = 'Done')::bigint AS paid_orders
       FROM orders o
       WHERE o."Date" BETWEEN ? AND ?`,
      [start, end],
    );
    const row = (fallbackRes.rows || fallbackRes[0] || [])[0] || {};
    return {
      totalOrders: Number(row.total_orders || 0),
      paidOrders: Number(row.paid_orders || 0),
    };
  }
}

async function getRevenueToman(start: Date, end: Date) {
  const knex = strapi.db.connection;
  const revenueRes = await knex.raw(
    `SELECT
       COALESCE(SUM(CASE WHEN ct.type = 'Return' THEN -ct.amount ELSE ct.amount END), 0)::bigint AS total_irr
     FROM contract_transactions ct
     WHERE ct.status = 'Success' AND ct.date BETWEEN ? AND ?`,
    [start, end],
  );
  const row = (revenueRes.rows || revenueRes[0] || [])[0] || {};
  return Number(row.total_irr || 0) / 10;
}

// ---------------------------------------------------------------------------
// Product reporting helpers (shared by the new /reports/products/* endpoints).
// ---------------------------------------------------------------------------

const PA = productAnalytics;

/** Parse and validate a [start, end] window from the query string. */
function parseProductRange(ctx: any): { start: Date; end: Date } {
  const start = parseDate(ctx.query.start as string);
  const end = parseDate(ctx.query.end as string, 0);
  if (start.getTime() > end.getTime()) {
    return { start: end, end: start };
  }
  return { start, end };
}

const rowsOf = (res: any): any[] => res?.rows || res?.[0] || [];

/** Run the period scalar query and shape it into Toman-denominated KPI values. */
async function computeProductPeriod(
  knex: any,
  joins: productAnalytics.ResolvedJoins,
  start: Date,
  end: Date,
) {
  const sql = `
    WITH ${PA.paidOrdersCte(joins)}, ${PA.itemizedCte(joins)}
    SELECT
      COALESCE((SELECT SUM(line_gross) FROM itemized), 0)::numeric AS gross,
      COALESCE((SELECT SUM(cnt) FROM itemized), 0)::bigint AS units,
      (SELECT COUNT(*) FROM paid_orders)::bigint AS orders_count,
      COALESCE((SELECT SUM(order_discount) FROM paid_orders), 0)::numeric AS discounts,
      COALESCE((SELECT SUM(refund_irr) FROM paid_orders), 0)::numeric AS refund_irr
  `;
  const res = await knex.raw(sql, [start, end]);
  const row = rowsOf(res)[0] || {};
  const gross = Number(row.gross) || 0;
  const units = Number(row.units) || 0;
  const orders = Number(row.orders_count) || 0;
  const discounts = Number(row.discounts) || 0;
  const refunds = PA.irrToToman(Number(row.refund_irr) || 0);
  const net = gross - discounts - refunds;
  return {
    gross,
    units,
    orders,
    discounts,
    refunds,
    net,
    avgPrice: units > 0 ? gross / units : 0,
    aov: orders > 0 ? gross / orders : 0,
  };
}

/** Attach cover-image URLs to performance rows (one query for the visible page). */
async function attachCoverImages(rows: productAnalytics.ProductPerformanceRow[]) {
  const ids = Array.from(new Set(rows.map((r) => r.productId).filter((id): id is number => !!id)));
  if (ids.length === 0) return rows;
  try {
    const products = (await strapi.entityService.findMany("api::product.product" as any, {
      filters: { id: { $in: ids } },
      fields: ["id"],
      populate: { CoverImage: { fields: ["url"] } },
    })) as any[];
    const imageById = new Map<number, string | null>();
    for (const p of products) imageById.set(p.id, p?.CoverImage?.url ?? null);
    for (const r of rows) {
      if (r.productId) r.imageUrl = imageById.get(r.productId) ?? null;
    }
  } catch (err) {
    strapi.log.warn("attachCoverImages failed", { error: (err as Error).message });
  }
  return rows;
}

export default {
  async liquidity(ctx) {
    try {
      const user = await ensureRoleAccess(
        ctx,
        [ROLE_NAMES.SUPERADMIN, ROLE_NAMES.STORE_MANAGER],
        "Access denied - Superadmin or Store manager role required",
      );
      if (!user) return;

      const start = parseDate(ctx.query.start as string);
      const end = parseDate(ctx.query.end as string, 0);
      const interval = (ctx.query.interval as Interval) || "day";

      const allowed: Interval[] = ["day", "week", "month"];
      const bucket = allowed.includes(interval) ? interval : "day";

      const knex = strapi.db.connection;

      const seriesQuery = `
        SELECT date_trunc(?, ct.date) AS bucket,
               SUM(CASE WHEN ct.type = 'Return' THEN -ct.amount ELSE ct.amount END) AS total
        FROM contract_transactions ct
        WHERE ct.status = 'Success' AND ct.date BETWEEN ? AND ?
        GROUP BY 1
        ORDER BY 1
      `;

      const totalQuery = `
        SELECT COALESCE(SUM(CASE WHEN ct.type = 'Return' THEN -ct.amount ELSE ct.amount END), 0) AS total
        FROM contract_transactions ct
        WHERE ct.status = 'Success' AND ct.date BETWEEN ? AND ?
      `;

      const [seriesRes, totalRes] = await Promise.all([
        knex.raw(seriesQuery, [bucket, start, end]),
        knex.raw(totalQuery, [start, end]),
      ]);

      const seriesRows = seriesRes.rows || seriesRes[0];
      const totalRow = (totalRes.rows || totalRes[0])[0];

      ctx.body = {
        data: {
          interval: bucket,
          start,
          end,
          total: Number(totalRow?.total || 0),
          series: (seriesRows || []).map((r: any) => ({
            bucket: r.bucket,
            total: Number(r.total || 0),
          })),
        },
      };
    } catch (error) {
      ctx.badRequest(error.message, { data: { success: false } });
    }
  },

  async productSales(ctx) {
    try {
      const user = await ensureRoleAccess(
        ctx,
        [ROLE_NAMES.SUPERADMIN, ROLE_NAMES.STORE_MANAGER, ROLE_NAMES.FOUNDER],
        "Access denied - Superadmin, Store manager or Founder role required",
      );
      if (!user) return;

      const start = parseDate(ctx.query.start as string);
      const end = parseDate(ctx.query.end as string, 0);

      const knex = strapi.db.connection;

      // orders <-> order_items link table (must contain both order_id and order_item_id)
      let ordersItemsJoinSql: string | null = null;
      let ordersItemsLink: string | undefined;
      const ordersItemsLinksRes = await knex.raw(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name LIKE '%order%item%links%'`,
      );
      const ordersItemsLinks = ordersItemsLinksRes.rows || ordersItemsLinksRes[0] || [];
      for (const row of ordersItemsLinks) {
        const t = String(row.table_name);
        const colsRes = await knex.raw(
          `SELECT column_name FROM information_schema.columns WHERE table_name = ?`,
          [t],
        );
        const cols = new Set(
          (colsRes.rows || colsRes[0] || []).map((r: any) => String(r.column_name)),
        );
        if (cols.has("order_id") && cols.has("order_item_id")) {
          ordersItemsLink = t;
          break;
        }
      }
      if (ordersItemsLink) {
        ordersItemsJoinSql = `
          FROM order_items oi
          JOIN ${ordersItemsLink} l_oi ON l_oi.order_item_id = oi.id
          JOIN orders o ON o.id = l_oi.order_id
        `;
      } else {
        // Fallback to direct FK on order_items (order_id or "order")
        const fkCheck = await knex.raw(
          `SELECT column_name FROM information_schema.columns WHERE table_name = 'order_items' AND column_name IN ('order_id','order')`,
        );
        const fkRows = fkCheck.rows || fkCheck[0] || [];
        const fkName = fkRows.find((r: any) => r.column_name === "order_id")
          ? "order_id"
          : fkRows.find((r: any) => r.column_name === "order")
            ? '"order"'
            : "order_id";
        ordersItemsJoinSql = `
          FROM order_items oi
          JOIN orders o ON o.id = oi.${fkName}
        `;
      }

      // order_items <-> product_variations link (optional)
      let productVariationJoinSql = "";
      let selectProductVariationId = "NULL AS product_variation_id";
      const oiPvLinksRes = await knex.raw(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name LIKE '%order%item%product%variation%links%'`,
      );
      const oiPvLinks = oiPvLinksRes.rows || oiPvLinksRes[0] || [];
      let oiPvLink: string | undefined;
      for (const row of oiPvLinks) {
        const t = String(row.table_name);
        const colsRes = await knex.raw(
          `SELECT column_name FROM information_schema.columns WHERE table_name = ?`,
          [t],
        );
        const cols = new Set(
          (colsRes.rows || colsRes[0] || []).map((r: any) => String(r.column_name)),
        );
        if (cols.has("order_item_id") && cols.has("product_variation_id")) {
          oiPvLink = t;
          break;
        }
      }
      if (oiPvLink) {
        productVariationJoinSql = `
          LEFT JOIN ${oiPvLink} piv ON piv.order_item_id = oi.id
          LEFT JOIN product_variations pv ON pv.id = piv.product_variation_id
        `;
        selectProductVariationId = "pv.id AS product_variation_id";
      } else {
        // Fallback to direct FK if present
        const hasPvColRes = await knex.raw(
          `SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_variation_id'`,
        );
        const hasPvCol = (hasPvColRes.rows || hasPvColRes[0] || []).length > 0;
        if (hasPvCol) {
          selectProductVariationId = "oi.product_variation_id AS product_variation_id";
        }
      }

      const detectJoin = async () => {
        const tryLinkTable = async () => {
          const linkRes = await knex.raw(
            `SELECT table_name FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name LIKE '%order%contract%links%'`,
          );
          const linkTables = linkRes.rows || linkRes[0] || [];
          for (const row of linkTables) {
            const tableName = String(row.table_name);
            const colsRes = await knex.raw(
              `SELECT column_name FROM information_schema.columns WHERE table_name = ?`,
              [tableName],
            );
            const cols = (colsRes.rows || colsRes[0] || []).map((r: any) => String(r.column_name));
            const orderFk =
              cols.find((c: string) => c === "order_id") ||
              cols.find((c: string) => c.endsWith("order_id")) ||
              cols.find((c: string) => c.startsWith("order") && c.endsWith("_id"));
            const contractFk =
              cols.find((c: string) => c === "contract_id") ||
              cols.find((c: string) => c.endsWith("contract_id")) ||
              cols.find((c: string) => c.startsWith("contract") && c.endsWith("_id"));

            if (orderFk && contractFk) {
              return `
                JOIN ${tableName} col ON col.${orderFk} = o.id
                JOIN contracts c ON c.id = col.${contractFk}
              `;
            }
          }
          return null;
        };

        const tryDirectFk = async () => {
          const contractOrderFkRes = await knex.raw(
            `SELECT column_name FROM information_schema.columns WHERE table_name = 'contracts'`,
          );
          const cols = (contractOrderFkRes.rows || contractOrderFkRes[0] || []).map((r: any) =>
            String(r.column_name),
          );
          const orderFkColumn =
            cols.find((c) => c === "order_id") ||
            cols.find((c) => c === "order") ||
            cols.find((c) => c.endsWith("order_id"));
          if (orderFkColumn) {
            return `JOIN contracts c ON c.${orderFkColumn} = o.id`;
          }
          return null;
        };

        const viaLink = await tryLinkTable();
        if (viaLink) {
          return { join: viaLink, source: "link" };
        }
        const viaDirect = await tryDirectFk();
        if (viaDirect) {
          return { join: viaDirect, source: "direct" };
        }
        throw new Error(
          "CONTRACT_RELATION_NOT_FOUND: Unable to resolve order-contract relation for reports",
        );
      };

      const { join: paidOrdersContractJoin, source: contractJoinSource } = await detectJoin();

      const detectContractTxJoin = async () => {
        const contractTxFkRes = await knex.raw(
          `SELECT column_name FROM information_schema.columns WHERE table_name = 'contract_transactions'`,
        );
        const contractTxColumns = (contractTxFkRes.rows || contractTxFkRes[0] || []).map((r: any) =>
          String(r.column_name),
        );

        const directFk =
          contractTxColumns.find((c) => c === "contract_id") ||
          contractTxColumns.find((c) => c === "contract") ||
          contractTxColumns.find((c) => c.startsWith("contract") && c.endsWith("_id"));
        if (directFk) {
          return {
            join: `JOIN contract_transactions ct ON ct.${directFk} = c.id`,
            source: "direct",
          };
        }

        const linkRes = await knex.raw(
          `SELECT table_name FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name LIKE '%contract%transaction%links%'`,
        );
        const linkTables = linkRes.rows || linkRes[0] || [];
        for (const row of linkTables) {
          const tableName = String(row.table_name);
          const colsRes = await knex.raw(
            `SELECT column_name FROM information_schema.columns WHERE table_name = ?`,
            [tableName],
          );
          const cols = (colsRes.rows || colsRes[0] || []).map((r: any) => String(r.column_name));
          const contractFk =
            cols.find((c: string) => c === "contract_id") ||
            cols.find((c: string) => c.endsWith("contract_id")) ||
            cols.find((c: string) => c.startsWith("contract") && c.endsWith("_id"));
          const txFk =
            cols.find((c: string) => c === "contract_transaction_id") ||
            cols.find((c: string) => c.endsWith("contract_transaction_id")) ||
            cols.find((c: string) => c === "transaction_id") ||
            cols.find((c: string) => c.startsWith("contract_transaction") && c.endsWith("_id"));
          if (contractFk && txFk) {
            return {
              join: `
                JOIN ${tableName} lct ON lct.${contractFk} = c.id
                JOIN contract_transactions ct ON ct.id = lct.${txFk}
              `,
              source: "link",
            };
          }
        }

        throw new Error(
          "CONTRACT_TRANSACTION_RELATION_NOT_FOUND: Unable to link contracts to contract_transactions",
        );
      };

      const { join: contractTransactionsJoin, source: contractTransactionsJoinSource } =
        await detectContractTxJoin();

      const paidOrdersCte = `
        WITH paid_orders AS (
          SELECT
            o.id AS order_id,
            SUM(
              CASE WHEN ct.type = 'Return' THEN -ct.amount ELSE ct.amount END
            )::numeric AS settled_amount_irr
          FROM orders o
          ${paidOrdersContractJoin}
          ${contractTransactionsJoin}
          WHERE ct.status = 'Success'
            AND o.date BETWEEN ? AND ?
          GROUP BY o.id
          HAVING SUM(
            CASE WHEN ct.type = 'Return' THEN -ct.amount ELSE ct.amount END
          ) > 0
        )
      `;

      const query = `
        ${paidOrdersCte},
        itemized AS (
          SELECT
            ${selectProductVariationId},
            oi.product_title,
            oi.product_sku,
            oi.count AS item_count,
            oi.per_amount AS item_unit_amount,
            (oi.per_amount * oi.count)::numeric AS item_total_toman,
            o.id AS order_id,
            po.settled_amount_irr,
            SUM((oi.per_amount * oi.count)::numeric) OVER (PARTITION BY o.id) AS order_items_subtotal
          ${ordersItemsJoinSql}
          ${productVariationJoinSql}
          JOIN paid_orders po ON po.order_id = o.id
          WHERE o.date BETWEEN ? AND ?
        )
        SELECT
          product_variation_id,
          product_title,
          product_sku,
          SUM(item_count)::bigint AS total_count,
          ROUND(
            SUM(
              CASE
                WHEN settled_amount_irr IS NULL
                  OR settled_amount_irr <= 0
                  OR order_items_subtotal IS NULL
                  OR order_items_subtotal <= 0
                THEN item_total_toman
                ELSE (settled_amount_irr / 10.0) * (item_total_toman / order_items_subtotal)
              END
            )
          )::bigint AS total_revenue
        FROM itemized
        GROUP BY product_variation_id, product_title, product_sku
        ORDER BY total_revenue DESC
      `;

      const res = await knex.raw(query, [start, end, start, end]);
      const rows = res.rows || res[0];

      const payload = rows.map((r: any) => ({
        productVariationId: r.product_variation_id,
        productTitle: r.product_title,
        productSKU: r.product_sku,
        totalCount: Number(r.total_count || 0),
        totalRevenue: Number(r.total_revenue || 0),
      }));

      // Optional diagnostics
      const wantsDebug =
        String(ctx.query.debug || "").toLowerCase() === "true" ||
        String(ctx.query.debug || "") === "1";
      if (wantsDebug) {
        // Orders in range
        const [ordersCountRes, joinCountRes, settledMetaRes] = await Promise.all([
          knex.raw(`SELECT COUNT(*)::bigint AS c FROM orders o WHERE o.date BETWEEN ? AND ?`, [
            start,
            end,
          ]),
          knex.raw(
            `SELECT COUNT(*)::bigint AS c ${ordersItemsJoinSql} WHERE o.date BETWEEN ? AND ?`,
            [start, end],
          ),
          knex.raw(
            `${paidOrdersCte}
               SELECT COUNT(*)::bigint AS orders, COALESCE(SUM(settled_amount_irr)::bigint, 0) AS total_amount_irr
               FROM paid_orders`,
            [start, end],
          ),
        ]);

        const ordersCount = Number((ordersCountRes.rows || ordersCountRes[0])[0]?.c || 0);
        const joinCount = Number((joinCountRes.rows || joinCountRes[0])[0]?.c || 0);
        const settledMetaRow = (settledMetaRes.rows || settledMetaRes[0])[0] || {};
        const settledOrders = Number(settledMetaRow.orders || 0);
        const totalSettledIrr = Number(settledMetaRow.total_amount_irr || 0);

        ctx.body = {
          data: payload,
          debug: {
            start,
            end,
            ordersInRange: ordersCount,
            orderItemsJoinedCount: joinCount,
            settledOrders,
            settlementCoverage: ordersCount > 0 ? settledOrders / ordersCount : 0,
            settledAmountToman: totalSettledIrr / 10,
            joinSource: contractJoinSource,
            contractTransactionsJoinSource,
          },
        };
        return;
      }

      ctx.body = { data: payload };
    } catch (error) {
      ctx.badRequest(error.message, { data: { success: false } });
    }
  },

  async gatewayLiquidity(ctx) {
    try {
      const user = await ensureRoleAccess(
        ctx,
        [ROLE_NAMES.SUPERADMIN, ROLE_NAMES.STORE_MANAGER],
        "Access denied - Superadmin or Store manager role required",
      );
      if (!user) return;

      const start = parseDate(ctx.query.start as string);
      const end = parseDate(ctx.query.end as string, 0);

      const knex = strapi.db.connection;

      // Join contract_transactions to payment_gateways via link table if present
      let txGatewayJoin = `LEFT JOIN payment_gateways pg ON ct.payment_gateway_id = pg.id`;
      const txGwLinkRes = await knex.raw(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name LIKE '%contract%transaction%payment%gateway%links%'`,
      );
      const txGwLinks = txGwLinkRes.rows || txGwLinkRes[0] || [];
      if (Array.isArray(txGwLinks) && txGwLinks.length > 0) {
        const link = String(txGwLinks[0].table_name);
        const colsRes = await knex.raw(
          `SELECT column_name FROM information_schema.columns WHERE table_name = ?`,
          [link],
        );
        const cols = (colsRes.rows || colsRes[0] || []).map((r: any) => String(r.column_name));
        const contractTxFk =
          cols.find((c: string) => c === "contract_transaction_id") ||
          cols.find((c: string) => c.endsWith("contract_transaction_id")) ||
          cols.find((c: string) => c.startsWith("contract_transaction") && c.endsWith("_id")) ||
          "contract_transaction_id";
        const gatewayFk =
          cols.find((c: string) => c === "payment_gateway_id") ||
          cols.find((c: string) => c.endsWith("payment_gateway_id")) ||
          cols.find((c: string) => c.startsWith("payment_gateway") && c.endsWith("_id")) ||
          "payment_gateway_id";

        txGatewayJoin = `
          JOIN ${link} l ON l.${contractTxFk} = ct.id
          JOIN payment_gateways pg ON pg.id = l.${gatewayFk}
        `;
      }

      const query = `
        SELECT pg.id AS gateway_id,
               COALESCE(pg.title, 'Unknown') AS title,
               SUM(CASE WHEN ct.type = 'Return' THEN -ct.amount ELSE ct.amount END)::bigint AS total
        FROM contract_transactions ct
        ${txGatewayJoin}
        WHERE ct.status = 'Success' AND ct.date BETWEEN ? AND ?
        GROUP BY pg.id, pg.title
        ORDER BY total DESC
      `;

      const res = await knex.raw(query, [start, end]);
      const rows = res.rows || res[0];

      ctx.body = {
        data: rows.map((r: any) => ({
          gatewayId: r.gateway_id,
          gatewayTitle: r.title,
          total: Number(r.total || 0),
        })),
      };
    } catch (error) {
      ctx.badRequest(error.message, { data: { success: false } });
    }
  },

  async trafficDashboard(ctx) {
    try {
      const user = await ensureRoleAccess(
        ctx,
        [ROLE_NAMES.SUPERADMIN],
        "Access denied - Superadmin role required",
      );
      if (!user) return;

      const normalizedRange = normalizeRange(
        (ctx.query.startDate as string) || (ctx.query.start as string),
        (ctx.query.endDate as string) || (ctx.query.end as string),
      );
      const forceFresh = isForceFresh(ctx.query.fresh);

      const cacheKey = getTrafficCacheKey("dashboard", normalizedRange);
      if (!forceFresh) {
        const cached = getFromTrafficCache(cacheKey);
        if (cached) {
          ctx.body = { data: cached };
          return;
        }
      }

      const startDate = new Date(normalizedRange.startDate);
      const endDate = new Date(normalizedRange.endDate);
      const [matomoPayload, orderStats, revenueToman] = await Promise.all([
        getMatomoTrafficDashboardPayload(normalizedRange),
        getOrderStats(startDate, endDate),
        getRevenueToman(startDate, endDate),
      ]);

      const conversionRate =
        matomoPayload.summary.visits > 0
          ? Number(((orderStats.paidOrders / matomoPayload.summary.visits) * 100).toFixed(2))
          : 0;

      const payload = {
        ...matomoPayload,
        ecommerce: {
          orders: orderStats.paidOrders,
          totalOrders: orderStats.totalOrders,
          revenue: revenueToman,
          conversionRate,
        },
        updatedAt: new Date().toISOString(),
      };

      setTrafficCache(cacheKey, payload, TRAFFIC_DASHBOARD_CACHE_TTL_MS);
      ctx.body = { data: payload };
    } catch (error: any) {
      if (error?.message === "INVALID_DATE_RANGE") {
        ctx.badRequest("Invalid date range", { data: { success: false } });
        return;
      }
      ctx.badRequest(error.message, { data: { success: false } });
    }
  },

  async trafficRealtime(ctx) {
    try {
      const user = await ensureRoleAccess(
        ctx,
        [ROLE_NAMES.SUPERADMIN],
        "Access denied - Superadmin role required",
      );
      if (!user) return;

      const forceFresh = isForceFresh(ctx.query.fresh);
      const cacheKey = "realtime";
      if (!forceFresh) {
        const cached = getFromTrafficCache(cacheKey);
        if (cached) {
          ctx.body = { data: cached };
          return;
        }
      }

      const realtime = await getMatomoRealtimePayload();
      const payload = {
        ...realtime,
        updatedAt: new Date().toISOString(),
      };

      setTrafficCache(cacheKey, payload, TRAFFIC_REALTIME_CACHE_TTL_MS);
      ctx.body = { data: payload };
    } catch (error: any) {
      ctx.badRequest(error.message, { data: { success: false } });
    }
  },

  async adminActivity(ctx) {
    try {
      const user = await ensureRoleAccess(
        ctx,
        [ROLE_NAMES.SUPERADMIN],
        "Access denied - Superadmin role required",
      );
      if (!user) return;

      const start = parseDate(ctx.query.start as string);
      const end = parseDate(ctx.query.end as string, 0);
      const actionType = (ctx.query.action_type as string) || "";
      const logType = (ctx.query.log_type as string) || "All";
      const page = Math.max(Number(ctx.query.page || 1), 1);
      const pageSize = Math.max(Number(ctx.query.pageSize || 20), 1);

      const filters: any = {
        createdAt: {
          $gte: start.toISOString(),
          $lte: end.toISOString(),
        },
      };

      if (logType && logType !== "All") {
        filters.ResourceType = logType;
      }

      if (actionType) {
        filters.Action = actionType;
      }

      if (ctx.query.performedBy) {
        filters.performed_by = { id: Number(ctx.query.performedBy) };
      }

      // Defense-in-depth: although writes are now gated to management roles, keep the role filter
      // so any legacy/non-admin rows are excluded from the report.
      const allowedRoles = [ROLE_NAMES.SUPERADMIN, ROLE_NAMES.STORE_MANAGER, ROLE_NAMES.EDITOR];
      filters.PerformedByRole = { $in: allowedRoles };

      const manualActivities = await strapi.entityService.findMany(
        "api::manual-admin-activity.manual-admin-activity" as any,
        {
          filters,
          sort: { createdAt: "desc" },
          populate: ["performed_by"],
          pagination: {
            page,
            pageSize,
          },
        },
      );

      const totalCount = await strapi.entityService.count(
        "api::manual-admin-activity.manual-admin-activity" as any,
        { filters },
      );

      const data = (Array.isArray(manualActivities) ? manualActivities : []).map((log: any) => {
        const actor = log.performed_by;
        return {
          id: log.id,
          ResourceType: log.ResourceType || "Admin",
          Action: log.Action,
          Title: log.Title,
          Message: log.Message,
          MessageEn: log.MessageEn,
          Severity: log.Severity,
          Changes: log.Changes,
          PerformedByName:
            log.PerformedByName ||
            actor?.username ||
            actor?.email ||
            actor?.phone ||
            (actor?.id ? `User ${actor.id}` : "System"),
          PerformedByRole:
            log.PerformedByRole || actor?.role?.name || (actor ? "Unknown" : "System"),
          Description: log.Description,
          Metadata: log.Metadata,
          IP: log.IP,
          UserAgent: log.UserAgent,
          ResourceId: log.ResourceId,
          createdAt: log.createdAt,
          updatedAt: log.updatedAt,
          performed_by: actor,
        };
      });

      // Distinct admins who have activity in the date range, so the frontend admin filter lists
      // every admin (not just those on the current page) and can key options by user id.
      let admins: Array<{ id: number | null; name: string; role: string | null }> = [];
      try {
        const knex = strapi.db.connection;
        const linkTable = "manual_admin_activities_performed_by_links";
        const hasLink = await knex.schema.hasTable(linkTable);
        if (hasLink) {
          const rows = await knex("manual_admin_activities as m")
            .leftJoin(`${linkTable} as l`, "l.manual_admin_activity_id", "m.id")
            .whereBetween("m.created_at", [start.toISOString(), end.toISOString()])
            .whereIn("m.performed_by_role", allowedRoles)
            .distinct(
              "l.user_id as id",
              "m.performed_by_name as name",
              "m.performed_by_role as role",
            );
          const seen = new Set<string>();
          for (const r of rows as any[]) {
            const key = r.id != null ? `id:${r.id}` : `name:${r.name}`;
            if (!r.id && !r.name) continue;
            if (seen.has(key)) continue;
            seen.add(key);
            admins.push({
              id: r.id ?? null,
              name: r.name || (r.id ? `User ${r.id}` : "نامشخص"),
              role: r.role ?? null,
            });
          }
          admins.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        }
      } catch (adminsError) {
        strapi.log.warn("Failed to load distinct admins for activity report", {
          error: (adminsError as Error).message,
        });
      }

      ctx.body = {
        data,
        meta: {
          pagination: {
            page,
            pageSize,
            total: totalCount,
            pageCount: Math.ceil(totalCount / pageSize) || 1,
          },
          admins,
        },
      };
    } catch (error) {
      ctx.badRequest(error.message, { data: { success: false } });
    }
  },

  async adminActivityById(ctx) {
    try {
      const user = await ensureRoleAccess(
        ctx,
        [ROLE_NAMES.SUPERADMIN],
        "Access denied - Superadmin role required",
      );
      if (!user) return;

      const id = Number(ctx.params.id);
      if (!id || Number.isNaN(id)) {
        return ctx.badRequest("Invalid id", { data: { success: false } });
      }

      const log = (await strapi.entityService.findOne(
        "api::manual-admin-activity.manual-admin-activity" as any,
        id,
        { populate: ["performed_by"] },
      )) as any;

      if (!log) {
        return ctx.notFound("Activity not found", { data: { success: false } });
      }

      const actor = log.performed_by;
      ctx.body = {
        data: {
          id: log.id,
          ResourceType: log.ResourceType || "Admin",
          Action: log.Action,
          Title: log.Title,
          Message: log.Message,
          MessageEn: log.MessageEn,
          Severity: log.Severity,
          Changes: log.Changes,
          PerformedByName:
            log.PerformedByName ||
            actor?.username ||
            actor?.email ||
            actor?.phone ||
            (actor?.id ? `User ${actor.id}` : "System"),
          PerformedByRole:
            log.PerformedByRole || actor?.role?.name || (actor ? "Unknown" : "System"),
          Description: log.Description,
          Metadata: log.Metadata,
          IP: log.IP,
          UserAgent: log.UserAgent,
          ResourceId: log.ResourceId,
          createdAt: log.createdAt,
          updatedAt: log.updatedAt,
          performed_by: actor,
        },
      };
    } catch (error) {
      ctx.badRequest(error.message, { data: { success: false } });
    }
  },

  // -------------------------------------------------------------------------
  // Product intelligence workspace (server-side aggregation).
  // -------------------------------------------------------------------------

  async productOverview(ctx) {
    try {
      const user = await ensureRoleAccess(ctx, PRODUCT_REPORT_ROLES, PRODUCT_REPORT_ACCESS_MESSAGE);
      if (!user) return;

      const { start, end } = parseProductRange(ctx);
      const prev = PA.previousPeriod(start, end);
      const threshold = PA.DEFAULT_LOW_STOCK_THRESHOLD;
      const knex = strapi.db.connection;
      const joins = await PA.resolveJoins(knex);

      const [current, previous, invRes] = await Promise.all([
        computeProductPeriod(knex, joins, start, end),
        computeProductPeriod(knex, joins, prev.start, prev.end),
        knex.raw(
          `SELECT
             (SELECT COUNT(*) FROM products p WHERE p.status = 'Active' AND p.removed_at IS NULL)::bigint AS active_products,
             COUNT(*) FILTER (WHERE cnt > ${threshold})::bigint AS in_stock,
             COUNT(*) FILTER (WHERE cnt > 0 AND cnt <= ${threshold})::bigint AS low_stock,
             COUNT(*) FILTER (WHERE cnt <= 0)::bigint AS out_stock,
             COUNT(*)::bigint AS total_variations
           FROM (
             SELECT pv.id, COALESCE(ps.count, 0) AS cnt
             FROM product_variations pv
             ${joins.variationToStock}
           ) sv`,
        ),
      ]);

      const inv = rowsOf(invRes)[0] || {};
      const kpi = (key: keyof typeof current) =>
        PA.periodDelta((current as any)[key], (previous as any)[key]);

      ctx.body = {
        data: {
          range: { start, end },
          previous: { start: prev.start, end: prev.end },
          timezone: PA.REPORT_TIMEZONE,
          lowStockThreshold: threshold,
          kpis: {
            gross: kpi("gross"),
            net: kpi("net"),
            units: kpi("units"),
            orders: kpi("orders"),
            avgPrice: kpi("avgPrice"),
            aov: kpi("aov"),
            discounts: kpi("discounts"),
            refunds: kpi("refunds"),
          },
          inventory: {
            activeProducts: Number(inv.active_products || 0),
            inStock: Number(inv.in_stock || 0),
            lowStock: Number(inv.low_stock || 0),
            outStock: Number(inv.out_stock || 0),
            totalVariations: Number(inv.total_variations || 0),
          },
          notes: {
            currency: "Toman",
            net: "خالص فروش تخمینی است: تخفیف سفارش و مرجوعی به نسبت سهم هر قلم تسهیم می‌شود.",
            refunds: "مرجوعی‌ها در سطح سفارش ثبت می‌شوند و به اقلام تسهیم شده‌اند.",
          },
        },
      };
    } catch (error) {
      ctx.badRequest(error.message, { data: { success: false } });
    }
  },

  async productTrends(ctx) {
    try {
      const user = await ensureRoleAccess(ctx, PRODUCT_REPORT_ROLES, PRODUCT_REPORT_ACCESS_MESSAGE);
      if (!user) return;

      const { start, end } = parseProductRange(ctx);
      const grouping = PA.normalizeGrouping(ctx.query.grouping, start, end);
      const knex = strapi.db.connection;
      const joins = await PA.resolveJoins(knex);

      const bucketItems = PA.tzBucketExpr("order_date", grouping);
      const bucketOrders = PA.tzBucketExpr("order_date", grouping);

      const sql = `
        WITH ${PA.paidOrdersCte(joins)}, ${PA.itemizedCte(joins)},
        items_b AS (
          SELECT ${bucketItems} AS bucket,
                 SUM(line_gross)::numeric AS gross,
                 SUM(cnt)::bigint AS units
          FROM itemized GROUP BY 1
        ),
        orders_b AS (
          SELECT ${bucketOrders} AS bucket,
                 COUNT(*)::bigint AS orders_count,
                 SUM(order_discount)::numeric AS discounts,
                 SUM(refund_irr)::numeric AS refund_irr
          FROM paid_orders GROUP BY 1
        )
        SELECT
          COALESCE(i.bucket, o.bucket) AS bucket,
          COALESCE(i.gross, 0)::numeric AS gross,
          COALESCE(i.units, 0)::bigint AS units,
          COALESCE(o.orders_count, 0)::bigint AS orders_count,
          COALESCE(o.discounts, 0)::numeric AS discounts,
          COALESCE(o.refund_irr, 0)::numeric AS refund_irr
        FROM items_b i
        FULL OUTER JOIN orders_b o ON i.bucket = o.bucket
        ORDER BY 1
      `;
      const res = await knex.raw(sql, [start, end]);
      const series = rowsOf(res).map((r: any) => {
        const gross = Number(r.gross) || 0;
        const discounts = Number(r.discounts) || 0;
        const refunds = PA.irrToToman(Number(r.refund_irr) || 0);
        return {
          bucket: r.bucket,
          gross: Math.round(gross),
          net: Math.round(gross - discounts - refunds),
          units: Number(r.units) || 0,
          orders: Number(r.orders_count) || 0,
          discounts: Math.round(discounts),
          refunds: Math.round(refunds),
        };
      });

      ctx.body = {
        data: { range: { start, end }, grouping, timezone: PA.REPORT_TIMEZONE, series },
      };
    } catch (error) {
      ctx.badRequest(error.message, { data: { success: false } });
    }
  },

  async productPerformance(ctx) {
    try {
      const user = await ensureRoleAccess(ctx, PRODUCT_REPORT_ROLES, PRODUCT_REPORT_ACCESS_MESSAGE);
      if (!user) return;

      const { start, end } = parseProductRange(ctx);
      // SuperAdminTable sends pagination[page]; Strapi's qs parser nests it under
      // ctx.query.pagination. Accept the nested form, the bracket-literal, or flat.
      const pag = (ctx.query.pagination as any) || {};
      const page = PA.clampPage(pag.page ?? ctx.query["pagination[page]"] ?? ctx.query.page);
      const pageSize = PA.clampPageSize(
        pag.pageSize ?? ctx.query["pagination[pageSize]"] ?? ctx.query.pageSize,
      );
      const sort = PA.normalizeSort(ctx.query.sort);
      const threshold = PA.DEFAULT_LOW_STOCK_THRESHOLD;
      const knex = strapi.db.connection;
      const joins = await PA.resolveJoins(knex);

      // WHERE filters on the enriched select (params appended after [start, end]).
      const where: string[] = [];
      const params: any[] = [start, end];
      const q = (ctx.query.q as string)?.trim();
      if (q) {
        where.push("(agg.product_title ILIKE ? OR agg.product_sku ILIKE ?)");
        params.push(`%${q}%`, `%${q}%`);
      }
      const type = ctx.query.productType as string;
      if (type === "Simple" || type === "Variable") {
        where.push("p.product_type = ?");
        params.push(type);
      }
      const categoryId = Number(ctx.query.categoryId);
      if (Number.isFinite(categoryId) && categoryId > 0) {
        where.push("pc.id = ?");
        params.push(categoryId);
      }
      const stockStatus = ctx.query.stockStatus as string;
      if (stockStatus === "out") where.push(`COALESCE(ps.count, 0) <= 0`);
      else if (stockStatus === "low") where.push(`(ps.count > 0 AND ps.count <= ${threshold})`);
      else if (stockStatus === "in") where.push(`ps.count > ${threshold}`);

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const core = `
        WITH ${PA.paidOrdersCte(joins)}, ${PA.itemizedCte(joins)}, ${PA.aggCte()}
        ${PA.performanceCoreSelect(joins)}
        ${whereSql}
      `;

      const dataSql = `${core} ORDER BY ${sort.column} ${sort.direction} NULLS LAST LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;
      const countSql = `SELECT COUNT(*)::bigint AS total FROM (${core}) sub`;

      const [dataRes, countRes] = await Promise.all([
        knex.raw(dataSql, params),
        knex.raw(countSql, params),
      ]);

      const rows = rowsOf(dataRes).map((r: any) => PA.serializeProductRow(r, threshold));
      await attachCoverImages(rows);
      const total = Number(rowsOf(countRes)[0]?.total || 0);

      ctx.body = {
        data: rows,
        meta: {
          pagination: {
            page,
            pageSize,
            total,
            pageCount: Math.ceil(total / pageSize) || 1,
          },
          range: { start, end },
          sort,
          lowStockThreshold: threshold,
        },
      };
    } catch (error) {
      ctx.badRequest(error.message, { data: { success: false } });
    }
  },

  async productExport(ctx) {
    try {
      const user = await ensureRoleAccess(ctx, PRODUCT_REPORT_ROLES, PRODUCT_REPORT_ACCESS_MESSAGE);
      if (!user) return;

      const { start, end } = parseProductRange(ctx);
      const sort = PA.normalizeSort(ctx.query.sort);
      const threshold = PA.DEFAULT_LOW_STOCK_THRESHOLD;
      const knex = strapi.db.connection;
      const joins = await PA.resolveJoins(knex);

      const where: string[] = [];
      const params: any[] = [start, end];
      const q = (ctx.query.q as string)?.trim();
      if (q) {
        where.push("(agg.product_title ILIKE ? OR agg.product_sku ILIKE ?)");
        params.push(`%${q}%`, `%${q}%`);
      }
      const type = ctx.query.productType as string;
      if (type === "Simple" || type === "Variable") {
        where.push("p.product_type = ?");
        params.push(type);
      }
      const categoryId = Number(ctx.query.categoryId);
      if (Number.isFinite(categoryId) && categoryId > 0) {
        where.push("pc.id = ?");
        params.push(categoryId);
      }
      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

      // Hard cap to protect memory; the visible report is paginated separately.
      const EXPORT_CAP = 10000;
      const sql = `
        WITH ${PA.paidOrdersCte(joins)}, ${PA.itemizedCte(joins)}, ${PA.aggCte()}
        ${PA.performanceCoreSelect(joins)}
        ${whereSql}
        ORDER BY ${sort.column} ${sort.direction} NULLS LAST
        LIMIT ${EXPORT_CAP}
      `;
      const res = await knex.raw(sql, params);
      const rows = rowsOf(res).map((r: any) => PA.serializeProductRow(r, threshold));

      const header = [
        "نام محصول",
        "SKU",
        "نوع",
        "دسته",
        "تعداد فروش",
        "فروش ناخالص (تومان)",
        "تخفیف (تومان)",
        "مرجوعی (تومان)",
        "خالص فروش (تومان)",
        "سفارش‌ها",
        "قیمت میانگین (تومان)",
        "موجودی",
        "وضعیت موجودی",
      ];
      const statusFa: Record<string, string> = {
        in: "موجود",
        low: "کم",
        out: "ناموجود",
        unknown: "نامشخص",
      };
      const escape = (v: any) => {
        const s = String(v ?? "");
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const lines = [header.join(",")];
      for (const r of rows) {
        lines.push(
          [
            r.productTitle,
            r.productSKU,
            r.productType ?? "",
            r.category ?? "",
            r.units,
            r.gross,
            r.discounts,
            r.refunds,
            r.net,
            r.ordersCount,
            r.avgPrice,
            r.currentStock ?? "",
            statusFa[r.stockStatus] ?? "",
          ]
            .map(escape)
            .join(","),
        );
      }
      // UTF-8 BOM so Excel renders Persian correctly.
      const csv = "﻿" + lines.join("\r\n");
      ctx.set("Content-Type", "text/csv; charset=utf-8");
      ctx.set("Content-Disposition", `attachment; filename="product-report-${Date.now()}.csv"`);
      ctx.body = csv;
    } catch (error) {
      ctx.badRequest(error.message, { data: { success: false } });
    }
  },

  async productDetail(ctx) {
    try {
      const user = await ensureRoleAccess(ctx, PRODUCT_REPORT_ROLES, PRODUCT_REPORT_ACCESS_MESSAGE);
      if (!user) return;

      const productId = Number(ctx.query.productId);
      if (!Number.isFinite(productId) || productId <= 0) {
        return ctx.badRequest("productId is required", { data: { success: false } });
      }
      const { start, end } = parseProductRange(ctx);
      const grouping = PA.normalizeGrouping(ctx.query.grouping, start, end);
      const threshold = PA.DEFAULT_LOW_STOCK_THRESHOLD;
      const knex = strapi.db.connection;
      const joins = await PA.resolveJoins(knex);

      // Product header + category.
      const infoRes = await knex.raw(
        `SELECT p.id, p.title, p.slug, p.product_type, p.status, ${joins.productToCategory.titleExpr} AS category_title
         FROM products p
         ${joins.productToCategory.join}
         WHERE p.id = ?`,
        [productId],
      );
      const info = rowsOf(infoRes)[0];
      if (!info) {
        return ctx.notFound("Product not found", { data: { success: false } });
      }

      // All variations of the product, with current stock and window sales.
      const variationsSql = `
        WITH ${PA.paidOrdersCte(joins)}, ${PA.itemizedCte(joins)}, ${PA.aggCte()}
        SELECT
          pv.id AS variation_id,
          pv.sku,
          COALESCE(a.units, 0)::bigint AS units,
          COALESCE(a.gross, 0)::numeric AS gross,
          COALESCE(a.discounts, 0)::numeric AS discounts,
          COALESCE(a.refunds_irr, 0)::numeric AS refunds_irr,
          ps.count AS current_stock,
          ps.reserved_count AS reserved_stock
        FROM product_variations pv
        ${joins.variationToProduct}
        ${joins.variationToStock}
        LEFT JOIN agg a ON a.product_variation_id = pv.id
        WHERE p.id = ?
        ORDER BY units DESC, pv.id ASC
      `;
      const variationsRes = await knex.raw(variationsSql, [start, end, productId]);
      const variations = rowsOf(variationsRes).map((r: any) => {
        const gross = Number(r.gross) || 0;
        const discounts = Number(r.discounts) || 0;
        const refunds = PA.irrToToman(Number(r.refunds_irr) || 0);
        const stock = r.current_stock === null ? null : Number(r.current_stock) || 0;
        return {
          variationId: r.variation_id,
          sku: r.sku,
          units: Number(r.units) || 0,
          gross: Math.round(gross),
          discounts: Math.round(discounts),
          refunds: Math.round(refunds),
          net: Math.round(gross - discounts - refunds),
          currentStock: stock,
          reservedStock: r.reserved_stock === null ? null : Number(r.reserved_stock) || 0,
          stockStatus: stock === null ? "unknown" : PA.classifyStock(stock, threshold),
        };
      });

      // Product-level daily/weekly trend.
      const bucket = PA.tzBucketExpr("order_date", grouping);
      const trendSql = `
        WITH ${PA.paidOrdersCte(joins)}, ${PA.itemizedCte(joins)}
        SELECT ${bucket} AS bucket,
               SUM(it.line_gross)::numeric AS gross,
               SUM(it.cnt)::bigint AS units
        FROM itemized it
        JOIN product_variations pv ON pv.id = it.product_variation_id
        ${joins.variationToProduct}
        WHERE p.id = ?
        GROUP BY 1 ORDER BY 1
      `;
      const trendRes = await knex.raw(trendSql, [start, end, productId]);
      const trend = rowsOf(trendRes).map((r: any) => ({
        bucket: r.bucket,
        gross: Math.round(Number(r.gross) || 0),
        units: Number(r.units) || 0,
      }));

      const totals = variations.reduce(
        (acc, v) => {
          acc.units += v.units;
          acc.gross += v.gross;
          acc.discounts += v.discounts;
          acc.refunds += v.refunds;
          acc.net += v.net;
          if (v.currentStock !== null) acc.currentStock += v.currentStock;
          return acc;
        },
        { units: 0, gross: 0, discounts: 0, refunds: 0, net: 0, currentStock: 0 },
      );

      // Optional Matomo behavioral data for this product page. Fully graceful:
      // `null` when Matomo is unconfigured/unavailable — never blocks the report.
      const behavioral = await getProductBehavioral(String(info.slug || ""), {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
      });

      ctx.body = {
        data: {
          product: {
            id: info.id,
            title: info.title,
            productType: info.product_type,
            status: info.status,
            category: info.category_title,
          },
          range: { start, end },
          grouping,
          timezone: PA.REPORT_TIMEZONE,
          totals,
          variations,
          trend,
          // Behavioral engagement from Matomo (distinct from transactional truth above).
          behavioral,
        },
      };
    } catch (error) {
      ctx.badRequest(error.message, { data: { success: false } });
    }
  },

  async productInventory(ctx) {
    try {
      const user = await ensureRoleAccess(ctx, PRODUCT_REPORT_ROLES, PRODUCT_REPORT_ACCESS_MESSAGE);
      if (!user) return;

      const { start, end } = parseProductRange(ctx);
      const threshold = PA.DEFAULT_LOW_STOCK_THRESHOLD;
      const days = PA.windowDays(start, end);
      const limit = PA.clampPageSize(ctx.query.limit, 50);
      const knex = strapi.db.connection;
      const joins = await PA.resolveJoins(knex);

      const sql = `
        WITH ${PA.paidOrdersCte(joins)},
        sales AS (
          SELECT ${joins.oiToVariation.idExpr} AS pvid,
                 SUM(oi.count)::bigint AS units,
                 SUM(oi.per_amount * oi.count)::numeric AS gross
          FROM order_items oi
          ${joins.oiToOrder}
          ${joins.oiToVariation.join}
          JOIN paid_orders po ON po.order_id = o.id
          GROUP BY ${joins.oiToVariation.idExpr}
        )
        SELECT
          pv.id AS variation_id,
          pv.sku,
          p.id AS product_id,
          p.title AS product_title,
          COALESCE(ps.count, 0)::bigint AS current_stock,
          COALESCE(ps.reserved_count, 0)::bigint AS reserved_stock,
          COALESCE(s.units, 0)::bigint AS units_sold,
          COALESCE(s.gross, 0)::numeric AS gross
        FROM product_variations pv
        ${joins.variationToProduct}
        ${joins.variationToStock}
        LEFT JOIN sales s ON s.pvid = pv.id
        WHERE p.removed_at IS NULL AND p.status = 'Active'
      `;
      const res = await knex.raw(sql, [start, end]);
      const all = rowsOf(res).map((r: any) => {
        const stock = Number(r.current_stock) || 0;
        const units = Number(r.units_sold) || 0;
        return {
          variationId: r.variation_id,
          productId: r.product_id,
          sku: r.sku,
          productTitle: r.product_title,
          currentStock: stock,
          reservedStock: Number(r.reserved_stock) || 0,
          unitsSold: units,
          gross: Math.round(Number(r.gross) || 0),
          daysOfCover: PA.daysOfCover(stock, units, days),
          stockStatus: PA.classifyStock(stock, threshold),
        };
      });

      const outOfStock = all.filter((r) => r.currentStock <= 0).slice(0, limit);
      const lowStock = all
        .filter((r) => r.currentStock > 0 && r.currentStock <= threshold)
        .sort((a, b) => a.currentStock - b.currentStock)
        .slice(0, limit);
      const stockNoSales = all
        .filter((r) => r.currentStock > 0 && r.unitsSold === 0)
        .sort((a, b) => b.currentStock - a.currentStock)
        .slice(0, limit);
      const fastMoving = all
        .filter((r) => r.unitsSold > 0)
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, limit);
      const slowMoving = all
        .filter((r) => r.unitsSold > 0 && r.currentStock > 0)
        .sort((a, b) => (b.daysOfCover ?? 0) - (a.daysOfCover ?? 0))
        .slice(0, limit);

      ctx.body = {
        data: {
          range: { start, end },
          windowDays: days,
          lowStockThreshold: threshold,
          timezone: PA.REPORT_TIMEZONE,
          outOfStock,
          lowStock,
          stockNoSales,
          fastMoving,
          slowMoving,
        },
      };
    } catch (error) {
      ctx.badRequest(error.message, { data: { success: false } });
    }
  },
};
