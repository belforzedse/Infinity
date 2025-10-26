import type { Strapi } from "@strapi/strapi";
import { computeTotals } from "../../../cart/services/lib/financials";
import { mapToSnappayCategory } from "../../../payment-gateway/services/snappay-category-mapper";

type ItemAdjustment = {
  orderItemId: number;
  newCount?: number;
  remove?: boolean;
};

// Rate limiting cache for SnappPay update calls
// Key: orderId-transactionId, Value: timestamp of last call
const snappayUpdateCache = new Map<string, number>();
const SNAPPAY_UPDATE_COOLDOWN_MS = 30000; // 30 seconds cooldown between updates
const CACHE_CLEANUP_THRESHOLD_MS = 300000; // 5 minutes

// Clean up old cache entries to prevent memory leaks
function cleanupCache() {
  const now = Date.now();
  for (const [key, timestamp] of snappayUpdateCache.entries()) {
    if (now - timestamp > CACHE_CLEANUP_THRESHOLD_MS) {
      snappayUpdateCache.delete(key);
    }
  }
}

const computePaidAmountToman = (order: any): number => {
  const txList = order?.contract?.contract_transactions || [];
  let paidIrr = 0;

  if (Array.isArray(txList) && txList.length > 0) {
    for (const tx of txList) {
      const amountIrr = Number(tx?.Amount || 0);
      if (!amountIrr) continue;
      const discountIrr = Number(tx?.DiscountAmount || 0);
      const type = String(tx?.Type || "").toLowerCase();
      const status = String(tx?.Status || "").toLowerCase();

      if (type === "gateway" && status !== "failed") {
        paidIrr += amountIrr - discountIrr;
      } else if (type === "return") {
        paidIrr -= amountIrr;
      }
    }
  } else {
    const fallback = Number(order?.contract?.Amount || 0);
    if (fallback > 0) {
      return fallback;
    }
  }

  const paidToman = Math.round(paidIrr / 10);
  if (paidToman > 0) return paidToman;

  const fallback = Number(order?.contract?.Amount || 0);
  return Math.max(0, fallback);
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

    const orderIdNum = Number(id);
    if (!Number.isFinite(orderIdNum)) {
      return ctx.badRequest("Invalid order id");
    }

    // Load order with all relations
    const order = await strapi.db.query("api::order.order").findOne({
      where: { id: orderIdNum },
      populate: {
        user: true,
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

    // Tax is completely disabled (always 0)
    const discountRate =
      originalSubtotal > 0 ? discountAmount / originalSubtotal : 0;
    const effectiveDiscount = Math.max(
      0,
      Math.min(newSubtotal, Math.round(newSubtotal * discountRate))
    );
    const newTotals = computeTotals(
      newSubtotal,
      effectiveDiscount,
      newShipping
    );

    const oldTotal = Number(order.contract?.Amount || 0);
    const paidAmount = computePaidAmountToman(order);
    const requestedRefund = paidAmount - Math.max(newTotals.total, 0);
    // Calculate refund (tax is disabled, so no tax exclusion)
    const refundToman = Math.max(
      0,
      Math.min(paidAmount, requestedRefund)
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
        where: { id: orderIdNum },
        data: {
          ShippingCost: newShipping,
          Status: allRemoved ? "Cancelled" : order.Status,
        },
      });

      // Update contract
      const contract = order.contract;
      const contractIdNum = Number(contract?.id);
      if (Number.isFinite(contractIdNum)) {
        await strapi.db.query("api::contract.contract").update({
          where: { id: contractIdNum },
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
          const cacheKey = `${orderIdNum}-${transactionId}-cancel`;
          const lastCall = snappayUpdateCache.get(cacheKey);
          const now = Date.now();

          // Rate limiting: prevent duplicate cancel calls within cooldown period
          if (lastCall && now - lastCall < SNAPPAY_UPDATE_COOLDOWN_MS) {
            const waitTime = Math.ceil((SNAPPAY_UPDATE_COOLDOWN_MS - (now - lastCall)) / 1000);
            strapi.log.warn("SnappPay cancel call blocked by rate limiter", {
              orderId: orderIdNum,
              transactionId,
              lastCallAgo: now - lastCall,
              waitSeconds: waitTime,
            });
            throw new Error(
              `SNAPPAY_RATE_LIMIT: Please wait ${waitTime} seconds before cancelling again`
            );
          }

          const cancelRes = await snappay.cancelOrder(
            transactionId,
            paymentToken
          );
          if (!cancelRes.successful) {
            throw new Error(
              `SNAPPAY_CANCEL_FAILED:${cancelRes.errorData?.message || ""}`
            );
          }

          // Update cache on successful call
          snappayUpdateCache.set(cacheKey, now);
          // Clean old entries from cache (older than 5 minutes)
          cleanupCache();

          snappayAction = "cancel";
        } else {
          // Update
          const cacheKey = `${orderIdNum}-${transactionId}-update`;
          const lastCall = snappayUpdateCache.get(cacheKey);
          const now = Date.now();

          // Rate limiting: prevent duplicate update calls within cooldown period
          if (lastCall && now - lastCall < SNAPPAY_UPDATE_COOLDOWN_MS) {
            const waitTime = Math.ceil((SNAPPAY_UPDATE_COOLDOWN_MS - (now - lastCall)) / 1000);
            strapi.log.warn("SnappPay update call blocked by rate limiter", {
              orderId: orderIdNum,
              transactionId,
              lastCallAgo: now - lastCall,
              waitSeconds: waitTime,
            });
            throw new Error(
              `SNAPPAY_RATE_LIMIT: Please wait ${waitTime} seconds before updating again`
            );
          }

          const payload = await buildSnappPayUpdatePayload(
            strapi,
            transactionId,
            paymentToken,
            order,
            changes,
            newTotals,
            newShipping
          );
          strapi.log.info("SnappPay update payload being sent", {
            orderId: orderIdNum,
            transactionId,
            amount: payload.amount,
            totalAmount: payload.cartList[0].totalAmount,
            discountAmount: payload.discountAmount,
            hasPaymentMethodTypeDto: !!payload.paymentMethodTypeDto,
          });
          const updateRes = await snappay.update(payload);
          strapi.log.info("SnappPay update response", {
            orderId: orderIdNum,
            successful: updateRes.successful,
            errorCode: updateRes.errorData?.errorCode,
            errorMessage: updateRes.errorData?.message,
          });
          if (!updateRes.successful) {
            throw new Error(
              `SNAPPAY_UPDATE_FAILED:${updateRes.errorData?.message || ""}`
            );
          }

          // Update cache on successful call
          snappayUpdateCache.set(cacheKey, now);
          // Clean old entries from cache (older than 5 minutes)
          cleanupCache();

          snappayPayload = payload;
          snappayAction = "update";
        }
      }

      // Refund to wallet (only for non-SnappPay orders)
      if (gatewaySource !== "SnappPay") {
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
              ReferenceId: `order-${orderIdNum}-adj-${Date.now()}`,
              user_wallet: wallet.id,
            },
          });

        // Create contract-transaction Return record
        const maxStep =
          txList.length > 0
            ? Math.max(...txList.map((t: any) => Number(t.Step || 0)))
            : 0;

        if (Number.isFinite(contractIdNum)) {
          await strapi.db
            .query("api::contract-transaction.contract-transaction")
            .create({
              data: {
                Type: "Return",
                Amount: refundIrr,
                Step: maxStep + 1,
                Status: "Success",
                external_source: "System",
                contract: contractIdNum,
                Date: new Date(),
              },
            });
        }
      }

      // Log
      await strapi.db.query("api::order-log.order-log").create({
        data: {
          order: orderIdNum,
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

    // Rate limit errors should return 429 Too Many Requests
    if (message.startsWith("SNAPPAY_RATE_LIMIT")) {
      return ctx.tooManyRequests(message.replace("SNAPPAY_RATE_LIMIT: ", ""), {
        data: { error: message, code: "RATE_LIMITED" },
      });
    }

    // Other SnappPay errors
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
      const categoryEntity =
        it.product_variation?.product?.product_main_category;
      const rawCategory =
        categoryEntity?.snappay_category ||
        categoryEntity?.Title ||
        categoryEntity?.Name ||
        "";
      // Map the category to SnapPay's expected format (returns "بدون دسته بندی" if empty)
      const snappayCategory = await mapToSnappayCategory(strapi, rawCategory);
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

  // Calculate totalAmount (before discount): subtotal + shipping (tax disabled)
  // According to SnappPay docs: totalAmount = items + shipping (BEFORE discount)
  const totalAmountBeforeDiscount = Math.round(
    (newTotals.subtotal + newShipping) * 10
  );

  return {
    transactionId,
    paymentToken,
    amount: Math.round(newTotals.total * 10), // Final total AFTER discount
    discountAmount: Math.round(newTotals.discount * 10),
    externalSourceAmount: 0,
    paymentMethodTypeDto: "INSTALLMENT" as const, // Required by SnappPay API
    cartList: [
      {
        cartId: order.id,
        cartItems,
        isShipmentIncluded: true,
        shippingAmount: Math.round(newShipping * 10),
        totalAmount: totalAmountBeforeDiscount, // Total BEFORE discount
      },
    ],
  };
}
