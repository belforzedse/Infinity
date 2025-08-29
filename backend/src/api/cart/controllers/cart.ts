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
        gateway,
        mobile,
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

        // Determine gateway (default: Mellat) and build absolute callback URL
        const selectedGateway = String(gateway || "mellat").toLowerCase();
        const serverBaseUrl = strapi.config.get(
          "server.url",
          "http://localhost:1337"
        );
        const absoluteCallback = `${serverBaseUrl}${
          (callbackURL || "/orders/payment-callback").startsWith("/") ? "" : "/"
        }${callbackURL || "/orders/payment-callback"}`;

        let paymentResult: any = null;

        if (selectedGateway === "snappay") {
          // Build SnappPay cart payload
          const orderItems = await strapi.entityService.findMany(
            "api::order-item.order-item",
            {
              filters: { order: order.id },
              populate: {
                product_variation: {
                  populate: {
                    product: { populate: { product_main_category: true } },
                  },
                },
              },
            }
          );

          // Normalize user phone to 98XXXXXXXXXX as required by SnappPay
          const userRecord = await strapi.entityService.findOne(
            "api::local-user.local-user",
            user.id
          );
          const rawPhone = String(mobile || userRecord?.Phone || "");
          const normalizePhone = (p: string) => {
            const onlyDigits = p.replace(/\D/g, "");
            let d = onlyDigits;
            if (d.startsWith("0")) d = `98${d.substring(1)}`;
            if (!d.startsWith("98") && d.length === 10) d = `98${d}`;
            return d ? `+${d}` : "";
          };
          const customerMobile = normalizePhone(rawPhone);

          // Validate mobile format for SnappPay
          if (!/^\+98\d{10}$/.test(customerMobile)) {
            return ctx.badRequest(
              "Phone number is invalid for SnappPay (must be +98XXXXXXXXXX)",
              {
                data: { success: false, error: "invalid_mobile_format" },
              }
            );
          }

          // Commission mapping placeholder; adjust if contract expects category codes
          const mapCommissionType = (_catTitle?: string) => 1;

          const items = (orderItems || []).map((it: any) => {
            const pname =
              it.ProductTitle || it.product_variation?.product?.Title || "Item";
            const mainCatName =
              it.product_variation?.product?.product_main_category?.Name;
            const perAmountToman = Math.round(it.PerAmount || 0);
            const perAmountIrr = perAmountToman * 10;
            return {
              amount: perAmountIrr,
              category: mainCatName || "General",
              count: Math.round(it.Count || 1),
              id: it.product_variation?.id || it.id,
              name: pname,
              commissionType: mapCommissionType(mainCatName),
            };
          });

          const itemsTotalIrr = items.reduce(
            (sum: number, x: any) => sum + x.amount * x.count,
            0
          );
          const taxIrr = Math.round((financialSummary.tax || 0) * 10);
          const shippingIrr = Math.round((financialSummary.shipping || 0) * 10);
          const discountIrr = Math.round((financialSummary.discount || 0) * 10);
          const externalSourceIrr = 0; // wallet amount if applied

          const totalCartIrr = itemsTotalIrr + taxIrr + shippingIrr;
          // Per guideline: orderAmount = sum(cart totals) - discountAmount - externalSourceAmount
          const orderAmountIrr = totalCartIrr - discountIrr - externalSourceIrr;

          // Generate a transactionId (5-10 chars, include letter)
          const baseId = `O${order.id}`;
          const suffix = (Date.now() % 1000).toString();
          let transactionId = `${baseId}${suffix}`;
          if (transactionId.length > 10)
            transactionId = transactionId.slice(0, 10);

          const snappPayload = {
            amount: orderAmountIrr,
            discountAmount: discountIrr,
            externalSourceAmount: externalSourceIrr,
            mobile: customerMobile,
            paymentMethodTypeDto: "INSTALLMENT" as const,
            returnURL: absoluteCallback,
            transactionId,
            cartList: [
              {
                cartId: order.id,
                cartItems: items,
                isShipmentIncluded: true,
                isTaxIncluded: true,
                shippingAmount: shippingIrr,
                taxAmount: taxIrr,
                totalAmount: totalCartIrr,
              },
            ],
          } as any;

          const snappay = strapi.service("api::payment-gateway.snappay");

          // Optional eligibility
          try {
            const eligible = await snappay.eligible(orderAmountIrr);
            if (
              eligible?.successful &&
              eligible.response &&
              eligible.response.eligible === false
            ) {
              return ctx.badRequest("SnappPay not eligible for this amount", {
                data: { success: false, message: "SnappPay ineligible" },
              });
            }
          } catch {}

          const tokenResp = await snappay.requestPaymentToken(snappPayload);
          if (!tokenResp?.successful || !tokenResp?.response?.paymentPageUrl) {
            await strapi.entityService.update("api::order.order", order.id, {
              data: { Status: "Cancelled" },
            });
            await strapi.entityService.update(
              "api::contract.contract",
              contract.id,
              { data: { Status: "Cancelled" } }
            );
            return ctx.badRequest(
              tokenResp?.errorData?.message || "SnappPay error",
              {
                data: { success: false, error: tokenResp?.errorData },
              }
            );
          }

          // Ensure gateway record exists
          let gatewayEntity = (await strapi.entityService.findMany(
            "api::payment-gateway.payment-gateway",
            { filters: { Title: "SnappPay" }, limit: 1 }
          )) as any[];
          if (!gatewayEntity?.length) {
            const created = await strapi.entityService.create(
              "api::payment-gateway.payment-gateway",
              {
                data: {
                  Title: "SnappPay",
                  IsActive: true,
                  Description: "Installment Gateway",
                },
              }
            );
            gatewayEntity = [created];
          }

          // Persist contract transaction with paymentToken/transactionId
          try {
            await strapi.entityService.create(
              "api::contract-transaction.contract-transaction",
              {
                data: {
                  Type: "Gateway",
                  Amount: Math.round(totalAmount) * 10,
                  DiscountAmount: discountIrr,
                  Step: 1,
                  Status: "Pending",
                  TrackId: tokenResp.response.paymentToken,
                  external_id: transactionId,
                  external_source: "SnappPay",
                  contract: contract.id,
                  payment_gateway: gatewayEntity[0].id,
                  Date: new Date(),
                },
              }
            );
          } catch (e) {
            strapi.log.error(
              "Failed to persist SnappPay contract-transaction",
              e
            );
          }

          // Mark contract as Credit and record gateway at contract level
          try {
            await strapi.entityService.update(
              "api::contract.contract",
              contract.id,
              {
                data: {
                  Type: "Credit",
                  external_source: "SnappPay",
                  external_id: transactionId,
                },
              }
            );
          } catch (e) {
            strapi.log.error(
              "Failed to update contract as Credit (SnappPay)",
              e
            );
          }

          paymentResult = {
            success: true,
            refId: tokenResp.response.paymentToken,
            redirectUrl: tokenResp.response.paymentPageUrl,
            requestId: transactionId,
          };
        } else {
          // Mellat (default)
          const paymentService = strapi.service(
            "api::payment-gateway.mellat-v3"
          );
          paymentResult = await paymentService.requestPayment({
            orderId: order.id,
            amount: totalAmount * 10,
            userId: user.id,
            callbackURL: callbackURL,
            contractId: contract.id,
          });
        }

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
              Description: `Gateway payment request initiated (${selectedGateway})`,
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
