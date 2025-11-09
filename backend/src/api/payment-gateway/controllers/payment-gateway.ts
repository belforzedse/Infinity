/**
 * payment-gateway controller
 */

import { factories } from "@strapi/strapi";
import { computeCouponDiscount } from "../../cart/services/lib/discounts";
import { Strapi } from "@strapi/strapi";

export default factories.createCoreController(
  "api::payment-gateway.payment-gateway",
  ({ strapi }: { strapi: Strapi }) => ({
    // Test endpoint for debugging Mellat gateway
    async testMellat(ctx) {
      try {
        const {
          amount = 10000,
          orderId = Math.floor(Math.random() * 1000000),
        } = ctx.request.body;

        strapi.log.info("Testing Mellat gateway with parameters:", {
          amount,
          orderId,
        });

        // Get the Mellat service
        const paymentService = strapi.service("api::payment-gateway.mellat");

        // Test payment request
        const result = await paymentService.requestPayment({
          orderId: orderId,
          amount: amount,
          userId: 1, // Test user ID
          callbackURL: "/test/callback",
          contractId: 0,
        });

        strapi.log.info("Mellat test result:", result);

        return ctx.send({
          data: {
            success: result.success,
            message: result.success
              ? "Mellat gateway test successful"
              : "Mellat gateway test failed",
            result: result,
            testParameters: { amount, orderId },
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        strapi.log.error("Error testing Mellat gateway:", {
          message: error.message,
          stack: error.stack,
        });

        return ctx.badRequest("Test failed", {
          data: {
            success: false,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          },
        });
      }
    },

    // Compute SnappPay eligibility based on current cart and shipping
    async snappEligible(ctx) {
      try {
        // Resolve legacy local-user id from plugin user
        const pluginUserId = ctx.state.user?.id;
        if (!pluginUserId) {
          return ctx.unauthorized("Unauthorized");
        }
        // When using plugin users, use the plugin user id as the principal
        const userId = pluginUserId;

        // Params
        // IMPORTANT: amount parameter should be the final قابل پرداخت (payable amount in Toman)
        const amountTomanParam = ctx.request.query?.amount
          ? Number(ctx.request.query.amount)
          : undefined;

        const shippingId = ctx.request.query?.shippingId
          ? Number(ctx.request.query.shippingId)
          : undefined;
        const shippingCostParam = ctx.request.query?.shippingCost
          ? Number(ctx.request.query.shippingCost)
          : undefined;
        const discountCodeParam =
          (ctx.request.query?.discountCode as string | undefined) ||
          (ctx.request.body?.discountCode as string | undefined);

        // If amount is provided directly from frontend (قابل پرداخت), use it directly
        if (amountTomanParam !== undefined) {
          const amountIRR = Math.max(0, amountTomanParam) * 10;

          strapi.log.info("SnappPay eligible request (direct amount)", {
            userId: pluginUserId,
            amountToman: amountTomanParam,
            amountIRR,
          });

          const snappay = strapi.service("api::payment-gateway.snappay");
          const eligibleResp = await snappay.eligible(amountIRR);
          strapi.log.info("SnappPay eligible result", {
            successful: eligibleResp?.successful,
            eligible: eligibleResp?.response?.eligible,
            error: eligibleResp?.errorData,
          });

          const payload = {
            eligible: !!eligibleResp?.response?.eligible,
            title: eligibleResp?.response?.title_message,
            description: eligibleResp?.response?.description,
            amountIRR,
          };

          return ctx.send({ data: payload });
        }

        // Load user's current cart with items (same as applyDiscount)
        const cartService = strapi.service("api::cart.cart");
        const cart = await cartService.getUserCart(userId);

        if (!cart?.cart_items?.length) {
          return ctx.send({
            data: { eligible: false, message: "Cart is empty" },
          });
        }

        // Compute subtotal from cart (same logic as applyDiscount)
        // Use DiscountPrice if available, otherwise fall back to Price (same logic as order item creation)
        let subtotal = 0;
        for (const item of cart.cart_items) {
          const price =
            item?.product_variation?.DiscountPrice ?? item?.product_variation?.Price ?? 0;
          const count = Number(item?.Count || 0);
          subtotal += Number(price) * count;

          console.log(
            `[ELIGIBLE CALC] VarID=${item?.product_variation?.id}, DiscountPrice=${
              item?.product_variation?.DiscountPrice
            }, Price=${item?.product_variation?.Price}, Count=${count}, ItemTotal=${
              Number(price) * count
            }`,
          );
        }
        console.log(`[ELIGIBLE CALC] Final subtotal=${subtotal}`);

        // Discounts: apply coupon first if provided, otherwise fallback to general discount
        let discountAmount = 0;
        if (discountCodeParam) {
          try {
            discountAmount = await computeCouponDiscount(
              strapi as any,
              userId,
              String(discountCodeParam),
              subtotal,
              cart.cart_items,
            );
          } catch (e) {
            strapi.log.error("Failed to compute coupon discount for eligibility", e);
          }
        }
        if (!discountAmount) {
          const generalDiscounts = await strapi.entityService.findMany(
            "api::general-discount.general-discount",
            {
              filters: {
                IsActive: true,
                StartDate: { $lte: new Date() },
                EndDate: { $gte: new Date() },
              },
              sort: { createdAt: "desc" },
            },
          );
          for (const discount of generalDiscounts || []) {
            const d = discount as any;
            if (d.MinimumAmount <= subtotal) {
              if (d.IsPercentage) {
                discountAmount = (subtotal * d.Amount) / 100;
                if (d.MaxAmount && discountAmount > d.MaxAmount) {
                  discountAmount = d.MaxAmount;
                }
              } else {
                discountAmount = d.Amount;
              }
              break;
            }
          }
        }

        // Shipping (toman)
        let shippingCost = shippingCostParam || 0;
        if (!shippingCost && shippingId) {
          const shipping = await strapi.entityService.findOne("api::shipping.shipping", shippingId);
          if (shipping?.Price) shippingCost = Number(shipping.Price);
        }

        // Total (toman) → convert to IRR (tax disabled)
        const totalToman =
          Math.round(subtotal) - Math.round(discountAmount) + Math.round(shippingCost);
        const amountIRR = Math.max(0, totalToman) * 10;

        // Call Snapp eligibility
        const snappay = strapi.service("api::payment-gateway.snappay");
        strapi.log.info("SnappPay eligible request", {
        userId: pluginUserId,
          amountIRR,
          hasDiscountCode: !!discountCodeParam,
          discountToman: Math.round(discountAmount),
          debugAmounts: {
            subtotalToman: Math.round(subtotal),
            discountToman: Math.round(discountAmount),
            shippingToman: Math.round(shippingCost),
            totalToman,
            totalIRR: amountIRR,
          },
        });
        const eligibleResp = await snappay.eligible(amountIRR);
        strapi.log.info("SnappPay eligible result", {
          successful: eligibleResp?.successful,
          eligible: eligibleResp?.response?.eligible,
          error: eligibleResp?.errorData,
        });

        const payload = {
          eligible: !!eligibleResp?.response?.eligible,
          title: eligibleResp?.response?.title_message,
          description: eligibleResp?.response?.description,
          amountIRR,
        };

        return ctx.send({ data: payload });
      } catch (error) {
        strapi.log.error("SnappPay eligibility error:", {
          message: error.message,
          stack: error.stack,
        });
        return ctx.badRequest("Eligibility failed", {
          data: { success: false, error: error.message },
        });
      }
    },

    // Test endpoint for the new Mellat V2 implementation
    async testMellatV2(ctx) {
      try {
        const {
          amount = 10000,
          orderId = Math.floor(Math.random() * 1000000),
        } = ctx.request.body;

        strapi.log.info("Testing Mellat V2 gateway with parameters:", {
          amount,
          orderId,
        });

        // Get the Mellat V2 service
        const paymentService = strapi.service("api::payment-gateway.mellat-v2");

        // Test payment request
        const result = await paymentService.requestPayment({
          orderId: orderId,
          amount: amount,
          userId: 1, // Test user ID
          callbackURL: "/test/callback",
          contractId: 0,
        });

        strapi.log.info("Mellat V2 test result:", result);

        return ctx.send({
          data: {
            success: result.success,
            message: result.success
              ? "Mellat V2 gateway test successful"
              : "Mellat V2 gateway test failed",
            result: result,
            testParameters: { amount, orderId },
            timestamp: new Date().toISOString(),
            version: "v2",
          },
        });
      } catch (error) {
        strapi.log.error("Error testing Mellat V2 gateway:", {
          message: error.message,
          stack: error.stack,
        });

        return ctx.badRequest("Test failed", {
          data: {
            success: false,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            version: "v2",
          },
        });
      }
    },

    // Test endpoint for SnappPay (eligible + token)
    async testSnappPay(ctx) {
      try {
        const {
          amountIRR = 4000,
          mobile = "989121234567",
          callbackURL = "/orders/payment-callback",
        } = ctx.request.body || {};

        const snappay = strapi.service("api::payment-gateway.snappay");

        const eligible = await snappay.eligible(Number(amountIRR));

        const serverBaseUrl = strapi.config.get(
          "server.url",
          "http://localhost:1337"
        );
        const absoluteCallback = `${serverBaseUrl}${
          String(callbackURL).startsWith("/") ? "" : "/"
        }${callbackURL}`;

        const payload = {
          amount: Number(amountIRR),
          discountAmount: 0,
          externalSourceAmount: 0,
          mobile: String(mobile),
          paymentMethodTypeDto: "INSTALLMENT" as const,
          returnURL: absoluteCallback,
          transactionId: `TEST${Date.now()}`.slice(0, 10),
          cartList: [
            {
              cartId: 1,
              cartItems: [
                {
                  amount: Number(amountIRR),
                  category: "General",
                  count: 1,
                  id: 1,
                  name: "Test Item",
                  commissionType: 1,
                },
              ],
              isShipmentIncluded: true,
              isTaxIncluded: true,
              taxAmount: 0,
              shippingAmount: 0,
              totalAmount: Number(amountIRR),
            },
          ],
        } as any;

        const tokenResp = await snappay.requestPaymentToken(payload);

        return ctx.send({
          data: {
            success: true,
            eligible,
            tokenResp,
          },
        });
      } catch (error) {
        strapi.log.error("Error testing SnappPay:", {
          message: error.message,
          stack: error.stack,
        });
        return ctx.badRequest("SnappPay test failed", {
          data: {
            success: false,
            error: error.message,
          },
        });
      }
    },

    // Test endpoint for the new Mellat V3 implementation using mellat-checkout package
    async testMellatV3(ctx) {
      try {
        const {
          amount = 10000,
          orderId = Math.floor(Math.random() * 1000000),
        } = ctx.request.body;

        strapi.log.info("Testing Mellat V3 gateway with parameters:", {
          amount,
          orderId,
        });

        // Get the Mellat V3 service
        const paymentService = strapi.service("api::payment-gateway.mellat-v3");

        // Test payment request
        const result = await paymentService.requestPayment({
          orderId: orderId,
          amount: amount,
          userId: 1, // Test user ID
          callbackURL: "/test/callback",
          contractId: 0,
        });

        strapi.log.info("Mellat V3 test result:", result);

        return ctx.send({
          data: {
            success: result.success,
            message: result.success
              ? "Mellat V3 gateway test successful"
              : "Mellat V3 gateway test failed",
            result: result,
            testParameters: { amount, orderId },
            timestamp: new Date().toISOString(),
            version: "v3",
            package: "mellat-checkout",
          },
        });
      } catch (error) {
        strapi.log.error("Error testing Mellat V3 gateway:", {
          message: error.message,
          stack: error.stack,
        });

        return ctx.badRequest("Test failed", {
          data: {
            success: false,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            version: "v3",
            package: "mellat-checkout",
          },
        });
      }
    },
  })
);
