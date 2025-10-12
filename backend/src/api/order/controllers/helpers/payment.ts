import type { Strapi } from "@strapi/strapi";
import { autoGenerateBarcodeIfEligible } from "./autoBarcode";

export async function verifyPaymentHandler(strapi: Strapi, ctx: any) {
  // Mellat returns: ResCode, SaleOrderId, SaleReferenceId, RefId, OrderId
  const { ResCode, SaleOrderId, SaleReferenceId, RefId, OrderId } =
    (ctx.request as any).body || {};

  // SnappPay callback fields may arrive via POST body or GET query
  // Normalize from both sources and accept common aliases
  const q: any = (ctx.request as any).query || {};
  const b: any = (ctx.request as any).body || {};
  const state: string | undefined = (b.state ?? q.state) as any;
  const paymentTokenInput: string | undefined = (b.paymentToken ??
    q.paymentToken ??
    b.payment_token ??
    q.payment_token) as any;
  const transactionIdInput: string | undefined = (b.transactionId ??
    q.transactionId ??
    b.transaction_id ??
    q.transaction_id) as any;

  try {
    // Log raw request payload and query for diagnostics
    try {
      strapi.log.info("Payment callback raw input");
      strapi.log.info(
        JSON.stringify(
          {
            method: (ctx.request as any).method,
            ip: (ctx.request as any).ip,
            query: (ctx.request as any).query,
            body: (ctx.request as any).body,
            headers: {
              "content-type": (ctx.request as any).header["content-type"],
              "user-agent": (ctx.request as any).header["user-agent"],
              "x-forwarded-for": (ctx.request as any).header["x-forwarded-for"],
            },
            timestamp: new Date().toISOString(),
          },
          null,
          2
        )
      );
    } catch {}

    // Log all callback parameters for debugging
    strapi.log.info("Payment callback received:", {
      ResCode,
      SaleOrderId,
      SaleReferenceId,
      RefId,
      OrderId,
      state,
      paymentToken: paymentTokenInput,
      transactionId: transactionIdInput,
      timestamp: new Date().toISOString(),
    });

    // If this is a SnappPay flow (state provided or paymentToken present), follow SnappPay verify+settle
    if (state || paymentTokenInput || transactionIdInput) {
      // Resolve orderId and token using transactionId first (exact match), then fallback to paymentToken
      let orderId: number | undefined = OrderId
        ? parseInt(OrderId, 10)
        : undefined;
      let chosenTx: any | undefined;

      try {
        if (!orderId && transactionIdInput) {
          const exactByTx = (await strapi.entityService.findMany(
            "api::contract-transaction.contract-transaction",
            {
              filters: {
                external_source: "SnappPay",
                external_id: transactionIdInput,
              },
              populate: { contract: { populate: { order: true } } },
              sort: { createdAt: "desc" },
              limit: 1,
            }
          )) as any[];
          if (exactByTx?.length) {
            chosenTx = exactByTx[0];
            const co = chosenTx?.contract?.order;
            orderId = typeof co === "object" && co ? Number(co.id) : Number(co);
          }
        }

        if (!orderId && paymentTokenInput) {
          const byToken = (await strapi.entityService.findMany(
            "api::contract-transaction.contract-transaction",
            {
              filters: {
                external_source: "SnappPay",
                TrackId: paymentTokenInput,
              },
              populate: { contract: { populate: { order: true } } },
              sort: { createdAt: "desc" },
              limit: 1,
            }
          )) as any[];
          if (byToken?.length) {
            chosenTx = byToken[0];
            const co = chosenTx?.contract?.order;
            orderId = typeof co === "object" && co ? Number(co.id) : Number(co);
          }
        }
      } catch (e) {
        strapi.log.error(
          "Failed to resolve order from SnappPay transaction",
          e
        );
      }

      if (!orderId || isNaN(orderId)) {
        return ctx.badRequest("Invalid order ID", {
          data: {
            success: false,
            error: "Invalid order ID (SnappPay)",
            debug: {
              transactionId: transactionIdInput,
              paymentToken: paymentTokenInput,
            },
          },
        });
      }

      // SnappPay requires verify then settle using saved paymentToken (or from request)
      const snappay = strapi.service("api::payment-gateway.snappay");
      let tokenForOps = paymentTokenInput as string | undefined;
      if (!tokenForOps && chosenTx?.TrackId) tokenForOps = chosenTx.TrackId;
      if (!tokenForOps) {
        // Fallback: lookup by orderId to fetch recent transaction
        try {
          const txForOrder = (await strapi.entityService.findMany(
            "api::contract-transaction.contract-transaction",
            {
              filters: {
                external_source: "SnappPay",
                contract: { order: { id: orderId } },
              },
              sort: { createdAt: "desc" },
              limit: 1,
            }
          )) as any[];
          tokenForOps = txForOrder?.[0]?.TrackId;
          if (!chosenTx && txForOrder?.length) chosenTx = txForOrder[0];
        } catch {}
      }

      if (!tokenForOps) {
        return ctx.badRequest("Missing payment token for SnappPay", {
          data: { success: false, error: "Missing paymentToken" },
        });
      }

      // Log resolved identifiers
      try {
        strapi.log.info("SnappPay callback identifiers", {
          resolvedOrderId: orderId,
          tokenForOps,
          incomingPaymentToken: paymentTokenInput,
          incomingTransactionId: transactionIdInput,
          state,
        });
      } catch {}

      // On callback, state OK => verify+settle; FAILED => revert
      if (String(state || "OK").toUpperCase() !== "OK") {
        const revertResult = await snappay.revert(tokenForOps);
        await strapi.entityService.update("api::order.order", orderId, {
          data: { Status: "Cancelled" },
        });
        try {
          await strapi.entityService.create("api::order-log.order-log", {
            data: {
              order: orderId,
              Action: "Update",
              Description: "SnappPay callback FAILED (revert)",
              Changes: { state, transactionId: transactionIdInput },
            },
          });
        } catch {}
        return ctx.redirect(
          `https://infinity.rgbgroup.ir/payment/failure?orderId=${orderId}&transactionId=${encodeURIComponent(
            transactionIdInput || ""
          )}`
        );
      }

      const verifyResult = await snappay.verify(tokenForOps);
      try {
        strapi.log.info("SnappPay verify result", {
          successful: verifyResult?.successful,
          error: verifyResult?.errorData,
        });
      } catch {}
      if (!verifyResult?.successful) {
        await strapi.entityService.update("api::order.order", orderId, {
          data: { Status: "Cancelled" },
        });
        try {
          await strapi.entityService.create("api::order-log.order-log", {
            data: {
              order: orderId,
              Action: "Update",
              Description: "SnappPay verify failed",
              Changes: { verifyResult },
            },
          });
        } catch {}
        return ctx.redirect(
          `https://infinity.rgbgroup.ir/payment/failure?orderId=${orderId}&transactionId=${encodeURIComponent(
            transactionIdInput || ""
          )}`
        );
      }

      await strapi.entityService.update("api::order.order", orderId, {
        data: { Status: "Started" },
      });
      try {
        await strapi.entityService.create("api::order-log.order-log", {
          data: {
            order: orderId,
            Action: "Update",
            Description:
              "SnappPay verify succeeded (awaiting manual settlement)",
            Changes: { transactionId: transactionIdInput },
          },
        });
      } catch {}
      return ctx.redirect(
        `https://infinity.rgbgroup.ir/payment/success?orderId=${orderId}&transactionId=${encodeURIComponent(
          transactionIdInput || ""
        )}`
      );
    }

    // Check if payment was successful (ResCode = 0) - Mellat
    if (ResCode !== "0") {
      // Handle different failure scenarios
      const orderId = parseInt(OrderId || SaleOrderId, 10);

      // Update order status to Cancelled if we have a valid order ID
      if (!isNaN(orderId)) {
        try {
          await strapi.entityService.update("api::order.order", orderId, {
            data: { Status: "Cancelled" },
          });
          strapi.log.info(
            `Order ${orderId} marked as Cancelled due to payment failure/cancellation`
          );
        } catch (updateError) {
          strapi.log.error(
            `Failed to update order ${orderId} status:`,
            updateError
          );
        }
      }

      // Log the specific error/cancellation
      try {
        if (!isNaN(orderId)) {
          await strapi.entityService.create("api::order-log.order-log", {
            data: {
              order: orderId,
              Action: "Update",
              Description: "Gateway callback failure/cancellation",
              Changes: { ResCode, SaleOrderId, SaleReferenceId, RefId },
            },
          });
        }
      } catch (e) {
        strapi.log.error("Failed to persist gateway failure log", e);
      }

      if (ResCode === "17") {
        strapi.log.info("Payment cancelled by user:", { orderId, ResCode });
        // User cancelled - redirect to frontend cancellation page
        ctx.redirect(
          `https://infinity.rgbgroup.ir/payment/cancelled?orderId=${orderId}&reason=user-cancelled`
        );
      } else {
        strapi.log.error("Payment failed with ResCode:", ResCode);
        // Other payment failures - redirect to frontend failure page
        ctx.redirect(
          `https://infinity.rgbgroup.ir/payment/failure?orderId=${orderId}&error=${encodeURIComponent(
            `Payment failed with code: ${ResCode}`
          )}`
        );
      }
      return;
    }

    // Mellat: verify and settle
    const paymentService = strapi.service("api::payment-gateway.mellat-v3");
    const verificationResult = await paymentService.verifyTransaction({
      orderId: OrderId || SaleOrderId,
      saleOrderId: SaleOrderId,
      saleReferenceId: SaleReferenceId,
    });

    if (verificationResult.success) {
      // Get the order from OrderId
      const orderId = parseInt(OrderId || SaleOrderId, 10);
      if (isNaN(orderId)) {
        return ctx.badRequest("Invalid order ID", {
          data: {
            success: false,
            error: "Invalid order ID",
          },
        });
      }

      // Settle the transaction
      const settlementResult = await paymentService.settleTransaction({
        orderId: OrderId || SaleOrderId,
        saleOrderId: SaleOrderId,
        saleReferenceId: SaleReferenceId,
      });

      if (settlementResult.success) {
        // Update order status to Started (Paid)
        // Decrement stock for each order item NOW (after settlement)
        try {
          const orderWithItems = await strapi.entityService.findOne(
            "api::order.order",
            orderId,
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
          strapi.log.error("Failed to decrement stock after settlement", e);
        }

        await strapi.entityService.update("api::order.order", orderId, {
          data: {
            Status: "Started",
          },
        });
        try {
          await autoGenerateBarcodeIfEligible(strapi, Number(orderId));
        } catch {}

        strapi.log.info(`Payment successful for Order ${orderId}:`, {
          orderId,
          ResCode,
          SaleReferenceId,
          settlementResult: settlementResult.resCode,
        });

        // Audit log for successful payment callback
        try {
          await strapi.entityService.create("api::order-log.order-log", {
            data: {
              order: orderId,
              Action: "Update",
              Description: "Gateway callback success (verify+settle)",
              Changes: { ResCode, SaleOrderId, SaleReferenceId, RefId },
            },
          });
        } catch (e) {
          strapi.log.error("Failed to persist gateway success log", e);
        }

        // Redirect to frontend success page
        ctx.redirect(
          `https://infinity.rgbgroup.ir/payment/success?orderId=${orderId}`
        );
      } else {
        // Settlement failed
        console.error("Payment settlement failed:", settlementResult.error);
        try {
          await strapi.entityService.create("api::order-log.order-log", {
            data: {
              order: orderId,
              Action: "Update",
              Description: "Gateway settlement failed",
              Changes: {
                error: settlementResult.error,
                SaleOrderId,
                SaleReferenceId,
                RefId,
              },
            },
          });
        } catch (e) {
          strapi.log.error(
            "Failed to persist gateway settlement failure log",
            e
          );
        }
        ctx.redirect(
          `https://infinity.rgbgroup.ir/payment/failure?error=${encodeURIComponent(
            settlementResult.error || "Settlement failed"
          )}`
        );
      }
    } else {
      // Log the failure
      console.error("Payment verification failed:", verificationResult.error);
      try {
        const orderId = parseInt(OrderId || SaleOrderId, 10);
        if (!isNaN(orderId)) {
          await strapi.entityService.create("api::order-log.order-log", {
            data: {
              order: orderId,
              Action: "Update",
              Description: "Gateway verification failed",
              Changes: {
                error: verificationResult.error,
                SaleOrderId,
                SaleReferenceId,
                RefId,
              },
            },
          });
        }
      } catch (e) {
        strapi.log.error(
          "Failed to persist gateway verification failure log",
          e
        );
      }

      // Redirect to frontend failure page
      ctx.redirect(
        `https://infinity.rgbgroup.ir/payment/failure?error=${encodeURIComponent(
          verificationResult.error
        )}`
      );
    }
  } catch (error) {
    console.error("Error in payment verification callback:", error);
    try {
      const orderId = parseInt(OrderId || SaleOrderId, 10);
      if (!isNaN(orderId)) {
        await strapi.entityService.create("api::order-log.order-log", {
          data: {
            order: orderId,
            Action: "Update",
            Description: "Gateway callback internal error",
            Changes: { message: (error as any).message },
          },
        });
      }
    } catch (e) {
      strapi.log.error("Failed to persist gateway internal error log", e);
    }
    ctx.redirect(
      `https://infinity.rgbgroup.ir/payment/failure?error=${encodeURIComponent(
        "Internal server error"
      )}`
    );
  }
}
