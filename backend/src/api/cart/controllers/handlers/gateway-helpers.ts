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

const normalizeCellForSaman = (rawPhone?: string): string | undefined => {
  if (!rawPhone) return undefined;
  const digits = String(rawPhone).replace(/\D/g, "");
  if (!digits) return undefined;
  let normalized = digits;
  if (normalized.startsWith("0098") && normalized.length >= 14) {
    normalized = `0${normalized.slice(4)}`;
  } else if (normalized.startsWith("98") && normalized.length >= 12) {
    normalized = `0${normalized.slice(2)}`;
  } else if (!normalized.startsWith("0") && normalized.length === 10) {
    normalized = `0${normalized}`;
  }
  if (/^0\d{10}$/.test(normalized)) {
    return normalized;
  }
  return undefined;
};

const ensurePaymentGateway = async (
  strapi: Strapi,
  title: string,
  defaults: { Description?: string; IsActive?: boolean } = {}
) => {
  let gatewayEntity = (await strapi.entityService.findMany(
    "api::payment-gateway.payment-gateway",
    { filters: { Title: title }, limit: 1 }
  )) as any[];

  if (!gatewayEntity?.length) {
    const created = await strapi.entityService.create(
      "api::payment-gateway.payment-gateway",
      {
        data: {
          Title: title,
          IsActive: defaults.IsActive ?? true,
          Description: defaults.Description,
        },
      }
    );
    gatewayEntity = [created];
  }

  return gatewayEntity[0];
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
  const shippingIrr = Math.round((financialSummary.shipping || 0) * 10);
  const discountIrr = Math.round((financialSummary.discount || 0) * 10);
  const externalSourceIrr = 0;
  const totalCartIrr = itemsTotalIrr + shippingIrr;
  const orderAmountIrr = totalCartIrr - discountIrr - externalSourceIrr;

  // DEBUG: Log all amounts for troubleshooting
  strapi.log.info("SNAPPAY AMOUNT CALCULATION DEBUG", {
    orderId: order.id,
    itemCount: items.length,
    itemsTotalToman: Math.round(itemsTotalIrr / 10),
    itemsTotalIrr,
    shippingToman: Math.round(shippingIrr / 10),
    shippingIrr,
    discountToman: Math.round(discountIrr / 10),
    discountIrr,
    totalCartToman: Math.round(totalCartIrr / 10),
    totalCartIrr,
    orderAmountToman: Math.round(orderAmountIrr / 10),
    orderAmountIrr,
    contractAmount: contract.Amount,
    contractAmountInIrr: Math.round((contract.Amount || 0) * 10),
    financialSummary: {
      subtotal: financialSummary.subtotal,
      discount: financialSummary.discount,
      shipping: financialSummary.shipping,
      total: financialSummary.total,
    },
  });

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
        taxAmount: 0,
        shippingAmount: shippingIrr,
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

  // Log the complete SnappPay payload with all details
  const payloadForLog = JSON.stringify(snappPayload, null, 2);
  strapi.log.debug("========== SNAPPAY TOKEN REQUEST PAYLOAD START ==========");
  strapi.log.debug(payloadForLog);
  strapi.log.debug("========== SNAPPAY TOKEN REQUEST PAYLOAD END ==========");
  strapi.log.info("SnappPay token request summary", {
    orderId: order.id,
    transactionId,
    itemCount: items.length,
    cartTotalIRR: totalCartIrr,
    cartTotalToman: Math.round(totalCartIrr / 10),
    mobileValid: /^\+98\d{10}$/.test(snappPayload.mobile),
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

  const gatewayEntity = await ensurePaymentGateway(strapi, "SnappPay", {
    Description: "Installment Gateway",
  });

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
          payment_gateway: gatewayEntity.id,
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

type SamanRequestParams = {
  order: any;
  contract: any;
  financialSummary: FinancialSummary;
  callbackURL?: string;
  userId: number;
  cellNumber?: string;
};

export const requestSamanPayment = async (
  strapi: Strapi,
  params: SamanRequestParams
) => {
  const saman = strapi.service("api::payment-gateway.saman-kish") as any;
  const amountToman = Math.round(params.contract?.Amount || 0);
  const amountIrr = amountToman * 10;

  const cellNumber =
    normalizeCellForSaman(params.cellNumber) ||
    normalizeCellForSaman(params.order?.delivery_address?.Phone) ||
    normalizeCellForSaman(
      params.order?.user?.Phone || params.order?.user?.user_info?.Phone
    );

  const paymentResult = await saman.requestPayment({
    orderId: params.order.id,
    amount: amountIrr,
    callbackURL: params.callbackURL,
    contractId: params.contract?.id,
    cellNumber,
  });

  if (!paymentResult?.success) {
    return { paymentResult };
  }

  const gatewayEntity = await ensurePaymentGateway(strapi, "Saman Kish", {
    Description: "Saman Electronic Payment (SEP)",
  });

  try {
    const discountIrr = Math.round(
      (params.financialSummary?.discount || 0) * 10
    );
    await strapi.entityService.create(
      "api::contract-transaction.contract-transaction",
      {
        data: {
          Type: "Gateway",
          Amount: amountIrr,
          DiscountAmount: discountIrr,
          Step: 1,
          Status: "Pending",
          TrackId: paymentResult.token,
          external_id: paymentResult.resNum || paymentResult.token,
          external_source: "SamanKish",
          contract: params.contract?.id,
          payment_gateway: gatewayEntity.id,
          Date: new Date(),
        },
      }
    );
  } catch (error) {
    strapi.log.error("Failed to create Saman contract-transaction", error);
  }

  try {
    if (params.contract?.id) {
      await strapi.entityService.update(
        "api::contract.contract",
        params.contract.id,
        {
          data: {
            Type: "Cash",
            external_source: "SamanKish",
            external_id: paymentResult.resNum || paymentResult.token,
          },
        }
      );
    }
  } catch (error) {
    strapi.log.error("Failed to update contract for Saman gateway", error);
  }

  try {
    await strapi.entityService.update("api::order.order", params.order.id, {
      data: {
        external_source: "SamanKish",
        external_id: paymentResult.resNum || paymentResult.token,
      },
    });
  } catch (error) {
    strapi.log.error("Failed to update order external source for Saman", error);
  }

  return {
    paymentResult: {
      success: true,
      refId: paymentResult.token,
      redirectUrl: paymentResult.redirectUrl,
      requestId: paymentResult.requestId,
      resNum: paymentResult.resNum,
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
  // TESTING: Using mellat-v2 instead of mellat-v3
  // To revert: change "mellat-v2" back to "mellat-v3"
  const paymentService = strapi.service("api::payment-gateway.mellat-v2");
  return await paymentService.requestPayment({
    orderId: params.orderId,
    amount: params.amount,
    userId: params.userId,
    callbackURL: params.callbackURL,
    contractId: params.contractId,
  });
};
