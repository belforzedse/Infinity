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
    if (!shipping) {
      return ctx.badRequest("Shipping information is required");
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
