/**
 * Report controller
 */

import type { RoleName } from "../../../utils/roles";
import { ROLE_NAMES, roleIsAllowed, fetchUserWithRole } from "../../../utils/roles";

type Interval = "day" | "week" | "month";

function parseDate(value?: string, fallbackDays = 30): Date {
  if (!value) {
    const d = new Date();
    d.setDate(d.getDate() - fallbackDays);
    return d;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
}

function computeComparisonWindow(start: Date, end: Date) {
  const durationMs = Math.max(end.getTime() - start.getTime(), 24 * 60 * 60 * 1000);
  const previousEnd = new Date(start.getTime());
  const previousStart = new Date(start.getTime() - durationMs);
  return { previousStart, previousEnd, durationMs };
}

function logReportEvent(
  ctx: any,
  report: string,
  message: string,
  extra: Record<string, unknown> = {},
  level: "info" | "error" = "info",
) {
  try {
    const user = ctx.state?.user;
    const logPayload = {
      report,
      message,
      userId: user?.id,
      role: user?.role?.name,
      timestamp: new Date().toISOString(),
      ...extra,
    };

    const logger = (strapi.log as any)?.[level] || console.log;
    logger(`[report:${report}] ${JSON.stringify(logPayload)}`);
  } catch (err) {
    console.warn(`[logReportEvent] Failed to log report event: ${err}`);
  }
}

async function ensureRoleAccess(
  ctx: any,
  allowedRoles: RoleName[],
  errorMessage: string,
) {
  const userId = ctx.state?.user?.id;
  const user = await fetchUserWithRole(strapi, userId);
  if (!user || !roleIsAllowed(user.role?.name, allowedRoles)) {
    ctx.forbidden(errorMessage);
    return null;
  }

  return user;
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

      const start = parseDate(
        (ctx.query.start as string) || (ctx.query.startDate as string),
      );
      const end = parseDate(
        (ctx.query.end as string) || (ctx.query.endDate as string),
        0,
      );
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

      const { previousStart, previousEnd } = computeComparisonWindow(start, end);

      const [seriesRes, totalRes, previousTotalRes] = await Promise.all([
        knex.raw(seriesQuery, [bucket, start, end]),
        knex.raw(totalQuery, [start, end]),
        knex.raw(totalQuery, [previousStart, previousEnd]),
      ]);

      const seriesRows = seriesRes.rows || seriesRes[0];
      const totalRow = (totalRes.rows || totalRes[0])[0];
      const previousTotalRow = (previousTotalRes.rows || previousTotalRes[0])[0];

      const series = (seriesRows || []).map((r: any) => ({
        bucket: r.bucket,
        total: Number(r.total || 0),
      }));
      const total = Number(totalRow?.total || 0);
      const previousTotal = Number(previousTotalRow?.total || 0);
      const peak = series.reduce(
        (acc, row) => (row.total > acc.total ? row : acc),
        { bucket: null, total: 0 },
      );
      const deltaAbs = total - previousTotal;
      const deltaPct = previousTotal ? (deltaAbs / previousTotal) * 100 : null;

      ctx.body = {
        data: {
          interval: bucket,
          start,
          end,
          total,
          series,
          summary: {
            previousTotal,
            deltaAbs,
            deltaPct,
            bucketCount: series.length,
            averagePerBucket: series.length ? total / series.length : 0,
            peakBucket: peak.bucket,
            peakValue: peak.total,
          },
        },
      };

      logReportEvent(ctx, "liquidity", "report_fetched", {
        interval: bucket,
        start,
        end,
        total,
        previousTotal,
        deltaPct,
      });
    } catch (error) {
      ctx.badRequest(error.message, { data: { success: false } });
    }
  },

  async productSales(ctx) {
    try {
      const user = await ensureRoleAccess(
        ctx,
        [ROLE_NAMES.SUPERADMIN, ROLE_NAMES.STORE_MANAGER],
        "Access denied - Superadmin or Store manager role required",
      );
      if (!user) return;

      const start = parseDate(
        (ctx.query.start as string) || (ctx.query.startDate as string),
      );
      const end = parseDate(
        (ctx.query.end as string) || (ctx.query.endDate as string),
        0,
      );

      const knex = strapi.db.connection;

      // orders <-> order_items link table (must contain both order_id and order_item_id)
      let ordersItemsJoinSql: string | null = null;
      let ordersItemsLink: string | undefined;
      const ordersItemsLinksRes = await knex.raw(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name LIKE '%order%item%links%'`
      );
      const ordersItemsLinks =
        ordersItemsLinksRes.rows || ordersItemsLinksRes[0] || [];
      for (const row of ordersItemsLinks) {
        const t = String(row.table_name);
        const colsRes = await knex.raw(
          `SELECT column_name FROM information_schema.columns WHERE table_name = ?`,
          [t]
        );
        const cols = new Set(
          (colsRes.rows || colsRes[0] || []).map((r: any) =>
            String(r.column_name)
          )
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
          `SELECT column_name FROM information_schema.columns WHERE table_name = 'order_items' AND column_name IN ('order_id','order')`
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
         WHERE table_schema = 'public' AND table_name LIKE '%order%item%product%variation%links%'`
      );
      const oiPvLinks = oiPvLinksRes.rows || oiPvLinksRes[0] || [];
      let oiPvLink: string | undefined;
      for (const row of oiPvLinks) {
        const t = String(row.table_name);
        const colsRes = await knex.raw(
          `SELECT column_name FROM information_schema.columns WHERE table_name = ?`,
          [t]
        );
        const cols = new Set(
          (colsRes.rows || colsRes[0] || []).map((r: any) =>
            String(r.column_name)
          )
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
          `SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_variation_id'`
        );
        const hasPvCol = (hasPvColRes.rows || hasPvColRes[0] || []).length > 0;
        if (hasPvCol) {
          selectProductVariationId =
            "oi.product_variation_id AS product_variation_id";
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
            const cols = (colsRes.rows || colsRes[0] || []).map((r: any) =>
              String(r.column_name),
            );
            const orderFk =
              cols.find((c: string) => c === "order_id") ||
              cols.find((c: string) => c.endsWith("order_id")) ||
              cols.find(
                (c: string) => c.startsWith("order") && c.endsWith("_id"),
              );
            const contractFk =
              cols.find((c: string) => c === "contract_id") ||
              cols.find((c: string) => c.endsWith("contract_id")) ||
              cols.find(
                (c: string) => c.startsWith("contract") && c.endsWith("_id"),
              );

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
          const cols = (contractOrderFkRes.rows || contractOrderFkRes[0] || []).map(
            (r: any) => String(r.column_name),
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

      const { join: paidOrdersContractJoin, source: contractJoinSource } =
        await detectJoin();

      const detectContractTxJoin = async () => {
        const contractTxFkRes = await knex.raw(
          `SELECT column_name FROM information_schema.columns WHERE table_name = 'contract_transactions'`,
        );
        const contractTxColumns =
          (contractTxFkRes.rows || contractTxFkRes[0] || []).map((r: any) =>
            String(r.column_name),
          );

        const directFk =
          contractTxColumns.find((c) => c === "contract_id") ||
          contractTxColumns.find((c) => c === "contract") ||
          contractTxColumns.find(
            (c) => c.startsWith("contract") && c.endsWith("_id"),
          );
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
          const cols = (colsRes.rows || colsRes[0] || []).map((r: any) =>
            String(r.column_name),
          );
          const contractFk =
            cols.find((c: string) => c === "contract_id") ||
            cols.find((c: string) => c.endsWith("contract_id")) ||
            cols.find(
              (c: string) => c.startsWith("contract") && c.endsWith("_id"),
            );
          const txFk =
            cols.find((c: string) => c === "contract_transaction_id") ||
            cols.find((c: string) => c.endsWith("contract_transaction_id")) ||
            cols.find((c: string) => c === "transaction_id") ||
            cols.find(
              (c: string) =>
                c.startsWith("contract_transaction") && c.endsWith("_id"),
            );
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

      const {
        join: contractTransactionsJoin,
        source: contractTransactionsJoinSource,
      } = await detectContractTxJoin();

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
        const [ordersCountRes, joinCountRes, settledMetaRes] = await Promise.all(
          [
            knex.raw(
              `SELECT COUNT(*)::bigint AS c FROM orders o WHERE o.date BETWEEN ? AND ?`,
              [start, end],
            ),
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
          ],
        );

        const ordersCount = Number(
          (ordersCountRes.rows || ordersCountRes[0])[0]?.c || 0,
        );
        const joinCount = Number(
          (joinCountRes.rows || joinCountRes[0])[0]?.c || 0,
        );
        const settledMetaRow =
          (settledMetaRes.rows || settledMetaRes[0])[0] || {};
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
             settlementCoverage:
               ordersCount > 0 ? settledOrders / ordersCount : 0,
             settledAmountToman: totalSettledIrr / 10,
            joinSource: contractJoinSource,
            contractTransactionsJoinSource,
          },
        };
        return;
      }

      const summary = {
        totalRevenue: payload.reduce((sum, row) => sum + Number(row.totalRevenue || 0), 0),
        totalUnits: payload.reduce((sum, row) => sum + Number(row.totalCount || 0), 0),
        topPerformer: payload[0]
          ? {
              title: payload[0].productTitle,
              sku: payload[0].productSKU,
              revenue: payload[0].totalRevenue,
              units: payload[0].totalCount,
            }
          : null,
      };

      ctx.body = { data: payload, summary };

      logReportEvent(ctx, "product_sales", "report_fetched", {
        start,
        end,
        totalRevenue: summary.totalRevenue,
        totalUnits: summary.totalUnits,
      });
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

      const start = parseDate(
        (ctx.query.start as string) || (ctx.query.startDate as string),
      );
      const end = parseDate(
        (ctx.query.end as string) || (ctx.query.endDate as string),
        0,
      );

      const knex = strapi.db.connection;

      // Join contract_transactions to payment_gateways via link table if present
      let txGatewayJoin = `LEFT JOIN payment_gateways pg ON ct.payment_gateway_id = pg.id`;
      const txGwLinkRes = await knex.raw(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name LIKE '%contract%transaction%payment%gateway%links%'`
      );
      const txGwLinks = txGwLinkRes.rows || txGwLinkRes[0] || [];
      if (Array.isArray(txGwLinks) && txGwLinks.length > 0) {
        const link = String(txGwLinks[0].table_name);
        const colsRes = await knex.raw(
          `SELECT column_name FROM information_schema.columns WHERE table_name = ?`,
          [link]
        );
        const cols = (colsRes.rows || colsRes[0] || []).map((r: any) =>
          String(r.column_name)
        );
        const contractTxFk =
          cols.find((c: string) => c === "contract_transaction_id") ||
          cols.find((c: string) => c.endsWith("contract_transaction_id")) ||
          cols.find(
            (c: string) =>
              c.startsWith("contract_transaction") && c.endsWith("_id")
          ) ||
          "contract_transaction_id";
        const gatewayFk =
          cols.find((c: string) => c === "payment_gateway_id") ||
          cols.find((c: string) => c.endsWith("payment_gateway_id")) ||
          cols.find(
            (c: string) => c.startsWith("payment_gateway") && c.endsWith("_id")
          ) ||
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

      const previousWindow = computeComparisonWindow(start, end);
      const prevRes = await knex.raw(query, [
        previousWindow.previousStart,
        previousWindow.previousEnd,
      ]);
      const previousRows = prevRes.rows || prevRes[0] || [];

      const data = rows.map((r: any) => ({
        gatewayId: r.gateway_id,
        gatewayTitle: r.title,
        total: Number(r.total || 0),
      }));

      const total = data.reduce((sum, row) => sum + Number(row.total || 0), 0);
      const previousTotal = (previousRows || []).reduce(
        (sum: number, row: any) => sum + Number(row.total || 0),
        0,
      );
      const deltaAbs = total - previousTotal;
      const deltaPct = previousTotal ? (deltaAbs / previousTotal) * 100 : null;
      const topGateway = data[0]
        ? { title: data[0].gatewayTitle, total: data[0].total }
        : null;

      ctx.body = {
        data,
        summary: {
          total,
          previousTotal,
          deltaAbs,
          deltaPct,
          topGateway,
          gatewayCount: data.length,
        },
      };

      logReportEvent(ctx, "gateway_liquidity", "report_fetched", {
        start,
        end,
        total,
        previousTotal,
        deltaPct,
        topGateway: topGateway?.title,
      });
    } catch (error) {
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

      const start = parseDate(
        (ctx.query.start as string) || (ctx.query.startDate as string),
      );
      const end = parseDate(
        (ctx.query.end as string) || (ctx.query.endDate as string),
        0,
      );
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

      const allowedRoles = [ROLE_NAMES.SUPERADMIN, ROLE_NAMES.STORE_MANAGER];
      filters.PerformedByRole = { $in: allowedRoles };

      const activityUid =
        "api::manual-admin-activity.manual-admin-activity" as any;

      type ActivitySummaryRow = { Severity?: string | null; Action?: string | null };
      type CountMap = Record<string, number>;

      const [manualActivities, totalCount, summaryRows] = await Promise.all([
        strapi.entityService.findMany(activityUid, {
          filters,
          sort: { createdAt: "desc" },
          populate: ["performed_by"],
          pagination: {
            page,
            pageSize,
          },
        }),
        strapi.entityService.count(activityUid, { filters }),
        strapi.db.query(activityUid).findMany<ActivitySummaryRow>({
          select: ["Severity", "Action"],
          where: filters,
        }),
      ]);

      const data = (Array.isArray(manualActivities) ? manualActivities : []).map(
        (log: any) => {
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
              log.PerformedByRole ||
              actor?.role?.name ||
              (actor ? "Unknown" : "System"),
            Description: log.Description,
            Metadata: log.Metadata,
            IP: log.IP,
            UserAgent: log.UserAgent,
            ResourceId: log.ResourceId,
            createdAt: log.createdAt,
            updatedAt: log.updatedAt,
            performed_by: actor,
          };
        },
      );

      const severityCounts = summaryRows.reduce<CountMap>((acc, row) => {
        const sev = row.Severity || "unknown";
        acc[sev] = (acc[sev] || 0) + 1;
        return acc;
      }, {});

      const actionCounts = summaryRows.reduce<CountMap>((acc, row) => {
        const act = row.Action || "unknown";
        acc[act] = (acc[act] || 0) + 1;
        return acc;
      }, {});

      ctx.body = {
        data,
        meta: {
          pagination: {
            page,
            pageSize,
            total: totalCount,
            pageCount: Math.ceil(totalCount / pageSize) || 1,
          },
        },
        summary: {
          total: totalCount,
          severityCounts,
          actionCounts,
        },
      };

      logReportEvent(ctx, "admin_activity", "report_fetched", {
        start,
        end,
        total: totalCount,
        actionTypes: Object.keys(actionCounts).length,
      });
    } catch (error) {
      ctx.badRequest(error.message, { data: { success: false } });
    }
  },
};
