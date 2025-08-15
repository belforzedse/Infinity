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

      const query = `
        SELECT oi.product_variation_id,
               oi.product_title,
               oi.product_sku,
               SUM(oi.count)::bigint AS total_count,
               SUM((oi.per_amount * oi.count))::bigint AS total_revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
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
