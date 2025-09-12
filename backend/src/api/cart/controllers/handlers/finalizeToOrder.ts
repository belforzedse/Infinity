import { Strapi } from "@strapi/strapi";

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

      if (!/^\+98\d{10}$/.test(customerMobile)) {
        return ctx.badRequest(
          "Phone number is invalid for SnappPay (must be +98XXXXXXXXXX)",
          {
            data: { success: false, error: "invalid_mobile_format" },
          }
        );
      }

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
      const externalSourceIrr = 0;
      const totalCartIrr = itemsTotalIrr + taxIrr + shippingIrr;
      const orderAmountIrr = totalCartIrr - discountIrr - externalSourceIrr;

      const baseId = `O${order.id}`;
      const suffix = (Date.now() % 1000).toString();
      let transactionId = `${baseId}${suffix}`;
      if (transactionId.length > 10) transactionId = transactionId.slice(0, 10);

      const frontendBase = process.env.FRONTEND_BASE_URL;
      const preferredReturnUrl =
        (process.env.SNAPPAY_RETURN_URL &&
          process.env.SNAPPAY_RETURN_URL.startsWith("http") &&
          process.env.SNAPPAY_RETURN_URL) ||
        (frontendBase &&
          `${frontendBase.replace(/\/$/, "")}/api/snapp/return`) ||
        absoluteCallback;

      const snappPayload = {
        amount: orderAmountIrr,
        discountAmount: discountIrr,
        externalSourceAmount: externalSourceIrr,
        mobile: customerMobile,
        paymentMethodTypeDto: "INSTALLMENT" as const,
        returnURL: preferredReturnUrl,
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
        strapi.log.error("Failed to persist SnappPay contract-transaction", e);
      }

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
        strapi.log.error("Failed to update contract as Credit (SnappPay)", e);
      }

      paymentResult = {
        success: true,
        refId: tokenResp.response.paymentToken,
        redirectUrl: tokenResp.response.paymentPageUrl,
        requestId: transactionId,
      };
    } else {
      const paymentService = strapi.service("api::payment-gateway.mellat-v3");
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
        strapi.log.error("Failed to write order-log for gateway failure", e);
      }

      await strapi.entityService.update("api::order.order", order.id, {
        data: { Status: "Cancelled" },
      });
      await strapi.entityService.update("api::contract.contract", contract.id, {
        data: { Status: "Cancelled" },
      });

      return ctx.badRequest(paymentResult.error || "Payment gateway error", {
        data: {
          success: false,
          error: paymentResult.error || "Payment gateway error",
          debug: paymentResult.detailedError || {},
          requestId: paymentResult.requestId,
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
