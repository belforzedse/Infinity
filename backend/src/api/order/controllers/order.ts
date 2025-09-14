/**
 * order controller
 */

import { factories } from "@strapi/strapi";
import { Strapi } from "@strapi/strapi";

export default factories.createCoreController(
  "api::order.order",
  ({ strapi }: { strapi: Strapi }) => ({
    async verifyPayment(ctx) {
      // Mellat returns: ResCode, SaleOrderId, SaleReferenceId, RefId, OrderId
      const { ResCode, SaleOrderId, SaleReferenceId, RefId, OrderId } =
        ctx.request.body;

      // SnappPay callback fields may arrive via POST body or GET query
      // Normalize from both sources and accept common aliases
      const q: any = (ctx.request as any).query || {};
      const b: any = (ctx.request as any).body || {};
      const state: string | undefined = (b.state ?? q.state) as any;
      const paymentToken: string | undefined = (b.paymentToken ??
        q.paymentToken ??
        b.payment_token ??
        q.payment_token) as any;
      const transactionId: string | undefined = (b.transactionId ??
        q.transactionId ??
        b.transaction_id ??
        q.transaction_id) as any;

      try {
        // Log all callback parameters for debugging
        strapi.log.info("Payment callback received:", {
          ResCode,
          SaleOrderId,
          SaleReferenceId,
          RefId,
          OrderId,
          state,
          paymentToken,
          transactionId,
          timestamp: new Date().toISOString(),
        });

        // If this is a SnappPay flow (state provided or paymentToken present), follow SnappPay verify+settle
        if (state || paymentToken || transactionId) {
          // Resolve orderId from our most recent pending SnappPay contract-transaction if OrderId is missing
          let orderId: number | undefined = OrderId
            ? parseInt(OrderId, 10)
            : undefined;

          if (!orderId) {
            try {
              // Find contract-transaction by TrackId (paymentToken) or external_id (transactionId)
              const txList = (await strapi.entityService.findMany(
                "api::contract-transaction.contract-transaction",
                {
                  filters: {
                    $or: [
                      paymentToken ? { TrackId: paymentToken } : {},
                      transactionId ? { external_id: transactionId } : {},
                    ],
                    external_source: "SnappPay",
                  },
                  populate: { contract: true },
                  sort: { createdAt: "desc" },
                  limit: 1,
                }
              )) as any[];
              if (txList?.length && txList[0]?.contract?.order) {
                const contractOrder = txList[0].contract.order;
                orderId =
                  typeof contractOrder === "object" && contractOrder
                    ? Number(contractOrder.id)
                    : Number(contractOrder);
              }
            } catch (e) {
              strapi.log.error(
                "Failed to resolve order from SnappPay transaction",
                e
              );
            }
          }

          if (!orderId || isNaN(orderId)) {
            return ctx.badRequest("Invalid order ID", {
              data: { success: false, error: "Invalid order ID (SnappPay)" },
            });
          }

          // SnappPay requires verify then settle using saved paymentToken (or from request)
          const snappay = strapi.service("api::payment-gateway.snappay");

          // If we don't have paymentToken in the payload, fetch it from transaction
          let tokenForOps = paymentToken as string | undefined;
          if (!tokenForOps) {
            const tx = (await strapi.entityService.findMany(
              "api::contract-transaction.contract-transaction",
              {
                filters: {
                  external_source: "SnappPay",
                  contract: { order: { id: { $notNull: true } } },
                },
                sort: { createdAt: "desc" },
                limit: 1,
                populate: { contract: true },
              }
            )) as any[];
            // Try to match by transactionId if available
            const chosen = transactionId
              ? tx.find((t: any) => t?.external_id === transactionId) || tx[0]
              : tx[0];
            tokenForOps = chosen?.TrackId;
            if (!orderId && chosen?.contract?.order) {
              const contractOrder = chosen.contract.order;
              orderId =
                typeof contractOrder === "object" && contractOrder
                  ? Number(contractOrder.id)
                  : Number(contractOrder);
            }
          }

          if (!tokenForOps) {
            return ctx.badRequest("Missing payment token for SnappPay", {
              data: { success: false, error: "Missing paymentToken" },
            });
          }

          // Log resolved identifiers
          try {
            strapi.log.info("SnappPay callback identifiers", {
              resolvedOrderId: orderId,
              tokenForOps,
              incomingPaymentToken: paymentToken,
              incomingTransactionId: transactionId,
              state,
            });
          } catch {}

          // On callback, state OK => verify+settle; FAILED => revert
          if (String(state || "OK").toUpperCase() !== "OK") {
            const revertResult = await snappay.revert(tokenForOps);
            // Update order status to Cancelled
            await strapi.entityService.update("api::order.order", orderId, {
              data: { Status: "Cancelled" },
            });
            // Log
            try {
              await strapi.entityService.create("api::order-log.order-log", {
                data: {
                  order: orderId,
                  Action: "Update",
                  Description: "SnappPay callback FAILED (revert)",
                  Changes: { state, transactionId },
                },
              });
            } catch {}
            return ctx.redirect(
              `https://infinity.rgbgroup.ir/payment/failure?orderId=${orderId}`
            );
          }

          const verifyResult = await snappay.verify(tokenForOps);
          try {
            strapi.log.info("SnappPay verify result", {
              successful: verifyResult?.successful,
              error: verifyResult?.errorData,
            });
          } catch {}
          if (!verifyResult?.successful) {
            // Verification failed; treat as failure
            await strapi.entityService.update("api::order.order", orderId, {
              data: { Status: "Cancelled" },
            });
            try {
              await strapi.entityService.create("api::order-log.order-log", {
                data: {
                  order: orderId,
                  Action: "Update",
                  Description: "SnappPay verify failed",
                  Changes: { verifyResult },
                },
              });
            } catch {}
            return ctx.redirect(
              `https://infinity.rgbgroup.ir/payment/failure?orderId=${orderId}`
            );
          }

          const settleResult = await snappay.settle(tokenForOps);
          try {
            strapi.log.info("SnappPay settle result", {
              successful: settleResult?.successful,
              error: settleResult?.errorData,
            });
          } catch {}
          if (settleResult?.successful) {
            // Decrement stock for each order item NOW (after settlement)
            try {
              const orderWithItems = await strapi.entityService.findOne(
                "api::order.order",
                orderId,
                {
                  populate: {
                    order_items: {
                      populate: {
                        product_variation: {
                          populate: { product_stock: true },
                        },
                      },
                    },
                  },
                }
              );
              // TODO: Consider wrapping stock decrements and status update in a transaction for atomicity
              for (const it of orderWithItems?.order_items || []) {
                const v = it?.product_variation;
                if (v?.product_stock?.id && typeof it?.Count === "number") {
                  const stockId = v.product_stock.id as number;
                  const current = Number(v.product_stock.Count || 0);
                  const dec = Number(it.Count || 0);
                  await strapi.entityService.update(
                    "api::product-stock.product-stock",
                    stockId,
                    { data: { Count: current - dec } }
                  );
                }
              }
            } catch (e) {
              strapi.log.error("Failed to decrement stock after settlement", e);
            }

            await strapi.entityService.update("api::order.order", orderId, {
              data: { Status: "Started" },
            });
            try {
              await strapi.entityService.create("api::order-log.order-log", {
                data: {
                  order: orderId,
                  Action: "Update",
                  Description: "SnappPay callback success (verify+settle)",
                  Changes: { transactionId },
                },
              });
            } catch {}
            return ctx.redirect(
              `https://infinity.rgbgroup.ir/payment/success?orderId=${orderId}`
            );
          } else {
            await strapi.entityService.update("api::order.order", orderId, {
              data: { Status: "Cancelled" },
            });
            return ctx.redirect(
              `https://infinity.rgbgroup.ir/payment/failure?orderId=${orderId}`
            );
          }
        }

        // Check if payment was successful (ResCode = 0) - Mellat
        if (ResCode !== "0") {
          // Handle different failure scenarios
          const orderId = parseInt(OrderId || SaleOrderId, 10);

          // Update order status to Cancelled if we have a valid order ID
          if (!isNaN(orderId)) {
            try {
              await strapi.entityService.update("api::order.order", orderId, {
                data: { Status: "Cancelled" },
              });
              strapi.log.info(
                `Order ${orderId} marked as Cancelled due to payment failure/cancellation`
              );
            } catch (updateError) {
              strapi.log.error(
                `Failed to update order ${orderId} status:`,
                updateError
              );
            }
          }

          // Log the specific error/cancellation
          // Audit log for gateway callback failure/cancellation
          try {
            if (!isNaN(orderId)) {
              await strapi.entityService.create("api::order-log.order-log", {
                data: {
                  order: orderId,
                  Action: "Update",
                  Description: "Gateway callback failure/cancellation",
                  Changes: { ResCode, SaleOrderId, SaleReferenceId, RefId },
                },
              });
            }
          } catch (e) {
            strapi.log.error("Failed to persist gateway failure log", e);
          }

          if (ResCode === "17") {
            strapi.log.info("Payment cancelled by user:", { orderId, ResCode });
            // User cancelled - redirect to frontend cancellation page
            ctx.redirect(
              `https://infinity.rgbgroup.ir/payment/cancelled?orderId=${orderId}&reason=user-cancelled`
            );
          } else {
            strapi.log.error("Payment failed with ResCode:", ResCode);
            // Other payment failures - redirect to frontend failure page
            ctx.redirect(
              `https://infinity.rgbgroup.ir/payment/failure?orderId=${orderId}&error=${encodeURIComponent(
                `Payment failed with code: ${ResCode}`
              )}`
            );
          }
          return;
        }

        // Call the Mellat service to verify the transaction (using mellat-checkout package)
        const paymentService = strapi.service("api::payment-gateway.mellat-v3");
        const verificationResult = await paymentService.verifyTransaction({
          orderId: OrderId || SaleOrderId,
          saleOrderId: SaleOrderId,
          saleReferenceId: SaleReferenceId,
        });

        if (verificationResult.success) {
          // Get the order from OrderId
          const orderId = parseInt(OrderId || SaleOrderId, 10);
          if (isNaN(orderId)) {
            return ctx.badRequest("Invalid order ID", {
              data: {
                success: false,
                error: "Invalid order ID",
              },
            });
          }

          // Settle the transaction
          const settlementResult = await paymentService.settleTransaction({
            orderId: OrderId || SaleOrderId,
            saleOrderId: SaleOrderId,
            saleReferenceId: SaleReferenceId,
          });

          if (settlementResult.success) {
            // Update order status to Started (Paid)
            // Decrement stock for each order item NOW (after settlement)
            try {
              const orderWithItems = await strapi.entityService.findOne(
                "api::order.order",
                orderId,
                {
                  populate: {
                    order_items: {
                      populate: {
                        product_variation: {
                          populate: { product_stock: true },
                        },
                      },
                    },
                  },
                }
              );
              for (const it of orderWithItems?.order_items || []) {
                const v = it?.product_variation;
                if (v?.product_stock?.id && typeof it?.Count === "number") {
                  const stockId = v.product_stock.id as number;
                  const current = Number(v.product_stock.Count || 0);
                  const dec = Number(it.Count || 0);
                  await strapi.entityService.update(
                    "api::product-stock.product-stock",
                    stockId,
                    { data: { Count: current - dec } }
                  );
                }
              }
            } catch (e) {
              strapi.log.error("Failed to decrement stock after settlement", e);
            }

            await strapi.entityService.update("api::order.order", orderId, {
              data: {
                Status: "Started",
              },
            });

            strapi.log.info(`Payment successful for Order ${orderId}:`, {
              orderId,
              ResCode,
              SaleReferenceId,
              settlementResult: settlementResult.resCode,
            });

            // Audit log for successful payment callback
            try {
              await strapi.entityService.create("api::order-log.order-log", {
                data: {
                  order: orderId,
                  Action: "Update",
                  Description: "Gateway callback success (verify+settle)",
                  Changes: { ResCode, SaleOrderId, SaleReferenceId, RefId },
                },
              });
            } catch (e) {
              strapi.log.error("Failed to persist gateway success log", e);
            }

            // Redirect to frontend success page
            ctx.redirect(
              `https://infinity.rgbgroup.ir/payment/success?orderId=${orderId}`
            );
          } else {
            // Settlement failed
            console.error("Payment settlement failed:", settlementResult.error);
            try {
              await strapi.entityService.create("api::order-log.order-log", {
                data: {
                  order: orderId,
                  Action: "Update",
                  Description: "Gateway settlement failed",
                  Changes: {
                    error: settlementResult.error,
                    SaleOrderId,
                    SaleReferenceId,
                    RefId,
                  },
                },
              });
            } catch (e) {
              strapi.log.error(
                "Failed to persist gateway settlement failure log",
                e
              );
            }
            ctx.redirect(
              `https://infinity.rgbgroup.ir/payment/failure?error=${encodeURIComponent(
                settlementResult.error || "Settlement failed"
              )}`
            );
          }
        } else {
          // Log the failure
          console.error(
            "Payment verification failed:",
            verificationResult.error
          );
          try {
            const orderId = parseInt(OrderId || SaleOrderId, 10);
            if (!isNaN(orderId)) {
              await strapi.entityService.create("api::order-log.order-log", {
                data: {
                  order: orderId,
                  Action: "Update",
                  Description: "Gateway verification failed",
                  Changes: {
                    error: verificationResult.error,
                    SaleOrderId,
                    SaleReferenceId,
                    RefId,
                  },
                },
              });
            }
          } catch (e) {
            strapi.log.error(
              "Failed to persist gateway verification failure log",
              e
            );
          }

          // Redirect to frontend failure page
          ctx.redirect(
            `https://infinity.rgbgroup.ir/payment/failure?error=${encodeURIComponent(
              verificationResult.error
            )}`
          );
        }
      } catch (error) {
        console.error("Error in payment verification callback:", error);
        try {
          const orderId = parseInt(OrderId || SaleOrderId, 10);
          if (!isNaN(orderId)) {
            await strapi.entityService.create("api::order-log.order-log", {
              data: {
                order: orderId,
                Action: "Update",
                Description: "Gateway callback internal error",
                Changes: { message: error.message },
              },
            });
          }
        } catch (e) {
          strapi.log.error("Failed to persist gateway internal error log", e);
        }
        ctx.redirect(
          `https://infinity.rgbgroup.ir/payment/failure?error=${encodeURIComponent(
            "Internal server error"
          )}`
        );
      }
    },

    async checkPaymentStatus(ctx) {
      const { id } = ctx.params;
      const { user } = ctx.state;

      try {
        // Verify that the order belongs to the user
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

        // Return the order payment status
        return {
          data: {
            success: true,
            orderId: order.id,
            status: order.Status,
            isPaid: ["Started", "Shipment", "Done"].includes(order.Status),
          },
        };
      } catch (error) {
        console.error("Error checking payment status:", error);
        return ctx.badRequest(error.message, {
          data: {
            success: false,
            error: error.message,
          },
        });
      }
    },

    async getMyOrders(ctx) {
      const { user } = ctx.state;

      // Get pagination parameters from query
      const { page = 1, pageSize = 10 } = ctx.query;

      try {
        // Prepare filters
        const filters = {
          user: { id: user.id },
        };

        // Count total orders
        const totalOrders = await strapi.db.query("api::order.order").count({
          where: filters,
        });

        // Calculate pagination values
        const pageNumber = parseInt(page, 10);
        const limit = parseInt(pageSize, 10);
        const start = (pageNumber - 1) * limit;
        const pageCount = Math.ceil(totalOrders / limit);

        // Get orders with pagination
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
                    product: {
                      populate: ["cover_image"],
                    },
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

        // Return orders with pagination metadata
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
        console.error("Error fetching user orders:", error);
        return ctx.badRequest(error.message, {
          data: {
            success: false,
            error: error.message,
          },
        });
      }
    },
  })
);
