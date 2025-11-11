/**
 * Report controller
 */

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

export default {
  async liquidity(ctx) {
    try {
      // Admin guard - only superadmins can view reports
      const userId = ctx.state?.user?.id;
      const user = await fetchUserWithRole(strapi, userId);
      if (!user || !roleIsAllowed(user.role?.name, [ROLE_NAMES.SUPERADMIN])) {
        return ctx.forbidden("Access denied - Superadmin role required");
      }

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
      // Admin guard - only superadmins can view reports
      const userId = ctx.state?.user?.id;
      const user = await fetchUserWithRole(strapi, userId);
      if (!user || !roleIsAllowed(user.role?.name, [ROLE_NAMES.SUPERADMIN])) {
        return ctx.forbidden("Access denied - Superadmin role required");
      }

      const start = parseDate(ctx.query.start as string);
      const end = parseDate(ctx.query.end as string, 0);

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

      // Optionally join contracts to orders (if a reliable relation is present)
      let contractJoinSql: string = "";
      let contractOrderLink: string | undefined;

      const contractLinkTablesRes = await knex.raw(
        `SELECT table_name FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name LIKE '%contract%order%links%'`
      );
      const contractLinkTables =
        contractLinkTablesRes.rows || contractLinkTablesRes[0] || [];
      if (Array.isArray(contractLinkTables) && contractLinkTables.length > 0) {
        contractOrderLink = String(contractLinkTables[0].table_name);
      }

      if (contractOrderLink) {
        const colsRes = await knex.raw(
          `SELECT column_name FROM information_schema.columns WHERE table_name = ?`,
          [contractOrderLink]
        );
        const cols = (colsRes.rows || colsRes[0] || []).map((r: any) =>
          String(r.column_name)
        );
        const orderFk =
          cols.find((c: string) => c === "order_id") ||
          cols.find((c: string) => c.endsWith("order_id")) ||
          cols.find(
            (c: string) => c.startsWith("order") && c.endsWith("_id")
          ) ||
          "order_id";
        const contractFk =
          cols.find((c: string) => c === "contract_id") ||
          cols.find((c: string) => c.endsWith("contract_id")) ||
          cols.find(
            (c: string) => c.startsWith("contract") && c.endsWith("_id")
          ) ||
          "contract_id";

        contractJoinSql = `
          LEFT JOIN ${contractOrderLink} col ON col.${orderFk} = o.id
          LEFT JOIN contracts c ON c.id = col.${contractFk}
        `;
      } else {
        // Fallback to contracts.order_id FK if it exists
        const hasOrderIdColRes = await knex.raw(
          `SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'order_id'`
        );
        const hasOrderId =
          (hasOrderIdColRes.rows || hasOrderIdColRes[0] || []).length > 0;
        contractJoinSql = hasOrderId
          ? `LEFT JOIN contracts c ON c.order_id = o.id`
          : "";
      }

      const query = `
        SELECT ${selectProductVariationId},
               oi.product_title,
               oi.product_sku,
               SUM(oi.count)::bigint AS total_count,
               SUM((oi.per_amount * oi.count))::bigint AS total_revenue
        ${ordersItemsJoinSql}
        ${productVariationJoinSql}
        ${contractJoinSql}
        WHERE o.date BETWEEN ? AND ?
        GROUP BY ${
          selectProductVariationId.includes("pv.id") ? "pv.id," : ""
        } oi.product_title, oi.product_sku
        ORDER BY total_revenue DESC
      `;

      const res = await knex.raw(query, [start, end]);
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
        const ordersCountRes = await knex.raw(
          `SELECT COUNT(*)::bigint AS c FROM orders o WHERE o.date BETWEEN ? AND ?`,
          [start, end]
        );
        const ordersCount = Number(
          (ordersCountRes.rows || ordersCountRes[0])[0]?.c || 0
        );

        // Order items matched by join
        const joinCountRes = await knex.raw(
          `SELECT COUNT(*)::bigint AS c ${ordersItemsJoinSql} WHERE o.date BETWEEN ? AND ?`,
          [start, end]
        );
        const joinCount = Number(
          (joinCountRes.rows || joinCountRes[0])[0]?.c || 0
        );

        ctx.body = {
          data: payload,
          debug: {
            start,
            end,
            ordersInRange: ordersCount,
            orderItemsJoinedCount: joinCount,
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
      // Admin guard - only superadmins can view reports
      const userId = ctx.state?.user?.id;
      const user = await fetchUserWithRole(strapi, userId);
      if (!user || !roleIsAllowed(user.role?.name, [ROLE_NAMES.SUPERADMIN])) {
        return ctx.forbidden("Access denied - Superadmin role required");
      }

      const start = parseDate(ctx.query.start as string);
      const end = parseDate(ctx.query.end as string, 0);

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

  async adminActivity(ctx) {
    try {
      // Admin guard - only superadmins can view admin activity
      const userId = ctx.state?.user?.id;
      const user = await fetchUserWithRole(strapi, userId);
      if (!user || !roleIsAllowed(user.role?.name, [ROLE_NAMES.SUPERADMIN])) {
        return ctx.forbidden("Access denied - Superadmin role required");
      }

      const start = parseDate(ctx.query.start as string);
      const end = parseDate(ctx.query.end as string, 0);
      const userId_filter = ctx.query.user_id as string;
      const actionType = ctx.query.action_type as string;
      const logType = ctx.query.log_type as string;
      const limit = Math.min(Number(ctx.query.limit || 100), 1000);
      const offset = Number(ctx.query.offset || 0);

      // Helper to query a log table using Strapi query API
      async function queryLogTable(entity: string, resourceType: string) {
        const filters: any = {
          createdAt: {
            $gte: start.toISOString(),
            $lte: end.toISOString(),
          },
        };

        if (actionType) {
          filters.Action = actionType;
        }

        const logs = await (strapi.db.query(entity as any) as any).findMany({
          where: filters,
          populate: { performed_by: { populate: { role: true } } },
          orderBy: { createdAt: "desc" },
          limit,
          offset,
        } as any);

        return (Array.isArray(logs) ? logs : []).map((log: any) => ({
          id: log.id,
          log_type: resourceType,
          action_type: log.Action,
          admin_username:
            log.performed_by?.username ||
            log.PerformedBy ||
            "System",
          admin_role: log.performed_by?.role?.name || "Unknown",
          description: log.Description,
          changes: log.Changes,
          ip_address: log.IP,
          user_agent: log.UserAgent,
          timestamp: log.createdAt,
        }));
      }

      // Query all log tables
      let allLogs: any[] = [];

      if (!logType || logType === "All" || logType === "Orders") {
        const orderLogs = await queryLogTable(
          "api::order-log.order-log",
          "Order"
        );
        allLogs = allLogs.concat(orderLogs);
      }

      if (!logType || logType === "All" || logType === "Products") {
        const productLogs = await queryLogTable(
          "api::product-log.product-log",
          "Product"
        );
        allLogs = allLogs.concat(productLogs);
      }

      if (!logType || logType === "All" || logType === "Users") {
        const userLogs = await queryLogTable(
          "api::local-user-log.local-user-log",
          "User"
        );
        allLogs = allLogs.concat(userLogs);
      }

      if (!logType || logType === "All" || logType === "Contracts") {
        const contractLogs = await queryLogTable(
          "api::contract-log.contract-log",
          "Contract"
        );
        allLogs = allLogs.concat(contractLogs);
      }

      // Filter by user_id if provided
      if (userId_filter) {
        allLogs = allLogs.filter((log) => log.admin_username === userId_filter);
      }

      // Sort by timestamp DESC
      allLogs = allLogs.sort(
        (a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Get total count across all logs
      async function countLogTable(entity: string) {
        try {
          const count = await (strapi.db.query(entity as any) as any).count({
            where: {
              createdAt: {
                $gte: start.toISOString(),
                $lte: end.toISOString(),
              },
            },
          });
          return count || 0;
        } catch {
          return 0;
        }
      }

      const countPromises = [
        logType && logType !== "All" && logType !== "Orders"
          ? Promise.resolve(0)
          : countLogTable("api::order-log.order-log"),
        logType && logType !== "All" && logType !== "Products"
          ? Promise.resolve(0)
          : countLogTable("api::product-log.product-log"),
        logType && logType !== "All" && logType !== "Users"
          ? Promise.resolve(0)
          : countLogTable("api::local-user-log.local-user-log"),
        logType && logType !== "All" && logType !== "Contracts"
          ? Promise.resolve(0)
          : countLogTable("api::contract-log.contract-log"),
      ];

      const counts = await Promise.all(countPromises);
      const totalCount = counts.reduce((sum, count) => sum + (count as number), 0);

      ctx.body = {
        data: {
          activities: allLogs
            .slice(offset, offset + limit)
            .map((log: any) => ({
              id: log.id,
              logType: log.log_type,
              actionType: log.action_type,
              adminUsername: log.admin_username,
              adminRole: log.admin_role,
              description: log.description,
              changes: log.changes,
              ipAddress: log.ip_address,
              userAgent: log.user_agent,
              timestamp: log.timestamp,
            })),
          pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: offset + allLogs.length < totalCount,
          },
        },
      };
    } catch (error) {
      ctx.badRequest(error.message, { data: { success: false } });
    }
  },
};
