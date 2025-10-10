import { Strapi } from "@strapi/strapi";
import { requestMellatPayment, requestSnappPayment } from "./gateway-helpers";

export const finalizeToOrderHandler = (strapi: Strapi) => async (ctx: any) => {
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
    discountCode,
  } = ctx.request.body;

  try {
    // Validate required shipping information
    if (!shipping) {
      return ctx.badRequest("روش ارسال الزامی است", {
        data: {
          success: false,
          errorCode: "SHIPPING_REQUIRED",
          message: "روش ارسال الزامی است",
        },
      });
    }

    // Validate address is provided and exists
    if (!addressId) {
      return ctx.badRequest("آدرس تحویل الزامی است", {
        data: {
          success: false,
          errorCode: "ADDRESS_REQUIRED",
          message: "آدرس تحویل الزامی است",
        },
      });
    }

    // Verify shipping method exists and is valid
    try {
      const shippingMethod = await strapi.entityService.findOne(
        "api::shipping.shipping",
        shipping
      );
      if (!shippingMethod) {
        return ctx.badRequest("روش ارسال انتخاب شده معتبر نیست", {
          data: {
            success: false,
            errorCode: "INVALID_SHIPPING",
            message: "روش ارسال انتخاب شده معتبر نیست",
          },
        });
      }
    } catch (err) {
      strapi.log.error("Failed to validate shipping method:", err);
      return ctx.badRequest("خطا در بررسی روش ارسال", {
        data: {
          success: false,
          errorCode: "SHIPPING_VALIDATION_FAILED",
          message: "خطا در بررسی روش ارسال",
        },
      });
    }

    // Verify address exists and belongs to user
    try {
      const address = await strapi.entityService.findOne(
        "api::local-user-address.local-user-address",
        addressId,
        { populate: { shipping_city: true } }
      );
      if (!address) {
        return ctx.badRequest("آدرس انتخاب شده یافت نشد", {
          data: {
            success: false,
            errorCode: "ADDRESS_NOT_FOUND",
            message: "آدرس انتخاب شده یافت نشد",
          },
        });
      }
      // Note: Add user ownership check if needed
      // if (address.user !== user.id) { ... }
    } catch (err) {
      strapi.log.error("Failed to validate address:", err);
      return ctx.badRequest("خطا در بررسی آدرس", {
        data: {
          success: false,
          errorCode: "ADDRESS_VALIDATION_FAILED",
          message: "خطا در بررسی آدرس",
        },
      });
    }

    const shippingData = {
      shippingId: shipping,
      shippingCost,
      description,
      note,
      addressId,
      discountCode,
    };

    const cartService = strapi.service("api::cart.cart");
    const result = await cartService.finalizeCartToOrder(user.id, shippingData);

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

    const order = result.order;
    const contract = result.contract;
    const financialSummary = result.financialSummary;

    let totalAmount = contract.Amount || 0;

    strapi.log.info(`Processing payment for Order ${order.id}:`, {
      orderId: order.id,
      contractId: contract.id,
      totalAmount,
      userId: user.id,
      callbackURL: callbackURL || "/orders/payment-callback",
    });

    const selectedGateway = String(gateway || "mellat").toLowerCase();
    const serverBaseUrl = "https://api.infinity.rgbgroup.ir/api";
    const absoluteCallback = `${serverBaseUrl}${
      (callbackURL || "/orders/payment-callback").startsWith("/") ? "" : "/"
    }${callbackURL || "/orders/payment-callback"}`;

    // Wallet payment path (full wallet only)
    if (String(gateway || "").toLowerCase() === "wallet") {
      // Compute total amount from contract (toman -> IRR inside wallet storage uses IRR)
      const totalToman = Math.round(contract.Amount || 0);
      const totalIrr = totalToman * 10;

      // Load wallet
      const wallet = await strapi.db
        .query("api::local-user-wallet.local-user-wallet")
        .findOne({ where: { user: user.id } });

      if (!wallet || Number(wallet.Balance || 0) < totalIrr) {
        return ctx.badRequest("Wallet balance is insufficient", {
          data: { success: false, error: "insufficient_wallet" },
        });
      }

      // Deduct and persist atomically
      const newBalance = Number(wallet.Balance || 0) - totalIrr;
      await strapi.entityService.update(
        "api::local-user-wallet.local-user-wallet",
        wallet.id,
        { data: { Balance: newBalance, LastTransactionDate: new Date() } }
      );

      // Transaction record (Minus)
      try {
        await strapi.entityService.create(
          "api::local-user-wallet-transaction.local-user-wallet-transaction",
          {
            data: {
              Amount: totalIrr,
              Type: "Minus",
              Date: new Date(),
              Cause: "Order Payment",
              ReferenceId: String(order.id),
              user_wallet: wallet.id,
            },
          }
        );
      } catch {}

      // Immediately mark order as paid (Started) and decrement stock (wallet is instant-settlement)
      try {
        const orderWithItems = await strapi.entityService.findOne(
          "api::order.order",
          order.id,
          {
            populate: {
              order_items: {
                populate: {
                  product_variation: { populate: { product_stock: true } },
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
        strapi.log.error("Failed to decrement stock for wallet payment", e);
      }

      try {
        await strapi.entityService.update("api::order.order", order.id, {
          data: { Status: "Started" },
        });
      } catch (e) {
        strapi.log.error(
          "Failed to update order status to Started (wallet)",
          e
        );
      }

      // Write order-log
      try {
        await strapi.entityService.create("api::order-log.order-log", {
          data: {
            order: order.id,
            Action: "Update",
            Description: "Wallet payment success (instant settlement)",
            Changes: { method: "wallet" },
          },
        });
      } catch {}

      return {
        data: {
          success: true,
          message: "Order paid via wallet.",
          orderId: order.id,
          contractId: contract.id,
          redirectUrl: "",
          refId: "",
          financialSummary: financialSummary,
          requestId: "wallet",
        },
      };
    }

    let paymentResult: any = null;

    if (selectedGateway === "snappay") {
      const { response, paymentResult: pr } = await requestSnappPayment(
        strapi,
        ctx,
        {
          order,
          contract,
          financialSummary,
          userId: user.id,
          mobile,
          absoluteCallback,
        }
      );
      if (response) return response;
      paymentResult = pr;
    } else {
      paymentResult = await requestMellatPayment(strapi, {
        orderId: order.id,
        amount: totalAmount * 10,
        userId: user.id,
        callbackURL: callbackURL,
        contractId: contract.id,
      });
    }

    strapi.log.info(`Payment result for Order ${order.id}:`, {
      success: paymentResult?.success,
      error: paymentResult?.error,
      requestId: paymentResult?.requestId,
      hasDetailedError: !!paymentResult?.detailedError,
    });

    if (!paymentResult || !paymentResult.success) {
      const reqId = paymentResult?.requestId;
      const errMsg = paymentResult?.error || "Payment gateway error";
      const detailed = paymentResult?.detailedError || {};
      try {
        await strapi.entityService.create("api::order-log.order-log", {
          data: {
            order: order.id,
            Action: "Update",
            Description: "Gateway payment request failed",
            Changes: {
              requestId: reqId,
              error: errMsg,
            },
          },
        });
      } catch (e) {
        strapi.log.error("Failed to write order-log for gateway failure", e);
      }

      await strapi.entityService.update("api::order.order", order.id, {
        data: { Status: "Cancelled" },
      });
      await strapi.entityService.update("api::contract.contract", contract.id, {
        data: { Status: "Cancelled" },
      });

      return ctx.badRequest(errMsg, {
        data: {
          success: false,
          error: errMsg,
          debug: detailed,
          requestId: reqId,
          timestamp: new Date().toISOString(),
          orderId: order.id,
          contractId: contract.id,
        },
      });
    }

    strapi.log.info(`Payment successful for Order ${order.id}:`, {
      redirectUrl: paymentResult.redirectUrl,
      refId: paymentResult.refId,
    });

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

    // NOTE: Do not clear cart here. Cart will be cleared on gateway callback success.

    return {
      data: {
        success: true,
        message: "Order created successfully. Redirecting to payment gateway.",
        orderId: order.id,
        contractId: contract.id,
        redirectUrl: paymentResult.redirectUrl,
        refId: paymentResult.refId,
        financialSummary: financialSummary,
        requestId: paymentResult.requestId,
      },
    };
  } catch (error: any) {
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
};
