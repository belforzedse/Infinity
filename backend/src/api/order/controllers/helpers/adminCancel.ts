import type { Strapi } from "@strapi/strapi";

export async function adminCancelOrderHandler(strapi: Strapi, ctx: any) {
  const { id } = ctx.params;
  const { reason } = ctx.request.body as { reason?: string };

  try {
    // Admin guard
    const user = ctx.state.user;
    if (!user || user.user_role?.id !== 2) {
      return ctx.forbidden("Admin access required");
    }

    // Load order
    const order = await strapi.db.query("api::order.order").findOne({
      where: { id },
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

    const fullAmount = Number(order.contract?.Amount || 0);

    // Apply changes in transaction
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
        where: { id },
        data: { Status: "Cancelled" },
      });

      await strapi.db.query("api::contract.contract").update({
        where: { id: order.contract.id },
        data: { Status: "Cancelled", Amount: 0 },
      });

      // Gateway cancel
      const txList = order.contract.contract_transactions || [];
      const lastTx = txList[txList.length - 1];
      const gatewaySource = lastTx?.external_source;
      const transactionId = order.contract.external_id;

      if (gatewaySource === "SnappPay" && transactionId) {
        const snappay = strapi.service("api::payment-gateway.snappay");
        const cancelRes = await snappay.cancelOrder(transactionId);
        if (!cancelRes.successful) {
          strapi.log.error("SnappPay cancelOrder failed", cancelRes.errorData);
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

      const refundIrr = fullAmount * 10;
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
            ReferenceId: `order-${id}-cancel-${Date.now()}`,
            user_wallet: wallet.id,
          },
        });

      // Create contract-transaction Return record
      const maxStep =
        txList.length > 0
          ? Math.max(...txList.map((t: any) => Number(t.Step || 0)))
          : 0;

      await strapi.db
        .query("api::contract-transaction.contract-transaction")
        .create({
          data: {
            Type: "Return",
            Amount: refundIrr,
            Step: maxStep + 1,
            Status: "Success",
            external_source: "System",
            contract: order.contract.id,
            Date: new Date(),
          },
        });

      // Log
      await strapi.db.query("api::order-log.order-log").create({
        data: {
          order: id,
          Action: "Update",
          Description: "Admin cancelled order",
          Changes: { reason: reason || "", refundToman: fullAmount },
          PerformedBy: `Admin User ${user.id}`,
        },
      });

      return {
        data: {
          success: true,
          refundToman: fullAmount,
          status: "cancelled",
        },
      };
    });
  } catch (error: any) {
    strapi.log.error("adminCancelOrder error", error);
    return ctx.internalServerError("Failed to cancel order", {
      data: { error: error.message },
    });
  }
}
