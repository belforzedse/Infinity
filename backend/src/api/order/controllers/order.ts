/**
 * order controller (slim delegator)
 */

import { factories } from "@strapi/strapi";
import { Strapi } from "@strapi/strapi";
import { generateAnipoBarcodeHandler } from "./helpers/generateBarcode";
import { verifyPaymentHandler } from "./helpers/payment";
import { adminAdjustItemsHandler } from "./helpers/adminAdjustItems";
import { adminCancelOrderHandler } from "./helpers/adminCancel";
import { adminVoidBarcodeHandler } from "./helpers/adminVoidBarcode";

export default factories.createCoreController(
  "api::order.order",
  ({ strapi }: { strapi: Strapi }) => ({
    async generateAnipoBarcode(ctx) {
      return generateAnipoBarcodeHandler(strapi as any, ctx);
    },

    async verifyPayment(ctx) {
      return verifyPaymentHandler(strapi as any, ctx);
    },

    async adminAdjustItems(ctx) {
      return adminAdjustItemsHandler(strapi as any, ctx);
    },

    async adminCancel(ctx) {
      return adminCancelOrderHandler(strapi as any, ctx);
    },

    async adminVoidBarcode(ctx) {
      return adminVoidBarcodeHandler(strapi as any, ctx);
    },

    async checkPaymentStatus(ctx) {
      const { id } = ctx.params;
      const { user } = ctx.state;

      try {
        const order = await strapi.db.query("api::order.order").findOne({
          where: { id, user: { id: user.id } },
        });

        if (!order) {
          return ctx.forbidden(
            "You do not have permission to access this order",
            {
              data: {
                success: false,
                error: "You do not have permission to access this order",
              },
            }
          );
        }

        return {
          data: {
            success: true,
            orderId: order.id,
            status: order.Status,
            isPaid: ["Started", "Shipment", "Done"].includes(order.Status),
          },
        };
      } catch (error) {
        return ctx.badRequest((error as any).message, {
          data: {
            success: false,
            error: (error as any).message,
          },
        });
      }
    },

    async getMyOrders(ctx) {
      const { user } = ctx.state;
      const { page = 1, pageSize = 10 } = ctx.query;

      try {
        const filters = { user: { id: user.id } };
        const totalOrders = await strapi.db
          .query("api::order.order")
          .count({ where: filters });

        const pageNumber = parseInt(page, 10);
        const limit = parseInt(pageSize, 10);
        const start = (pageNumber - 1) * limit;
        const pageCount = Math.ceil(totalOrders / limit);

        const orders = await strapi.db.query("api::order.order").findMany({
          where: filters,
          populate: {
            order_items: {
              populate: {
                product_variation: {
                  populate: {
                    product_color: true,
                    product_size: true,
                    product_variation_model: true,
                    product: { populate: ["cover_image"] },
                  },
                },
              },
            },
            shipping: true,
          },
          orderBy: { Date: "desc" },
          limit,
          offset: start,
        });

        return {
          data: orders,
          meta: {
            pagination: {
              page: pageNumber,
              pageSize: limit,
              pageCount,
              total: totalOrders,
            },
          },
        };
      } catch (error) {
        return ctx.badRequest((error as any).message, {
          data: { success: false, error: (error as any).message },
        });
      }
    },
  })
);
