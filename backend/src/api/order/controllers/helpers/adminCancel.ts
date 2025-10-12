import type { Strapi } from "@strapi/strapi";

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

export async function adminCancelOrderHandler(strapi: Strapi, ctx: any) {
  const { id } = ctx.params;
  const orderIdNum = Number(id);
  if (!Number.isFinite(orderIdNum)) {
    return ctx.badRequest("Invalid order id");
  }
  const { reason } = ctx.request.body as { reason?: string };

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

    // Load order
    const order = await strapi.db.query("api::order.order").findOne({
      where: { id: orderIdNum },
      populate: {
        order_items: {
          populate: {
            product_variation: {
              populate: {
                product_stock: true,
              },
            },
          },
        },
        contract: {
          populate: {
            contract_transactions: true,
          },
        },
      },
    });

    if (!order) {
      return ctx.notFound("Order not found");
    }

    // Preconditions
    if (!["Paying", "Started"].includes(order.Status)) {
      return ctx.badRequest("Order status does not allow cancellation", {
        data: { error: "invalid_status" },
      });
    }

    if (order.ShippingBarcode) {
      return ctx.conflict("Shipping barcode exists; void it first", {
        data: { error: "barcode_exists" },
      });
    }

    const contract = order.contract;
    const contractIdNum = Number(contract?.id);
    const paidAmount = computePaidAmountToman(order);

    // Apply changes in transaction
    let snappayToken: string | undefined;

    return await strapi.db.transaction(async () => {
      // Restock all items
      for (const item of order.order_items) {
        const stockId = item.product_variation?.product_stock?.id;
        if (stockId) {
          const stock = await strapi.db
            .query("api::product-stock.product-stock")
            .findOne({ where: { id: stockId } });
          if (stock) {
            await strapi.db.query("api::product-stock.product-stock").update({
              where: { id: stockId },
              data: {
                Count: Number(stock.Count || 0) + Number(item.Count || 0),
              },
            });
          }
        }
      }

      // Update order and contract
      await strapi.db.query("api::order.order").update({
        where: { id: orderIdNum },
        data: { Status: "Cancelled" },
      });

      if (Number.isFinite(contractIdNum)) {
        await strapi.db.query("api::contract.contract").update({
          where: { id: contractIdNum },
          data: { Status: "Cancelled", Amount: 0 },
        });
      }

      // Gateway cancel
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
        const cancelRes = await snappay.cancelOrder(transactionId, paymentToken);
        if (!cancelRes.successful) {
          throw new Error(
            `SNAPPAY_CANCEL_FAILED:${cancelRes.errorData?.message || ""}`
          );
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

      const refundIrr = paidAmount * 10;
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
            Cause: "Order Cancelled (Admin)",
            ReferenceId: `order-${orderIdNum}-cancel-${Date.now()}`,
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

      // Log
      await strapi.db.query("api::order-log.order-log").create({
        data: {
          order: orderIdNum,
          Action: "Update",
          Description: "Admin cancelled order",
          Changes: {
            reason: reason || "",
            refundToman: paidAmount,
            snappay: snappayToken
              ? { action: "cancel", token: snappayToken }
              : undefined,
          },
          PerformedBy: `Admin User ${user.id}`,
        },
      });

      return {
        data: {
          success: true,
          refundToman: paidAmount,
          status: "cancelled",
          paymentToken: snappayToken ?? null,
        },
      };
    });
  } catch (error: any) {
    strapi.log.error("adminCancelOrder error", error);
    const message = String(error?.message || "");
    if (message.startsWith("SNAPPAY_")) {
      return ctx.badGateway("SnappPay synchronization failed", {
        data: { error: message },
      });
    }
    return ctx.internalServerError("Failed to cancel order", {
      data: { error: error.message },
    });
  }
}
