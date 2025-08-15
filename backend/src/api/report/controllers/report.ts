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

      // orders <-> order_items link table detection
      let ordersItemsJoinSql: string | null = null;
      let ordersItemsLink: string | undefined;
      const ordersItemsLinksRes = await knex.raw(
        `SELECT table_name FROM information_schema.tables 
         WHERE table_schema = 'public' AND (
           table_name LIKE 'orders%order_items%links%' OR table_name LIKE 'order_items%orders%links%'
         )`
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

        // Check for Strapi v4 standard link table columns (entity_id, entity_order, etc.)
        // or legacy specific columns (order_id, order_item_id)
        const hasEntityColumns =
          cols.has("entity_id") && cols.has("entity_order");
        const hasSpecificColumns =
          cols.has("order_id") && cols.has("order_item_id");

        if (hasEntityColumns || hasSpecificColumns) {
          ordersItemsLink = t;
          break;
        }
      }

      if (ordersItemsLink) {
        // Check which column pattern this link table uses
        const colsRes = await knex.raw(
          `SELECT column_name FROM information_schema.columns WHERE table_name = ?`,
          [ordersItemsLink]
        );
        const cols = new Set(
          (colsRes.rows || colsRes[0] || []).map((r: any) =>
            String(r.column_name)
          )
        );

        if (cols.has("entity_id") && cols.has("entity_order")) {
          // Strapi v4 standard pattern
          ordersItemsJoinSql = `
            FROM order_items oi
            JOIN ${ordersItemsLink} l_oi ON l_oi.entity_id = oi.id
            JOIN orders o ON o.id = l_oi.entity_order
          `;
        } else if (cols.has("order_id") && cols.has("order_item_id")) {
          // Legacy specific pattern
          ordersItemsJoinSql = `
            FROM order_items oi
            JOIN ${ordersItemsLink} l_oi ON l_oi.order_item_id = oi.id
            JOIN orders o ON o.id = l_oi.order_id
          `;
        }
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
         WHERE table_schema = 'public' AND (
           table_name LIKE 'order_items%product_variation%links%' OR table_name LIKE 'product_variation%order_items%links%'
         )`
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

        // Check for Strapi v4 standard or legacy patterns
        const hasEntityColumns =
          cols.has("entity_id") && cols.has("entity_order");
        const hasSpecificColumns =
          cols.has("order_item_id") && cols.has("product_variation_id");

        if (hasEntityColumns || hasSpecificColumns) {
          oiPvLink = t;
          break;
        }
      }

      if (oiPvLink) {
        // Check which column pattern this link table uses
        const colsRes = await knex.raw(
          `SELECT column_name FROM information_schema.columns WHERE table_name = ?`,
          [oiPvLink]
        );
        const cols = new Set(
          (colsRes.rows || colsRes[0] || []).map((r: any) =>
            String(r.column_name)
          )
        );

        if (cols.has("entity_id") && cols.has("entity_order")) {
          // Strapi v4 standard pattern - need to determine which entity is which
          productVariationJoinSql = `
            LEFT JOIN ${oiPvLink} piv ON piv.entity_id = oi.id
            LEFT JOIN product_variations pv ON pv.id = piv.entity_order
          `;
          selectProductVariationId = "pv.id AS product_variation_id";
        } else if (
          cols.has("order_item_id") &&
          cols.has("product_variation_id")
        ) {
          // Legacy specific pattern
          productVariationJoinSql = `
            LEFT JOIN ${oiPvLink} piv ON piv.order_item_id = oi.id
            LEFT JOIN product_variations pv ON pv.id = piv.product_variation_id
          `;
          selectProductVariationId = "pv.id AS product_variation_id";
        }
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
         WHERE table_schema = 'public' AND (
           table_name LIKE '%contract%order%links%' OR table_name LIKE '%order%contract%links%'
         )`
      );
      const contractLinkTables =
        contractLinkTablesRes.rows || contractLinkTablesRes[0] || [];

      for (const row of contractLinkTables) {
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

        // Check for Strapi v4 standard or legacy patterns
        const hasEntityColumns =
          cols.has("entity_id") && cols.has("entity_order");
        const hasSpecificColumns =
          cols.has("contract_id") && cols.has("order_id");

        if (hasEntityColumns || hasSpecificColumns) {
          contractOrderLink = t;
          break;
        }
      }

      if (contractOrderLink) {
        const colsRes = await knex.raw(
          `SELECT column_name FROM information_schema.columns WHERE table_name = ?`,
          [contractOrderLink]
        );
        const cols = new Set(
          (colsRes.rows || colsRes[0] || []).map((r: any) =>
            String(r.column_name)
          )
        );

        if (cols.has("entity_id") && cols.has("entity_order")) {
          // Strapi v4 standard pattern - need to determine which entity is which
          contractJoinSql = `
            JOIN ${contractOrderLink} col ON col.entity_order = o.id
            JOIN contracts c ON c.id = col.entity_id
          `;
        } else if (cols.has("contract_id") && cols.has("order_id")) {
          // Legacy specific pattern
          contractJoinSql = `
            JOIN ${contractOrderLink} col ON col.order_id = o.id
            JOIN contracts c ON c.id = col.contract_id
          `;
        }
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
         WHERE table_schema = 'public' AND (
           table_name LIKE '%contract%transaction%payment%gateway%links%' OR
           table_name LIKE '%payment%gateway%contract%transaction%links%'
         )`
      );
      const txGwLinks = txGwLinkRes.rows || txGwLinkRes[0] || [];

      for (const row of txGwLinks) {
        const link = String(row.table_name);
        const colsRes = await knex.raw(
          `SELECT column_name FROM information_schema.columns WHERE table_name = ?`,
          [link]
        );
        const cols = new Set(
          (colsRes.rows || colsRes[0] || []).map((r: any) =>
            String(r.column_name)
          )
        );

        // Check for Strapi v4 standard or legacy patterns
        const hasEntityColumns =
          cols.has("entity_id") && cols.has("entity_order");
        const hasSpecificColumns =
          cols.has("contract_transaction_id") && cols.has("payment_gateway_id");

        if (hasEntityColumns) {
          // Strapi v4 standard pattern
          txGatewayJoin = `
            JOIN ${link} l ON l.entity_id = ct.id
            JOIN payment_gateways pg ON pg.id = l.entity_order
          `;
          break;
        } else if (hasSpecificColumns) {
          // Legacy specific pattern
          txGatewayJoin = `
            JOIN ${link} l ON l.contract_transaction_id = ct.id
            JOIN payment_gateways pg ON pg.id = l.payment_gateway_id
          `;
          break;
        }
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
