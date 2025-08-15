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

      // Try Strapi link-table strategy first (orders_*_links that connects orders and order_items)
      let joinSql: string | null = null;
      let linkTable: string | undefined;

      const linkTablesRes = await knex.raw(
        `SELECT table_name FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name LIKE '%order%items%links%'`
      );
      const linkTables = linkTablesRes.rows || linkTablesRes[0] || [];
      if (Array.isArray(linkTables) && linkTables.length > 0) {
        linkTable = String(linkTables[0].table_name);
      }

      if (linkTable) {
        const colsRes = await knex.raw(
          `SELECT column_name FROM information_schema.columns WHERE table_name = ?`,
          [linkTable]
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
        const orderItemFk =
          cols.find((c: string) => c === "order_item_id") ||
          cols.find((c: string) => c.endsWith("order_item_id")) ||
          cols.find(
            (c: string) => c.startsWith("order_item") && c.endsWith("_id")
          ) ||
          "order_item_id";

        joinSql = `
          FROM order_items oi
          JOIN ${linkTable} l ON l.${orderItemFk} = oi.id
          JOIN orders o ON o.id = l.${orderFk}
        `;
      } else {
        // Fallback to direct FK on order_items (order_id or \"order\")
        const fkCheck = await knex.raw(
          `SELECT column_name FROM information_schema.columns WHERE table_name = 'order_items' AND column_name IN ('order_id','order')`
        );
        const fkRows = fkCheck.rows || fkCheck[0] || [];
        const fkName = fkRows.find((r: any) => r.column_name === "order_id")
          ? "order_id"
          : fkRows.find((r: any) => r.column_name === "order")
          ? '"order"'
          : "order_id";

        joinSql = `
          FROM order_items oi
          JOIN orders o ON o.id = oi.${fkName}
        `;
      }

      const query = `
        SELECT oi.product_variation_id,
               oi.product_title,
               oi.product_sku,
               SUM(oi.count)::bigint AS total_count,
               SUM((oi.per_amount * oi.count))::bigint AS total_revenue
        ${joinSql}
        JOIN contracts c ON c.order_id = o.id
        WHERE c.status IN ('Confirmed','Finished')
          AND o.date BETWEEN ? AND ?
        GROUP BY oi.product_variation_id, oi.product_title, oi.product_sku
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

      const query = `
        SELECT pg.id AS gateway_id,
               COALESCE(pg.title, 'Unknown') AS title,
               SUM(CASE WHEN ct.type = 'Return' THEN -ct.amount ELSE ct.amount END)::bigint AS total
        FROM contract_transactions ct
        LEFT JOIN payment_gateways pg ON ct.payment_gateway_id = pg.id
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
