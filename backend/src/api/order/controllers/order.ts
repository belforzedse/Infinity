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
    async findOne(ctx) {
      const { id } = ctx.params;
      const requester = ctx.state.user;

      const requesterId = requester?.id ? Number(requester.id) : null;
      const requesterRoleType = requester?.role?.type?.toLowerCase();
      const requesterRoleName = requester?.role?.name?.toLowerCase();
      const isAdminUser =
        requester?.isAdmin === true ||
        requesterRoleType === "superadmin" ||
        requesterRoleType === "store-manager" ||
        requesterRoleName === "superadmin" ||
        requesterRoleName === "store manager";

      try {
        // Query with all necessary relations populated
        const order = await strapi.db.query("api::order.order").findOne({
          where: { id },
          populate: {
            user: {
              fields: ["id", "email", "phone", "username"],
              populate: {
                user_info: true,
              },
            },
            user_info: true, // Legacy support - populate at order level too
            contract: {
              populate: {
                contract_transactions: {
                  populate: {
                    payment_gateway: true,
                  },
                },
              },
            },
            order_items: {
              populate: {
                product_variation: {
                  populate: {
                    product: {
                      populate: ["CoverImage"],
                    },
                    product_variation_color: true,
                    product_variation_size: true,
                    product_variation_model: true,
                  },
                },
                product_color: true,
                product_size: true,
                product_variation_model: true,
              },
            },
            shipping: true,
            delivery_address: {
              populate: {
                shipping_city: {
                  populate: {
                    shipping_province: true,
                  },
                },
              },
            },
          },
        });

        if (!order) {
          return ctx.notFound("Order not found");
        }

        if (!isAdminUser) {
          if (!requesterId) {
            return ctx.unauthorized("Authentication required");
          }

          const orderOwnerId = order.user?.id ? Number(order.user.id) : null;
          if (!orderOwnerId || orderOwnerId !== requesterId) {
            return ctx.forbidden("You do not have permission to access this order");
          }
        }

        // Transform the response to match the frontend's expected structure
        // Check both order.user_info (legacy) and order.user.user_info (correct structure)
        const userInfo = order.user?.user_info || order.user_info;
        const transformedOrder = {
          ...order,
          user: order.user
            ? {
                data: {
                  id: order.user.id,
                  attributes: {
                    Phone: order.user.phone || null,
                    phone: order.user.phone || null,
                    email: order.user.email,
                    username: order.user.username,
                    user_info: userInfo
                      ? {
                          data: {
                            id: userInfo.id,
                            attributes: userInfo,
                          },
                        }
                      : null,
                  },
                },
              }
            : null,
        };

        ctx.body = { data: transformedOrder };
      } catch (error) {
        ctx.badRequest("Error fetching order", {
          data: {
            success: false,
            error: (error as any).message,
          },
        });
      }
    },

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
            paymentGateway: order.PaymentGateway || "Unknown",
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
            user: {
              fields: ["id", "phone", "username", "email"],
            },
            order_items: {
              populate: {
                product_variation: {
                  populate: {
                    product_variation_color: true,
                    product_variation_size: true,
                    product_variation_model: true,
                    product: { populate: ["CoverImage"] },
                  },
                },
                product_color: true,
                product_size: true,
                product_variation_model: true,
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

    async getMyOrderDetail(ctx) {
      const { user } = ctx.state;
      const { id } = ctx.params;

      try {
        const orderId = Number(id);
        if (Number.isNaN(orderId)) {
          return ctx.badRequest("Order id must be a number", {
            data: { success: false, error: "INVALID_ID" },
          });
        }

        const order = await strapi.db.query("api::order.order").findOne({
          where: { id: orderId, user: { id: user.id } },
        populate: {
            order_items: {
              populate: {
                product_variation: {
                  populate: {
                    product_color: true,
                    product_size: true,
                    product_variation_model: true,
                    product: { populate: ["CoverImage"] },
                  },
                },
              },
            },
            shipping: true,
            delivery_address: {
              populate: {
                shipping_city: {
                  populate: {
                    shipping_province: true,
                  },
                },
              },
            },
            contract: {
              populate: {
                contract_transactions: {
                  populate: {
                    payment_gateway: true,
                  },
                  orderBy: { Date: "asc" },
                },
              },
            },
          user: {
            fields: ["id", "phone", "username", "email"],
          },
          },
        });

        if (!order) {
          return ctx.notFound("Order not found", {
            data: { success: false, error: "NOT_FOUND" },
          });
        }

        const orderLogs = await strapi.db.query("api::order-log.order-log").findMany({
          where: { order: { id: orderId } },
          orderBy: { createdAt: "asc" },
        });

        const contractTransactions = order.contract?.contract_transactions ?? [];

        return {
          data: {
            ...order,
            contract_transactions: contractTransactions,
            orderLogs,
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
