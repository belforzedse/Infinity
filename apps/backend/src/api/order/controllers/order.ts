// @ts-nocheck
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
import { decrementManualOrderStockHandler } from "./helpers/manualOrderStock";
import { getActiveReserveHandler } from "./handlers/getActiveReserve";
import { releaseReserveHandler } from "./handlers/releaseReserve";
import { logAdminOrderCreate, logAdminOrderFieldUpdate } from "../../../utils/adminActivity";

// Business fields captured as admin activity on a generic `PUT /orders/:id` edit. Whitelisted on
// purpose: anything not listed here (tokens, payment internals, relations) is never diffed/logged.
const AUDITED_ORDER_FIELDS = ["Status", "Note", "Description", "ShippingCost"] as const;

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
        requesterRoleType === "founder" ||
        requesterRoleName === "superadmin" ||
        requesterRoleName === "store manager" ||
        requesterRoleName === "founder";

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

    /**
     * Core `POST /orders`. Wraps the default create to record a "manual order created" admin
     * activity. `recordAdminAudit` (via the helper) gates on the actor's role, so only admin-created
     * orders are logged; customer checkout creates orders through cart finalize (which uses
     * `entityService.create` and bypasses this controller), so there is no double-logging.
     */
    async create(ctx) {
      const response = await super.create(ctx);

      try {
        const actorId = ctx.state?.user?.id ? Number(ctx.state.user.id) : null;
        const orderId = Number((response as any)?.data?.id ?? (response as any)?.id);
        if (actorId && orderId) {
          const requestData = (ctx.request?.body as any)?.data ?? {};
          const ip = ctx.request?.ip || (ctx as any).ip || null;
          const userAgent =
            ctx.request?.headers?.["user-agent"] || (ctx as any).headers?.["user-agent"] || null;
          void logAdminOrderCreate(
            strapi,
            orderId,
            actorId,
            { type: requestData.Type ?? null, status: requestData.Status ?? null },
            ip,
            userAgent,
          );
        }
      } catch (activityError) {
        strapi.log.error("Failed to log admin activity for order create", {
          error: (activityError as Error).message,
        });
      }

      return response;
    },

    /**
     * Core `PUT /orders/:id`. Wraps the default update to capture a human-readable admin activity
     * entry (who edited the order + a before/after diff of business fields). This is the only order
     * edit path with no logging of its own; the admin adjust/cancel/barcode flows use
     * `entityService.update` directly and so bypass this controller — no double-logging.
     */
    async update(ctx) {
      const { id } = ctx.params;
      const requestData = (ctx.request?.body as any)?.data ?? {};

      // Snapshot the whitelisted fields before the write so we can diff afterwards.
      let before: Record<string, any> | null = null;
      try {
        before = await strapi.db.query("api::order.order").findOne({
          where: { id },
          select: AUDITED_ORDER_FIELDS as unknown as string[],
        });
      } catch (e) {
        before = null;
      }

      const response = await super.update(ctx);

      // Fire-and-forget: build a normalized diff of only the whitelisted fields the caller actually
      // changed, then record it. `recordAdminAudit` (via the helper) verifies the actor is an admin
      // and silently no-ops otherwise, so non-admin/customer updates never produce an entry.
      try {
        const actorId = ctx.state?.user?.id ? Number(ctx.state.user.id) : null;
        if (before && actorId) {
          const changes: Record<string, { from?: any; to?: any }> = {};
          for (const field of AUDITED_ORDER_FIELDS) {
            if (!(field in requestData)) continue;
            const from = before[field] ?? null;
            const to = requestData[field] ?? null;
            if (String(from ?? "") !== String(to ?? "")) {
              changes[field] = { from, to };
            }
          }

          if (Object.keys(changes).length > 0) {
            const ip = ctx.request?.ip || (ctx as any).ip || null;
            const userAgent =
              ctx.request?.headers?.["user-agent"] || (ctx as any).headers?.["user-agent"] || null;
            void logAdminOrderFieldUpdate(strapi, Number(id), changes, actorId, ip, userAgent);
          }
        }
      } catch (activityError) {
        strapi.log.error("Failed to log admin activity for order update", {
          orderId: id,
          error: (activityError as Error).message,
        });
      }

      return response;
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

    async decrementStockManual(ctx) {
      return decrementManualOrderStockHandler(strapi as any, ctx);
    },

    async checkPaymentStatus(ctx) {
      const { id } = ctx.params;
      const { user } = ctx.state;

      try {
        const order = await strapi.db.query("api::order.order").findOne({
          where: { id, user: { id: user.id } },
          populate: {
            contract: {
              populate: {
                contract_transactions: true,
              },
            },
          },
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

        let transactionId: string | undefined;
        if (order.PaymentGateway === "SnappPay") {
          const contract = order.contract as any;
          if (contract && typeof contract === "object") {
            transactionId =
              (contract.external_id ? String(contract.external_id) : undefined) ||
              undefined;

            if (!transactionId) {
              const txList = Array.isArray(contract.contract_transactions)
                ? contract.contract_transactions
                : [];
              const snappTx = [...txList].reverse().find((tx: any) => {
                const source = tx?.external_source || contract?.external_source;
                return source === "SnappPay";
              });
              if (snappTx?.external_id) {
                transactionId = String(snappTx.external_id);
              }
            }
          }
        }

        return {
          data: {
            success: true,
            orderId: order.id,
            status: order.Status,
            isPaid: ["Started", "Shipment", "Done"].includes(order.Status),
            paymentGateway: order.PaymentGateway || "Unknown",
            transactionId,
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

    async getActiveReserve(ctx) {
      return getActiveReserveHandler(strapi as Strapi, ctx);
    },

    async releaseReserve(ctx) {
      return releaseReserveHandler(strapi as Strapi, ctx);
    },

    async getMyOrders(ctx) {
      const { user } = ctx.state;
      const { page = 1, pageSize = 10, reserveGroupId } = ctx.query;

      try {
        const filters: { user: { id: number }; reserveGroupId?: string } = {
          user: { id: user.id },
        };
        if (reserveGroupId && typeof reserveGroupId === "string") {
          filters.reserveGroupId = reserveGroupId;
        }
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
