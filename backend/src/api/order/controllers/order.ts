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

      try {
        // Log all callback parameters for debugging
        strapi.log.info("Payment callback received:", {
          ResCode,
          SaleOrderId,
          SaleReferenceId,
          RefId,
          OrderId,
          timestamp: new Date().toISOString(),
        });

        // Check if payment was successful (ResCode = 0)
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
