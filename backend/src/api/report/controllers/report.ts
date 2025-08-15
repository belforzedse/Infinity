/**
 * Report controller
 */

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
      // Admin guard
      const userId = ctx.state?.user?.id;
      const user = await strapi.db.query("api::local-user.local-user").findOne({
        where: { id: userId },
        populate: ["user_role"],
      });
      if (!user || user.user_role?.id !== 2) {
        return ctx.forbidden("Access denied");
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
      // Admin guard
      const userId = ctx.state?.user?.id;
      const user = await strapi.db.query("api::local-user.local-user").findOne({
        where: { id: userId },
        populate: ["user_role"],
      });
      if (!user || user.user_role?.id !== 2) {
        return ctx.forbidden("Access denied");
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

      // Join contracts to orders: prefer link table if present, otherwise FK on contracts.order_id
      let contractJoinSql: string | null = null;
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
          JOIN ${contractOrderLink} col ON col.${orderFk} = o.id
          JOIN contracts c ON c.id = col.${contractFk}
        `;
      } else {
        // Fallback to contracts.order_id FK
        const hasOrderIdColRes = await knex.raw(
          `SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'order_id'`
        );
        const hasOrderId =
          (hasOrderIdColRes.rows || hasOrderIdColRes[0] || []).length > 0;
        contractJoinSql = hasOrderId
          ? `JOIN contracts c ON c.order_id = o.id`
          : `JOIN contracts c ON 1=1 /* no direct join available */`;
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
        WHERE c.status IN ('Confirmed','Finished')
          AND o.date BETWEEN ? AND ?
        GROUP BY ${
          selectProductVariationId.includes("pv.id") ? "pv.id," : ""
        } oi.product_title, oi.product_sku
        ORDER BY total_revenue DESC
      `;

      const res = await knex.raw(query, [start, end]);
      const rows = res.rows || res[0];

      ctx.body = {
        data: rows.map((r: any) => ({
          productVariationId: r.product_variation_id,
          productTitle: r.product_title,
          productSKU: r.product_sku,
          totalCount: Number(r.total_count || 0),
          totalRevenue: Number(r.total_revenue || 0),
        })),
      };
    } catch (error) {
      ctx.badRequest(error.message, { data: { success: false } });
    }
  },

  async gatewayLiquidity(ctx) {
    try {
      // Admin guard
      const userId = ctx.state?.user?.id;
      const user = await strapi.db.query("api::local-user.local-user").findOne({
        where: { id: userId },
        populate: ["user_role"],
      });
      if (!user || user.user_role?.id !== 2) {
        return ctx.forbidden("Access denied");
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
};
