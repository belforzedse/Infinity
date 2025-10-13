import type { Strapi } from "@strapi/strapi";
import { autoGenerateBarcodeIfEligible } from "./autoBarcode";

async function loadOrder(strapi: Strapi, orderId: number) {
  return strapi.entityService.findOne("api::order.order", orderId, {
    populate: {
      contract: {
        populate: {
          contract_transactions: true,
        },
      },
      order_items: {
        populate: {
          product_variation: {
            populate: {
              product_stock: true,
            },
          },
        },
      },
    },
  }) as Promise<any>;
}

function resolveSnappayToken(order: any): { token?: string; source?: string } {
  const contract = order?.contract;
  if (!contract) return {};
  const txList = contract?.contract_transactions || [];
  const snappayTx = [...txList]
    .reverse()
    .find((tx: any) => {
      const src = tx?.external_source || contract?.external_source;
      return src === "SnappPay" && tx?.TrackId;
    });

  return {
    token: snappayTx?.TrackId,
    source: snappayTx?.external_source || contract?.external_source,
  };
}

async function decrementStock(strapi: Strapi, order: any) {
  for (const it of order?.order_items || []) {
    const variation = it?.product_variation;
    const stockId = variation?.product_stock?.id;
    if (stockId && typeof it?.Count === "number") {
      const current = Number(variation.product_stock.Count || 0);
      const dec = Number(it.Count || 0);
      await strapi.entityService.update(
        "api::product-stock.product-stock",
        stockId,
        { data: { Count: current - dec } }
      );
    }
  }
}

export async function settleSnappayOrder(strapi: Strapi, orderId: number) {
  const order = await loadOrder(strapi, orderId);
  if (!order) {
    throw new Error("ORDER_NOT_FOUND");
  }

  const { token, source } = resolveSnappayToken(order);
  if (source !== "SnappPay") {
    return;
  }

  if (!token) {
    throw new Error("SNAPPAY_PAYMENT_TOKEN_MISSING");
  }

  const snappay = strapi.service("api::payment-gateway.snappay");
  const settleResult = await snappay.settle(token);

  const newlySettled = settleResult?.successful;
  const alreadySettled =
    newlySettled ||
    settleResult?.errorData?.errorCode === 409 ||
    /already\s+settled/i.test(
      settleResult?.errorData?.message || settleResult?.errorData?.data || ""
    );

  if (!alreadySettled) {
    throw new Error(
      `SNAPPAY_SETTLE_FAILED:${settleResult?.errorData?.message || ""}`
    );
  }

  if (newlySettled) {
    await decrementStock(strapi, order);
    try {
      await autoGenerateBarcodeIfEligible(strapi, orderId);
    } catch (err) {
      strapi.log.error("Failed to generate barcode after settlement", err);
    }
    try {
      await strapi.entityService.create("api::order-log.order-log", {
        data: {
          order: orderId,
          Action: "Update",
          Description: "SnappPay settlement completed",
        },
      });
    } catch (err) {
      strapi.log.error("Failed to persist SnappPay settlement log", err);
    }
  }
}
