import type { Strapi } from "@strapi/strapi";
import { computeTotals } from "../../../cart/services/lib/financials";
import { mapToSnappayCategory } from "../../../payment-gateway/services/snappay-category-mapper";

type ItemAdjustment = {
  orderItemId: number;
  newCount?: number;
  remove?: boolean;
};

export async function adminAdjustItemsHandler(strapi: Strapi, ctx: any) {
  const { id } = ctx.params;
  const { items, reason } = ctx.request.body as {
    items: ItemAdjustment[];
    reason?: string;
  };
  const isDryRun = ctx.query.dryRun === "true";

  try {
    // Admin guard
    const user = ctx.state.user;
    const roleId =
      typeof user?.user_role === "object"
        ? user.user_role?.id
        : user?.user_role;
    if (!user || Number(roleId) !== 2) {
      return ctx.forbidden("Admin access required");
    }

    // Load order with all relations
    const order = await strapi.db.query("api::order.order").findOne({
      where: { id },
      populate: {
        order_items: {
          populate: {
            product_variation: {
              populate: {
                product_stock: true,
                product: { populate: { product_main_category: true } },
              },
            },
          },
        },
        delivery_address: {
          populate: {
            shipping_city: {
              populate: {
                shipping_province: true,
              },
            },
          },
        },
        contract: {
          populate: {
            contract_transactions: true,
          },
        },
        shipping: true,
      },
    });

    if (!order) {
      return ctx.notFound("Order not found");
    }

    // Preconditions
    if (!["Paying", "Started"].includes(order.Status)) {
      return ctx.badRequest("Order status does not allow editing", {
        data: { error: "invalid_status" },
      });
    }

    if (order.ShippingBarcode) {
      return ctx.conflict("Shipping barcode exists; void it first", {
        data: { error: "barcode_exists" },
      });
    }

    // Normalize typing for TS (Strapi returns unknown)
    const orderItemsArr = (order.order_items || []) as any[];

    // Validate and compute changes
    const orderItemsMap = new Map(orderItemsArr.map((it: any) => [it.id, it]));
    const changes: Array<{
      orderItemId: number;
      oldCount: number;
      newCount: number;
      productTitle: string;
      restockDelta: number;
    }> = [];

    for (const adj of items) {
      const item = orderItemsMap.get(adj.orderItemId);
      if (!item) continue;

      const oldCount = Number(item.Count || 0);
      let newCount = adj.remove
        ? 0
        : Math.min(oldCount, Number(adj.newCount ?? oldCount));

      if (newCount > oldCount) {
        return ctx.badRequest("Cannot increase quantity", {
          data: { error: "invalid_count", itemId: adj.orderItemId },
        });
      }

      if (newCount !== oldCount) {
        changes.push({
          orderItemId: item.id,
          oldCount,
          newCount,
          productTitle: item.ProductTitle || "Unknown",
          restockDelta: oldCount - newCount,
        });
      }
    }

    if (changes.length === 0) {
      return ctx.badRequest("No changes to apply");
    }

    const originalSubtotal = orderItemsArr.reduce(
      (sum, it: any) => sum + Number(it.PerAmount || 0) * Number(it.Count || 0),
      0
    );

    // Recompute financials
    let newSubtotal = 0;
    for (const it of orderItemsArr) {
      const change = changes.find((c) => c.orderItemId === it.id);
      const count = change ? change.newCount : it.Count;
      newSubtotal += Number(it.PerAmount || 0) * count;
    }

    // Reuse original discount
    const discountAmount = Number(order.AppliedDiscountAmount || 0);

    // Recalculate shipping if Anipo
    let newShipping = Number(order.ShippingCost || 0);
    const shipping = order.shipping;
    if (shipping && shipping.Title?.toLowerCase().includes("anipo")) {
      const cityCode = order.delivery_address?.shipping_city?.Code;
      if (cityCode) {
        let totalWeight = 0;
        for (const it of orderItemsArr) {
          const change = changes.find((c) => c.orderItemId === it.id);
          const count = change ? change.newCount : it.Count;
          const weight = Number(it.product_variation?.product?.Weight || 100);
          totalWeight += weight * count;
        }

        const anipo = strapi.service("api::shipping.anipo");
        const priceRes = await anipo.barcodePrice({
          cityCode: Number(cityCode),
          weight: totalWeight || 100,
          sum: newSubtotal * 10, // IRR
        });

        if (priceRes.ok && typeof priceRes.price === "number") {
          newShipping = Math.round(priceRes.price / 10); // toman
        }
      }
    }

    const taxPercent = Number(order.contract?.TaxPercent || 10);
    const discountRate =
      originalSubtotal > 0 ? discountAmount / originalSubtotal : 0;
    const effectiveDiscount = Math.max(
      0,
      Math.min(newSubtotal, Math.round(newSubtotal * discountRate))
    );
    const newTotals = computeTotals(
      newSubtotal,
      effectiveDiscount,
      taxPercent,
      newShipping
    );

    const oldTotal = Number(order.contract?.Amount || 0);
    const paidAmount = Math.max(0, oldTotal);
    const requestedRefund = paidAmount - Math.max(newTotals.total, 0);
    // Do not refund more than originally paid and exclude tax from the refund.
    const refundableWithoutTax = Math.max(
      0,
      requestedRefund - Math.max(newTotals.tax, 0)
    );
    const refundToman = Math.max(
      0,
      Math.min(paidAmount, refundableWithoutTax)
    );

    if (isDryRun) {
      return {
        data: {
          preview: {
            changes,
            newTotals,
            oldTotal,
            refundToman,
            newShipping,
          },
        },
      };
    }

    // Check if all items removed
    const allRemoved = order.order_items.every((it: any) =>
      changes.some((c) => c.orderItemId === it.id && c.newCount === 0)
    );

    // Apply changes in transaction
    let snappayToken: string | undefined;
    let snappayPayload: any = null;
    let snappayAction: "update" | "cancel" | undefined;

    return await strapi.db.transaction(async () => {
      // Update or delete order items
      for (const change of changes) {
        if (change.newCount === 0) {
          await strapi.db
            .query("api::order-item.order-item")
            .delete({ where: { id: change.orderItemId } });
        } else {
          await strapi.db.query("api::order-item.order-item").update({
            where: { id: change.orderItemId },
            data: { Count: change.newCount },
          });
        }
      }

      // Restock
      for (const change of changes) {
        const item = orderItemsMap.get(change.orderItemId) as any;
        const stockId = item?.product_variation?.product_stock?.id;
        if (stockId && change.restockDelta > 0) {
          const stock = await strapi.db
            .query("api::product-stock.product-stock")
            .findOne({ where: { id: stockId } });
          if (stock) {
            await strapi.db.query("api::product-stock.product-stock").update({
              where: { id: stockId },
              data: { Count: Number(stock.Count || 0) + change.restockDelta },
            });
          }
        }
      }

      // Update order
      await strapi.db.query("api::order.order").update({
        where: { id },
        data: {
          ShippingCost: newShipping,
          Status: allRemoved ? "Cancelled" : order.Status,
        },
      });

      // Update contract
      const contract = order.contract;
      const contractId = contract?.id;
      if (contractId) {
        await strapi.db.query("api::contract.contract").update({
          where: { id: contractId },
          data: {
            Amount: allRemoved ? 0 : newTotals.total,
            Status: allRemoved ? "Cancelled" : contract.Status,
          },
        });
      }

      // Determine gateway and refund
      const txList = contract?.contract_transactions || [];
      const snappayTx = [...txList].reverse().find((tx: any) => {
        const source = tx?.external_source || contract?.external_source;
        return source === "SnappPay" && tx?.TrackId;
      });
      const gatewaySource =
        snappayTx?.external_source || contract?.external_source;
      const paymentToken = snappayTx?.TrackId;
      const transactionId = contract?.external_id;

      if (gatewaySource === "SnappPay") {
        if (!transactionId) {
          throw new Error("SNAPPAY_TRANSACTION_ID_MISSING");
        }
        if (!paymentToken) {
          throw new Error("SNAPPAY_PAYMENT_TOKEN_MISSING");
        }
        snappayToken = paymentToken;
        const snappay = strapi.service("api::payment-gateway.snappay");

        if (allRemoved) {
          // Full cancel
          const cancelRes = await snappay.cancelOrder(
            transactionId,
            paymentToken
          );
          if (!cancelRes.successful) {
            throw new Error(
              `SNAPPAY_CANCEL_FAILED:${cancelRes.errorData?.message || ""}`
            );
          }
          snappayAction = "cancel";
        } else {
          // Update
          const payload = await buildSnappPayUpdatePayload(
            strapi,
            transactionId,
            paymentToken,
            order,
            changes,
            newTotals,
            newShipping
          );
          const updateRes = await snappay.update(payload);
          if (!updateRes.successful) {
            throw new Error(
              `SNAPPAY_UPDATE_FAILED:${updateRes.errorData?.message || ""}`
            );
          }
          snappayPayload = payload;
          snappayAction = "update";
        }
      }

      // Refund to wallet
      const userId = order.user?.id || order.user;
      let wallet = await strapi.db
        .query("api::local-user-wallet.local-user-wallet")
        .findOne({ where: { user: userId } });

      if (!wallet) {
        wallet = await strapi.db
          .query("api::local-user-wallet.local-user-wallet")
          .create({
            data: {
              user: userId,
              Balance: 0,
              LastTransactionDate: new Date(),
            },
          });
      }

      const refundIrr = refundToman * 10;
      await strapi.db.query("api::local-user-wallet.local-user-wallet").update({
        where: { id: wallet.id },
        data: {
          Balance: Number(wallet.Balance || 0) + refundIrr,
          LastTransactionDate: new Date(),
        },
      });

      await strapi.db
        .query(
          "api::local-user-wallet-transaction.local-user-wallet-transaction"
        )
        .create({
          data: {
            Amount: refundIrr,
            Type: "Add",
            Date: new Date(),
            Cause: allRemoved
              ? "Order Cancelled (Admin)"
              : "Order Adjustment (Admin)",
            ReferenceId: `order-${id}-adj-${Date.now()}`,
            user_wallet: wallet.id,
          },
        });

      // Create contract-transaction Return record
      const maxStep =
        txList.length > 0
          ? Math.max(...txList.map((t: any) => Number(t.Step || 0)))
          : 0;

      if (contractId) {
        await strapi.db
          .query("api::contract-transaction.contract-transaction")
          .create({
            data: {
              Type: "Return",
              Amount: refundIrr,
              Step: maxStep + 1,
              Status: "Success",
              external_source: "System",
              contract: contractId,
              Date: new Date(),
            },
          });
      }

      // Log
      await strapi.db.query("api::order-log.order-log").create({
        data: {
          order: id,
          Action: "Update",
          Description: allRemoved
            ? "Admin cancelled order (all items removed)"
            : "Admin adjusted order items",
          Changes: {
            changes,
            refundToman,
            newTotals,
            reason: reason || "",
            snappay: snappayToken
              ? {
                  action: snappayAction,
                  token: snappayToken,
                  payload: snappayPayload,
                }
              : undefined,
          },
          PerformedBy: `Admin User ${user.id}`,
        },
      });

      return {
        data: {
          success: true,
          refundToman,
          status: allRemoved ? "cancelled" : "adjusted",
          paymentToken: snappayToken ?? null,
        },
      };
    });
  } catch (error: any) {
    strapi.log.error("adminAdjustItems error", error);
    const message = String(error?.message || "");
    if (message.startsWith("SNAPPAY_")) {
      return ctx.badGateway("SnappPay synchronization failed", {
        data: { error: message },
      });
    }
    return ctx.internalServerError("Failed to adjust items", {
      data: { error: error.message },
    });
  }
}

async function buildSnappPayUpdatePayload(
  strapi: Strapi,
  transactionId: string,
  paymentToken: string,
  order: any,
  changes: any[],
  newTotals: any,
  newShipping: number
) {
  const changeMap = new Map(changes.map((c) => [c.orderItemId, c.newCount]));
  const safeItems = (order.order_items || []) as any[];
  const filteredItems = safeItems.filter((it: any) => {
    const newCount = changeMap.get(it.id);
    return newCount === undefined ? true : newCount > 0;
  });

  // Map items with category mapping
  const cartItems = await Promise.all(
    filteredItems.map(async (it: any, idx: number) => {
      const count = changeMap.get(it.id) ?? it.Count;
      const mainCatNameFa =
        it.product_variation?.product?.product_main_category?.Name ||
        it.product_variation?.product?.Title ||
        "سایر";
      // Map the category to SnapPay's expected format
      const snappayCategory = await mapToSnappayCategory(strapi, mainCatNameFa);
      return {
        id: idx + 1,
        name: it.ProductTitle || "Product",
        category: snappayCategory,
        amount: Math.round(Number(it.PerAmount || 0) * 10),
        count: Number(count),
        commissionType: 100,
      };
    })
  );

  return {
    transactionId,
    paymentToken,
    amount: Math.round(newTotals.total * 10),
    discountAmount: Math.round(newTotals.discount * 10),
    externalSourceAmount: 0,
    cartList: [
      {
        cartId: order.id,
        cartItems,
        isShipmentIncluded: true,
        isTaxIncluded: true,
        shippingAmount: Math.round(newShipping * 10),
        taxAmount: Math.round(newTotals.tax * 10),
        totalAmount: Math.round(newTotals.total * 10),
      },
    ],
  };
}
