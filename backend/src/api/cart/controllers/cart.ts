/**
 * cart controller
 */

import { factories } from "@strapi/strapi";
import { Strapi } from "@strapi/strapi";

export default factories.createCoreController(
  "api::cart.cart",
  ({ strapi }: { strapi: Strapi }) => ({
    async getMyCart(ctx) {
      const { user } = ctx.state;

      try {
        const cartService = strapi.service("api::cart.cart");
        const cart = await cartService.getUserCart(user.id);

        return {
          data: {
            id: cart.id,
            Status: cart.Status,
            cart_items: cart.cart_items || [],
          },
        };
      } catch (error) {
        return ctx.badRequest(error.message, {
          data: {
            success: false,
            error: error.message,
          },
        });
      }
    },

    async addItem(ctx) {
      const { user } = ctx.state;
      const { productVariationId, count } = ctx.request.body;

      try {
        if (!productVariationId) {
          return ctx.badRequest("Product variation ID is required", {
            data: {
              success: false,
              error: "Product variation ID is required",
            },
          });
        }

        if (!count || count < 1) {
          return ctx.badRequest("Count must be a positive number", {
            data: {
              success: false,
              error: "Count must be a positive number",
            },
          });
        }

        // Get user's cart
        const cartService = strapi.service("api::cart.cart");
        const cart = await cartService.getUserCart(user.id);

        // Add item to cart
        const result = await cartService.addCartItem(
          cart.id,
          productVariationId,
          count
        );

        if (!result.success) {
          return ctx.badRequest(result.message, {
            data: {
              success: false,
              error: result.message,
            },
          });
        }

        return {
          data: result.data,
        };
      } catch (error) {
        return ctx.badRequest(error.message, {
          data: {
            success: false,
            error: error.message,
          },
        });
      }
    },

    async updateItem(ctx) {
      const { user } = ctx.state;
      const { cartItemId, count } = ctx.request.body;

      try {
        if (!cartItemId) {
          return ctx.badRequest("Cart item ID is required", {
            data: {
              success: false,
              error: "Cart item ID is required",
            },
          });
        }

        // If count is less than 1, remove the cart item instead of updating
        if (!count || count < 1) {
          // Remove cart item
          const cartService = strapi.service("api::cart.cart");
          const result = await cartService.removeCartItem(cartItemId);

          if (!result.success) {
            return ctx.badRequest(result.message, {
              data: {
                success: false,
                error: result.message,
              },
            });
          }

          return {
            data: {
              message: "Cart item removed successfully",
            },
          };
        }

        // Verify cart item belongs to user
        const cartItem = await strapi.db
          .query("api::cart-item.cart-item")
          .findOne({
            where: { id: cartItemId, cart: { user: { id: user.id } } },
            populate: {
              product_variation: {
                populate: {
                  product_stock: true,
                },
              },
            },
          });

        if (!cartItem) {
          return ctx.forbidden(
            "You do not have permission to update this cart item",
            {
              data: {
                success: false,
                error: "You do not have permission to update this cart item",
              },
            }
          );
        }

        if (cartItem.product_variation?.product_stock?.Count < count) {
          return ctx.badRequest("Not enough stock", {
            data: {
              success: false,
              error: "Not enough stock",
            },
          });
        }

        // Update cart item
        const cartService = strapi.service("api::cart.cart");
        const result = await cartService.updateCartItem(cartItemId, count);

        if (!result.success) {
          return ctx.badRequest(result.message, {
            data: {
              success: false,
              error: result.message,
            },
          });
        }

        return {
          data: result.data,
        };
      } catch (error) {
        return ctx.badRequest(error.message, {
          data: {
            success: false,
            error: error.message,
          },
        });
      }
    },

    async removeItem(ctx) {
      const { user } = ctx.state;
      const { id } = ctx.params;

      try {
        if (!id) {
          return ctx.badRequest("Cart item ID is required", {
            data: {
              success: false,
              error: "Cart item ID is required",
            },
          });
        }

        // Verify cart item belongs to user
        const cartItem = await strapi.db
          .query("api::cart-item.cart-item")
          .findOne({
            where: { id, cart: { user: { id: user.id } } },
          });

        if (!cartItem) {
          return ctx.forbidden(
            "You do not have permission to remove this cart item",
            {
              data: {
                success: false,
                error: "You do not have permission to remove this cart item",
              },
            }
          );
        }

        // Remove cart item
        const cartService = strapi.service("api::cart.cart");
        const result = await cartService.removeCartItem(id);

        if (!result.success) {
          return ctx.badRequest(result.message, {
            data: {
              success: false,
              error: result.message,
            },
          });
        }

        return {
          data: {
            message: "Cart item removed successfully",
          },
        };
      } catch (error) {
        return ctx.badRequest(error.message, {
          data: {
            success: false,
            error: error.message,
          },
        });
      }
    },

    async checkStock(ctx) {
      const { user } = ctx.state;

      try {
        const cartService = strapi.service("api::cart.cart");
        const result = await cartService.checkCartStock(user.id);

        return {
          data: result,
        };
      } catch (error) {
        return ctx.badRequest(error.message, {
          data: {
            success: false,
            error: error.message,
          },
        });
      }
    },

    async finalizeToOrder(ctx) {
      const { user } = ctx.state;
      const {
        shipping,
        shippingCost,
        description,
        note,
        callbackURL,
        addressId,
      } = ctx.request.body;

      try {
        if (!shipping) {
          return ctx.badRequest("Shipping information is required");
        }

        // Prepare shipping data
        const shippingData = {
          shippingId: shipping,
          shippingCost,
          description,
          note,
          addressId,
        };

        // Finalize cart to order
        const cartService = strapi.service("api::cart.cart");
        const result = await cartService.finalizeCartToOrder(
          user.id,
          shippingData
        );

        if (!result.success) {
          return ctx.badRequest(result.message, {
            data: {
              success: false,
              message: result.message,
              itemsRemoved: result.itemsRemoved,
              itemsAdjusted: result.itemsAdjusted,
              cart: result.cart,
            },
          });
        }

        // Get order, contract, and financial information
        const order = result.order;
        const contract = result.contract;
        const financialSummary = result.financialSummary;

        // Calculate total order amount for payment - we use contract's Amount
        let totalAmount = contract.Amount || 0;

        strapi.log.info(`Processing payment for Order ${order.id}:`, {
          orderId: order.id,
          contractId: contract.id,
          totalAmount,
          userId: user.id,
          callbackURL: callbackURL || "/orders/payment-callback",
        });

        // Process payment via Mellat gateway (using mellat-checkout package)
        const paymentService = strapi.service("api::payment-gateway.mellat-v3");
        const paymentResult = await paymentService.requestPayment({
          orderId: order.id,
          amount: totalAmount * 10,
          userId: user.id,
          callbackURL: callbackURL, // Will use hardcoded production URL
          contractId: contract.id, // Add contract ID to payment request
        });

        strapi.log.info(`Payment result for Order ${order.id}:`, {
          success: paymentResult.success,
          error: paymentResult.error,
          requestId: paymentResult.requestId,
          hasDetailedError: !!paymentResult.detailedError,
        });

        if (!paymentResult.success) {
          // Log gateway failure for audit trail
          try {
            await strapi.entityService.create("api::order-log.order-log", {
              data: {
                order: order.id,
                Action: "Update",
                Description: "Gateway payment request failed",
                Changes: {
                  requestId: paymentResult.requestId,
                  error: paymentResult.error,
                },
              },
            });
          } catch (e) {
            strapi.log.error(
              "Failed to write order-log for gateway failure",
              e
            );
          }
          // If payment request fails, update order status to Cancelled
          await strapi.entityService.update("api::order.order", order.id, {
            data: { Status: "Cancelled" },
          });

          // Also update contract status to Cancelled
          await strapi.entityService.update(
            "api::contract.contract",
            contract.id,
            {
              data: { Status: "Cancelled" },
            }
          );

          strapi.log.error(
            `Payment failed for Order ${order.id}. Order and contract cancelled.`,
            {
              error: paymentResult.error,
              detailedError: paymentResult.detailedError,
            }
          );

          // Return detailed error information for debugging
          return ctx.badRequest(
            paymentResult.error || "Payment gateway error",
            {
              data: {
                success: false,
                error: paymentResult.error || "Payment gateway error",
                // Include detailed error information for debugging
                debug: paymentResult.detailedError || {},
                requestId: paymentResult.requestId,
                timestamp: new Date().toISOString(),
                orderId: order.id,
                contractId: contract.id,
              },
            }
          );
        }

        strapi.log.info(`Payment successful for Order ${order.id}:`, {
          redirectUrl: paymentResult.redirectUrl,
          refId: paymentResult.refId,
        });

        // Log gateway request success for audit trail
        try {
          await strapi.entityService.create("api::order-log.order-log", {
            data: {
              order: order.id,
              Action: "Update",
              Description: "Gateway payment request initiated",
              Changes: {
                requestId: paymentResult.requestId,
                refId: paymentResult.refId,
                redirectUrl: paymentResult.redirectUrl,
              },
            },
          });
        } catch (e) {
          strapi.log.error("Failed to write order-log for gateway request", e);
        }

        return {
          data: {
            success: true,
            message:
              "Order created successfully. Redirecting to payment gateway.",
            orderId: order.id,
            contractId: contract.id,
            redirectUrl: paymentResult.redirectUrl,
            refId: paymentResult.refId,
            financialSummary: financialSummary,
            requestId: paymentResult.requestId, // For tracking
          },
        };
      } catch (error) {
        strapi.log.error("Error in finalizeToOrder:", {
          message: error.message,
          stack: error.stack,
          userId: user?.id,
          requestBody: ctx.request.body,
        });

        return ctx.badRequest(error.message, {
          data: {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
            userId: user?.id,
          },
        });
      }
    },
  })
);
