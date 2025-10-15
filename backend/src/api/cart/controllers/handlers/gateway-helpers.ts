import { Strapi } from "@strapi/strapi";
import { mapToSnappayCategory } from "../../../payment-gateway/services/snappay-category-mapper";

type FinancialSummary = {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
};

type SnappRequestParams = {
  order: any;
  contract: any;
  financialSummary: FinancialSummary;
  userId: number;
  mobile?: string;
  absoluteCallback: string;
};

export const normalizeIranMobile = (rawPhone?: string): string => {
  const onlyDigits = String(rawPhone || "").replace(/\D/g, "");
  let d = onlyDigits;
  if (d.startsWith("0")) d = `98${d.substring(1)}`;
  if (!d.startsWith("98") && d.length === 10) d = `98${d}`;
  return d ? `+${d}` : "";
};

export const requestSnappPayment = async (
  strapi: Strapi,
  ctx: any,
  params: SnappRequestParams
): Promise<{ response?: any; paymentResult?: any }> => {
  const {
    order,
    contract,
    financialSummary,
    userId,
    mobile,
    absoluteCallback,
  } = params;

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
    userId
  );

  const customerMobile = normalizeIranMobile(mobile || userRecord?.Phone);
  if (!/^\+98\d{10}$/.test(customerMobile)) {
    return {
      response: ctx.badRequest(
        "Phone number is invalid for SnappPay (must be +98XXXXXXXXXX)",
        { data: { success: false, error: "invalid_mobile_format" } }
      ),
    };
  }

  // SnappPay expects mobile as +98XXXXXXXXXX (with leading plus); keep E.164 format
  const mobileForSnapp = customerMobile;

  const mapCommissionType = () => 100 as const;

  // Map items with proper category mapping
  const items = await Promise.all(
    (orderItems || []).map(async (it: any) => {
      const pname =
        it.ProductTitle || it.product_variation?.product?.Title || "Item";
      const categoryEntity =
        it.product_variation?.product?.product_main_category;
      const rawCategory =
        categoryEntity?.snappay_category ||
        categoryEntity?.Title ||
        categoryEntity?.Name ||
        "";
      // Map the category to SnapPay's expected format (returns "بدون دسته بندی" if empty)
      const snappayCategory = await mapToSnappayCategory(strapi, rawCategory);
      const perAmountToman = Math.round(it.PerAmount || 0);
      const perAmountIrr = perAmountToman * 10;
      return {
        amount: perAmountIrr,
        category: snappayCategory,
        count: Math.round(it.Count || 1),
        id: it.product_variation?.id || it.id,
        name: pname,
        commissionType: mapCommissionType(),
      };
    })
  );

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
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  // SnappPay requires unique transactionId (5-10 chars, include letters)
  let transactionId = `${baseId}${rand}`.slice(0, 10);

  const frontendBase = process.env.FRONTEND_BASE_URL;
  const preferredReturnUrl =
    (process.env.SNAPPAY_RETURN_URL &&
      process.env.SNAPPAY_RETURN_URL.startsWith("http") &&
      process.env.SNAPPAY_RETURN_URL) ||
    (frontendBase && `${frontendBase.replace(/\/$/, "")}/api/snapp/return`) ||
    absoluteCallback;

  const snappPayload = {
    amount: orderAmountIrr,
    discountAmount: discountIrr,
    externalSourceAmount: externalSourceIrr,
    mobile: mobileForSnapp,
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
    strapi.log.info("SnappPaay eligible check before token", {
      orderId: order.id,
      amountIRR: orderAmountIrr,
    });
    const eligible = await snappay.eligible(orderAmountIrr);
    strapi.log.info("SnappPay eligible response", {
      successful: eligible?.successful,
      eligible: eligible?.response?.eligible,
      title: eligible?.response?.title_message,
      error: eligible?.errorData,
    });
    if (eligible?.successful === false) {
      return {
        response: ctx.badRequest("SnappPay eligibility check failed", {
          data: { success: false, error: eligible?.errorData },
        }),
      };
    }
    if (
      eligible?.successful &&
      eligible.response &&
      eligible.response.eligible === false
    ) {
      return {
        response: ctx.badRequest("SnappPay not eligible for this amount", {
          data: { success: false, message: "SnappPay ineligible" },
        }),
      };
    }
  } catch {}

  strapi.log.info("SnappPay token request payload", {
    orderId: order.id,
    transactionId,
    returnURL: snappPayload.returnURL,
    mobileHasPlus: snappPayload.mobile.startsWith("+"),
    mobilePatternOk: /^\+98\d{10}$/.test(snappPayload.mobile),
    items: items.length,
    cartTotal: totalCartIrr,
  });
  let tokenResp;
  try {
    tokenResp = await snappay.requestPaymentToken(snappPayload);
  } catch (err: any) {
    // Defensive: cancel order/contract on hard errors too
    try {
      await strapi.entityService.update("api::order.order", order.id, {
        data: { Status: "Cancelled" },
      });
      await strapi.entityService.update("api::contract.contract", contract.id, {
        data: { Status: "Cancelled" },
      });
    } catch {}
    return {
      response: ctx.badRequest("SnappPay token request failed", {
        data: { success: false, error: { message: err?.message } },
      }),
    };
  }
  strapi.log.info("SnappPay token response raw", {
    successful: tokenResp?.successful,
    hasPaymentPageUrl: !!tokenResp?.response?.paymentPageUrl,
    error: tokenResp?.errorData,
  });
  if (
    !tokenResp ||
    !tokenResp.successful ||
    !tokenResp.response?.paymentPageUrl
  ) {
    await strapi.entityService.update("api::order.order", order.id, {
      data: { Status: "Cancelled" },
    });
    await strapi.entityService.update("api::contract.contract", contract.id, {
      data: { Status: "Cancelled" },
    });
    return {
      response: ctx.badRequest(
        tokenResp?.errorData?.message || "SnappPay error",
        {
          data: { success: false, error: tokenResp?.errorData },
        }
      ),
    };
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
          Amount: Math.round(contract.Amount || 0) * 10,
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
    await strapi.entityService.update("api::contract.contract", contract.id, {
      data: {
        Type: "Credit",
        external_source: "SnappPay",
        external_id: transactionId,
      },
    });
  } catch (e) {
    strapi.log.error("Failed to update contract as Credit (SnappPay)", e);
  }

  return {
    paymentResult: {
      success: true,
      refId: tokenResp.response.paymentToken,
      redirectUrl: tokenResp.response.paymentPageUrl,
      requestId: transactionId,
    },
  };
};

export const requestMellatPayment = async (
  strapi: Strapi,
  params: {
    orderId: number;
    amount: number;
    userId: number;
    callbackURL?: string;
    contractId?: number;
  }
): Promise<any> => {
  const paymentService = strapi.service("api::payment-gateway.mellat-v3");
  return await paymentService.requestPayment({
    orderId: params.orderId,
    amount: params.amount,
    userId: params.userId,
    callbackURL: params.callbackURL,
    contractId: params.contractId,
  });
};
