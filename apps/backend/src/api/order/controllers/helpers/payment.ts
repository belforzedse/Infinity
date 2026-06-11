import type { Strapi } from "@strapi/strapi";
import { consumeOrderReservation, releaseOrderReservation } from "../../../../utils/stockReservations";
import { decrementStockAtomic } from "../../../cart/services/lib/stock";
import { trackOrderToMatomo } from "../../../report/services/matomo-tracker";
const getFrontendBaseUrl = () =>
  (process.env.FRONTEND_BASE_URL || process.env.FRONTEND_URL || "https://infinitycolor.co").replace(
    /\/$/,
    "",
  );

const buildPaymentRedirectUrl = (
  type: "success" | "failure" | "cancelled" | "issue",
  params?: Record<string, string | number | null | undefined>,
) => {
  const base = getFrontendBaseUrl();
  const url = new URL(`${base}/payment/${type}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
};

async function incrementDiscountUsageCounter(
  strapi: Strapi,
  discountCode: string,
  orderId: number,
) {
  if (!discountCode) return; // No discount code to track

  try {
    // Find the discount by code
    const discount = await strapi.entityService.findMany("api::discount.discount", {
      filters: { Code: discountCode },
      limit: 1,
    });

    if (!discount || !discount[0]) {
      strapi.log.warn(
        `Discount code "${discountCode}" not found when incrementing usage for order ${orderId}`,
      );
      return;
    }

    const discountId = discount[0].id;
    const limitUsage = Number(discount[0].LimitUsage || 0);
    const currentUsedTimes = Number(discount[0].UsedTimes || 0);
    const discountAmount = Number(discount[0].Amount || 0);
    const discountType = discount[0].Type || "Unknown";

    // Atomically increment UsedTimes with race condition protection
    // Only increment if usage limit hasn't been reached (LimitUsage = 0 means unlimited)
    let updateResult: any;
    if (limitUsage > 0) {
      // Check limit: only increment if UsedTimes < LimitUsage
      // Note: Strapi converts camelCase to snake_case, so "UsedTimes" becomes "used_times"
      const result = await strapi.db.connection.raw(
        `UPDATE discounts
         SET used_times = used_times + 1
         WHERE id = ? AND used_times < ?
         RETURNING used_times`,
        [discountId, limitUsage],
      );

      const rows = result.rows || [];
      if (rows.length === 0) {
        // No rows updated means limit already reached or exceeded
        strapi.log.warn(
          `Discount code "${discountCode}" usage limit already reached (${currentUsedTimes}/${limitUsage})`,
          {
            orderId,
            discountId,
            discountCode,
            currentUsedTimes,
            limitUsage,
          },
        );
        return;
      }

      updateResult = { UsedTimes: rows[0].used_times };
    } else {
      // Unlimited usage - safe to increment directly
      // Note: Strapi converts camelCase to snake_case, so "UsedTimes" becomes "used_times"
      const result = await strapi.db.connection.raw(
        `UPDATE discounts
         SET used_times = used_times + 1
         WHERE id = ?
         RETURNING used_times`,
        [discountId],
      );

      const rows = result.rows || [];
      if (rows.length === 0) {
        strapi.log.warn(`Discount with id ${discountId} not found for atomic update`);
        return;
      }

      updateResult = { UsedTimes: rows[0].used_times };
    }

    const newUsedTimes = updateResult.UsedTimes;

    // Log to order-log for audit trail
    try {
      await strapi.entityService.create("api::order-log.order-log", {
        data: {
          order: orderId,
          Action: "Update",
          Description: `Discount code "${discountCode}" successfully applied`,
          Changes: {
            discountCode,
            discountId,
            discountType,
            discountAmount,
            usageTrackingBefore: currentUsedTimes,
            usageTrackingAfter: newUsedTimes,
          },
        },
      });
    } catch (logErr) {
      strapi.log.error("Failed to create discount usage audit log", logErr);
    }

    strapi.log.info(
      `Discount usage incremented atomically for code "${discountCode}" (order ${orderId}): ${currentUsedTimes} → ${newUsedTimes}`,
      {
        orderId,
        discountId,
        discountCode,
        discountType,
        discountAmount,
        limitUsage: limitUsage > 0 ? limitUsage : "unlimited",
      },
    );
  } catch (error) {
    strapi.log.error(
      `Failed to increment discount usage counter for code "${discountCode}" on order ${orderId}:`,
      error,
    );
    // Don't throw - this shouldn't block payment completion
  }
}

async function clearCartAfterPayment(strapi: Strapi, orderId?: number) {
  if (!orderId) {
    strapi.log.warn("clearCartAfterPayment called without orderId");
    return;
  }

  // Fire-and-forget, idempotent server-side ecommerce tracking. This runs only
  // on the confirmed-payment path and is fully self-contained + non-throwing, so
  // it can never block, delay, or fail the payment flow (see matomo-tracker.ts).
  void trackOrderToMatomo(strapi as any, orderId).catch(() => {});

  try {
    const order = await strapi.entityService.findOne("api::order.order", orderId, {
      populate: { user: true },
    });

    if (!order) {
      strapi.log.error("clearCartAfterPayment: Order not found", { orderId });
      return;
    }

    const userRelation: any = order?.user;
    const userId =
      typeof userRelation === "object" && userRelation
        ? userRelation.id
        : typeof userRelation === "number"
        ? userRelation
        : undefined;

    if (!userId) {
      strapi.log.error("clearCartAfterPayment: Could not extract userId from order", {
        orderId,
        userRelationType: typeof userRelation,
        userRelation: userRelation,
      });
      return;
    }

    strapi.log.info("clearCartAfterPayment: Attempting to clear cart", { orderId, userId });

    const cartService: any = strapi.service("api::cart.cart");
    if (cartService?.clearCart) {
      await cartService.clearCart(userId);
      strapi.log.info("clearCartAfterPayment: Cart cleared successfully", { orderId, userId });
    } else {
      strapi.log.error("clearCartAfterPayment: Cart service or clearCart method not available");
    }
  } catch (error: any) {
    strapi.log.error("Failed to clear cart after payment", {
      orderId,
      error: error?.message || error,
      stack: error?.stack,
    });
  }
}

/**
 * Handles post-payment stock decrement with reservation awareness.
 * For reserved orders, consumes the reservation atomically.
 * For legacy orders, decrements stock directly.
 * @param strapi - Strapi instance
 * @param orderId - Order ID
 * @param gateway - Gateway name for logging context (e.g., "Saman", "SnappPay", "Mellat")
 * @returns Promise with success status, errors array, and optional expired flag
 */
async function handlePostPaymentStock(
  strapi: Strapi,
  orderId: number,
  gateway: string,
): Promise<{ success: boolean; errors?: any[]; expired?: boolean }> {
  try {
    // Load order with ReservationStatus field only (lightweight query)
    const orderMeta: any = await strapi.entityService.findOne("api::order.order", orderId, {
      fields: ["ReservationStatus"],
    } as any);

    if (orderMeta?.ReservationStatus === "Reserved") {
      // Reserved orders: consume reservation (Count-- and ReservedCount--) atomically
      const consumeRes = await strapi.db.transaction(async ({ trx }) =>
        consumeOrderReservation(strapi as any, Number(orderId), trx),
      );

      if (consumeRes?.expired) {
        strapi.log.error(`Reservation expired after ${gateway} settlement`, {
          orderId,
        });
        return { success: false, expired: true, errors: [{ error: "Reservation expired" }] };
      }

      if (consumeRes?.success === false) {
        strapi.log.error(`Failed to consume reservation after ${gateway} settlement`, {
          orderId,
          error: consumeRes?.error,
        });
        return {
          success: false,
          errors: [{ error: consumeRes?.error || "Failed to consume reservation" }],
        };
      }

      return { success: true };
    } else {
      // Legacy path: decrement stock atomically
      // Load order with populated order_items
      const orderWithItems = await strapi.entityService.findOne("api::order.order", orderId, {
        populate: {
          order_items: {
            populate: {
              product_variation: { populate: { product_stock: true } },
            },
          },
        },
      });

      const stockErrors: any[] = [];

      // Map order items to decrement promises with metadata
      const decrementPromises = (orderWithItems?.order_items || []).map((it) => {
        const v = it?.product_variation;
        if (v?.product_stock?.id && typeof it?.Count === "number") {
          const stockId = v.product_stock.id as number;
          const quantity = Number(it.Count || 0);
          const variationId = v.id;

          return {
            promise: decrementStockAtomic(strapi, stockId, quantity),
            metadata: { stockId, quantity, variationId, orderId },
          };
        }
        return null;
      }).filter((item): item is { promise: Promise<{ success: boolean; newCount?: number; error?: string }>; metadata: { stockId: number; quantity: number; variationId: any; orderId: number } } => item !== null);

      // Execute all decrement promises in parallel
      const settledResults = await Promise.allSettled(
        decrementPromises.map((item) => item.promise)
      );

      // Process settled results to collect errors
      settledResults.forEach((result, index) => {
        const { metadata } = decrementPromises[index];
        const { stockId, quantity, variationId } = metadata;

        if (result.status === "fulfilled") {
          if (!result.value.success) {
            stockErrors.push({
              stockId,
              quantity,
              error: result.value.error,
              variationId,
            });
            strapi.log.error(`Failed to decrement stock atomically (${gateway})`, {
              orderId,
              stockId,
              quantity,
              error: result.value.error,
            });
          }
        } else {
          // Handle rejected promise
          const errorMessage = result.reason instanceof Error ? result.reason.message : String(result.reason);
          stockErrors.push({
            stockId,
            quantity,
            error: errorMessage,
            variationId,
          });
          strapi.log.error(`Failed to decrement stock atomically (${gateway})`, {
            orderId,
            stockId,
            quantity,
            error: errorMessage,
          });
        }
      });

      if (stockErrors.length > 0) {
        strapi.log.error(`Some stock decrements failed for ${gateway} payment`, {
          orderId,
          errors: stockErrors,
        });
      }

      return { success: stockErrors.length === 0, errors: stockErrors.length > 0 ? stockErrors : undefined };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    strapi.log.error(`Exception during stock handling after ${gateway} payment`, {
      orderId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      errors: [{ error: errorMessage }],
    };
  }
}

async function handleStockDecrementFailure(
  strapi: Strapi,
  ctx: any,
  params: {
    orderId: number;
    stockErrors: any[];
    refNum?: string | number;
    paymentMethod: string;
    externalSource: string;
    externalId?: string | number;
  },
) {
  const { orderId, stockErrors, refNum, paymentMethod, externalSource, externalId } = params;
  const errorMessage = `Stock decrement failed for ${stockErrors.length} item(s). Order completion halted.`;
  strapi.log.error(`Stock decrements failed for ${paymentMethod} payment - halting order completion`, {
    orderId,
    errors: stockErrors,
    refNum,
  });

  // Create order-log entry for tracking and manual retry
  try {
    await strapi.entityService.create("api::order-log.order-log", {
      data: {
        order: orderId,
        Action: "Update",
        Description: "CRITICAL: Stock decrement failures - order completion halted",
        Changes: {
          stockErrors: JSON.parse(JSON.stringify(stockErrors)),
          refNum,
          haltedAt: new Date().toISOString(),
          requiresManualRetry: true,
        },
      },
    });
  } catch (logErr) {
    strapi.log.error("Failed to create order-log for stock errors", logErr);
  }

  // A stock-decrement failure during a payment callback is a SYSTEM event, not an admin action,
  // so it is intentionally NOT written to the admin audit log. The order-log entry above is the
  // durable record; surface it loudly in the application logs for on-call review.
  strapi.log.error("CRITICAL: Stock decrement failure halted order completion", {
    orderId,
    refNum,
    stockErrors,
    paymentMethod,
    errorMessage,
    requiresManualRetry: true,
  });

  // Keep order in "Paying" status (payment succeeded but stock failed)
  // Don't transition to "Started" to prevent fulfillment of unavailable items
  try {
    await strapi.entityService.update("api::order.order", orderId, {
      data: {
        external_source: externalSource,
        external_id: (externalId ?? refNum) != null ? String(externalId ?? refNum) : undefined,
        // Status remains "Paying" - will require manual intervention
      },
    });
  } catch (err) {
    strapi.log.error("Failed to update order with gateway info after stock failure", err);
  }

  // Redirect to issue page with appropriate error code
  return ctx.redirect(
    buildPaymentRedirectUrl("issue", {
      orderId,
      code: "stock_decrement_failed",
    }),
  );
}

export async function verifyPaymentHandler(strapi: Strapi, ctx: any) {
  // Mellat returns: ResCode, SaleOrderId, SaleReferenceId, RefId, OrderId
  const { ResCode, SaleOrderId, SaleReferenceId, RefId, OrderId } = (ctx.request as any).body || {};

  // SnappPay callback fields may arrive via POST body or GET query
  // Normalize from both sources and accept common aliases
  const q: any = (ctx.request as any).query || {};
  const b: any = (ctx.request as any).body || {};
  const zarinpalAuthorityInput: string | undefined = (b.Authority ??
    q.Authority ??
    b.authority ??
    q.authority) as any;
  const zarinpalStatusInput: string | undefined = (b.Status ??
    q.Status ??
    b.status ??
    q.status) as any;
  const state: string | undefined = (b.state ?? q.state) as any;
  const paymentTokenInput: string | undefined = (b.paymentToken ??
    q.paymentToken ??
    b.payment_token ??
    q.payment_token) as any;
  const transactionIdInput: string | undefined = (b.transactionId ??
    q.transactionId ??
    b.transaction_id ??
    q.transaction_id) as any;
  const samanStateInput: any = b.State ?? q.State ?? b.STATE ?? q.STATE ?? b.state ?? q.state;
  const samanStatusInput: any =
    b.Status ?? q.Status ?? b.STATUS ?? q.STATUS ?? b.status ?? q.status;
  const samanRefNumInput: any =
    b.RefNum ?? q.RefNum ?? b.refNum ?? q.refnum ?? q.RefNum ?? b.RefNum;
  const samanResNumInput: any =
    b.ResNum ?? q.ResNum ?? b.resNum ?? q.resnum ?? q.ResNum ?? b.ResNum;
  const samanTerminalInput: any =
    b.TerminalId ??
    q.TerminalId ??
    b.terminalId ??
    q.terminalId ??
    b.MID ??
    q.MID ??
    b.mid ??
    q.mid;

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
          2,
        ),
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
      zarinpalAuthority: zarinpalAuthorityInput,
      zarinpalStatus: zarinpalStatusInput,
      samanState: samanStateInput,
      samanStatus: samanStatusInput,
      samanRefNum: samanRefNumInput,
      samanResNum: samanResNumInput,
      timestamp: new Date().toISOString(),
    });

    const isZarinPalFlow =
      !ResCode &&
      zarinpalAuthorityInput !== undefined;

    if (isZarinPalFlow) {
      const authority =
        zarinpalAuthorityInput !== undefined && zarinpalAuthorityInput !== null
          ? String(zarinpalAuthorityInput).trim()
          : "";
      const callbackStatus =
        zarinpalStatusInput !== undefined && zarinpalStatusInput !== null
          ? String(zarinpalStatusInput).trim().toUpperCase()
          : "";

      if (!authority) {
        strapi.log.error("ZarinPal callback missing authority", {
          callbackStatus,
        });
        return ctx.redirect(
          buildPaymentRedirectUrl("failure", {
            error: "Missing ZarinPal authority",
          }),
        );
      }

      let contractTransaction: any | undefined;
      const findTransaction = async (filters: any) => {
        const matches = (await strapi.entityService.findMany(
          "api::contract-transaction.contract-transaction",
          {
            filters,
            populate: { contract: { populate: { order: true } } },
            sort: { createdAt: "desc" },
            limit: 1,
          },
        )) as any[];
        return matches?.[0];
      };

      try {
        contractTransaction = await findTransaction({
          external_source: "ZarinPal",
          GatewayAuthority: authority,
        });
        if (!contractTransaction) {
          contractTransaction = await findTransaction({
            external_source: "ZarinPal",
            TrackId: authority,
          });
        }
        if (!contractTransaction) {
          contractTransaction = await findTransaction({
            external_source: "ZarinPal",
            external_id: authority,
          });
        }
      } catch (error) {
        strapi.log.error("Failed to locate ZarinPal contract transaction", {
          authority,
          error: (error as Error)?.message || error,
        });
      }

      if (!contractTransaction) {
        strapi.log.error("ZarinPal callback authority not found", { authority });
        return ctx.redirect(
          buildPaymentRedirectUrl("failure", {
            error: "ZarinPal transaction not found",
          }),
        );
      }

      const orderRelation = contractTransaction.contract?.order;
      const orderId =
        typeof orderRelation === "object" && orderRelation
          ? Number(orderRelation.id)
          : Number(orderRelation);
      const contractId =
        typeof contractTransaction.contract === "object" && contractTransaction.contract
          ? Number(contractTransaction.contract.id)
          : Number(contractTransaction.contract);

      if (!orderId || Number.isNaN(orderId) || !contractId || Number.isNaN(contractId)) {
        strapi.log.error("ZarinPal callback has invalid local references", {
          authority,
          txId: contractTransaction.id,
          orderId,
          contractId,
        });
        return ctx.redirect(
          buildPaymentRedirectUrl("failure", {
            error: "Invalid ZarinPal order reference",
          }),
        );
      }

      if (contractTransaction.Status === "Success") {
        strapi.log.info("ZarinPal callback already processed", {
          authority,
          orderId,
          txId: contractTransaction.id,
        });
        return ctx.redirect(buildPaymentRedirectUrl("success", { orderId }));
      }

      const orderEntity = (await strapi.entityService.findOne("api::order.order", orderId, {
        fields: ["Status", "ReservationStatus", "ReservedUntil", "DiscountCode"],
        populate: { contract: true },
      } as any)) as any;

      if (!orderEntity) {
        strapi.log.error("ZarinPal order not found", { orderId, authority });
        return ctx.redirect(
          buildPaymentRedirectUrl("failure", {
            error: "ZarinPal order not found",
          }),
        );
      }

      const amountToman = Math.round(
        Number(
          orderEntity?.contract?.Amount ??
            contractTransaction?.contract?.Amount ??
            Number(contractTransaction.Amount || 0) / 10,
        ),
      );

      const markFailed = async (
        reason: string,
        redirectType: "failure" | "cancelled" = "failure",
      ) => {
        try {
          await strapi.entityService.update(
            "api::contract-transaction.contract-transaction",
            contractTransaction.id,
            {
              data: {
                Status: "Failed",
                GatewayAuthority: authority,
                GatewayStatus: callbackStatus || reason,
                GatewayResponse: {
                  callbackStatus,
                  authority,
                  reason,
                },
              } as any,
            },
          );
        } catch (error) {
          strapi.log.error("Failed to mark ZarinPal transaction failed", error);
        }

        try {
          await strapi.entityService.update("api::order.order", orderId, {
            data: { Status: "Cancelled", external_source: "ZarinPal", external_id: authority },
          });
        } catch (error) {
          strapi.log.error("Failed to cancel ZarinPal order", error);
        }

        try {
          await releaseOrderReservation(strapi as any, Number(orderId), "Released");
        } catch {}

        try {
          await strapi.entityService.update("api::contract.contract", contractId, {
            data: { Status: "Cancelled", external_source: "ZarinPal", external_id: authority },
          });
        } catch (error) {
          strapi.log.error("Failed to cancel ZarinPal contract", error);
        }

        try {
          await strapi.entityService.create("api::order-log.order-log", {
            data: {
              order: orderId,
              Action: "Update",
              Description: `ZarinPal gateway callback failed: ${reason}`,
              Changes: { authority, callbackStatus, reason },
            },
          });
        } catch (error) {
          strapi.log.error("Failed to log ZarinPal failure", error);
        }

        return ctx.redirect(
          buildPaymentRedirectUrl(redirectType, {
            orderId,
            error: reason,
            reason: redirectType === "cancelled" ? "user-cancelled" : undefined,
          }),
        );
      };

      if (callbackStatus !== "OK") {
        return markFailed(callbackStatus || "NOK", "cancelled");
      }

      const zarinpalService = strapi.service("api::payment-gateway.zarinpal") as any;
      const verificationResult = await zarinpalService.verifyPayment({
        authority,
        amountToman,
      });

      if (!verificationResult?.success) {
        return markFailed(
          verificationResult?.message ||
            verificationResult?.error ||
            `Verification failed with code ${verificationResult?.code ?? "unknown"}`,
        );
      }

      const stockResult = await handlePostPaymentStock(strapi, orderId, "ZarinPal");
      const stockErrors =
        stockResult.errors && stockResult.errors.length > 0
          ? stockResult.errors
          : stockResult.success
          ? []
          : [
              {
                error: stockResult.expired
                  ? "Reservation expired"
                  : "Stock decrement failed",
              },
            ];

      if (!stockResult.success || stockErrors.length > 0) {
        try {
          await strapi.entityService.update(
            "api::contract-transaction.contract-transaction",
            contractTransaction.id,
            {
              data: {
                GatewayStatus: "VERIFIED_STOCK_FAILED",
                GatewayResponse: verificationResult.gatewayResponse,
              } as any,
            },
          );
        } catch {}
        return handleStockDecrementFailure(strapi, ctx, {
          orderId,
          stockErrors,
          refNum: verificationResult.refId || authority,
          paymentMethod: "ZarinPal",
          externalSource: "ZarinPal",
          externalId: verificationResult.refId || authority,
        });
      }

      const finalReference = verificationResult.refId || authority;
      try {
        await strapi.db.transaction(async ({ trx }) => {
          await strapi.db.query("api::order.order").update({
            where: { id: orderId },
            data: {
              Status: "Started",
              external_source: "ZarinPal",
              external_id: finalReference,
            },
            transacting: trx,
          } as any);
          await strapi.db.query("api::contract.contract").update({
            where: { id: contractId },
            data: {
              Status: "Confirmed",
              external_source: "ZarinPal",
              external_id: finalReference,
            },
            transacting: trx,
          } as any);
          await strapi.db.query("api::contract-transaction.contract-transaction").update({
            where: { id: contractTransaction.id },
            data: {
              Status: "Success",
              TrackId: authority,
              GatewayAuthority: authority,
              GatewayRefId: verificationResult.refId,
              GatewayStatus: verificationResult.alreadyVerified
                ? "ALREADY_VERIFIED"
                : "VERIFIED",
              GatewayResponse: verificationResult.gatewayResponse,
              VerifiedAt: new Date(),
              external_id: finalReference,
              external_source: "ZarinPal",
            },
            transacting: trx,
          } as any);
        });
      } catch (error) {
        strapi.log.error("Failed to finalize ZarinPal payment transaction", {
          orderId,
          authority,
          error: (error as Error)?.message || error,
        });
        return ctx.redirect(
          buildPaymentRedirectUrl("issue", {
            orderId,
            code: "zarinpal_finalize_failed",
          }),
        );
      }

      if (orderEntity?.DiscountCode) {
        await incrementDiscountUsageCounter(strapi, orderEntity.DiscountCode, orderId);
      }

      try {
        await strapi.entityService.create("api::order-log.order-log", {
          data: {
            order: orderId,
            Action: "Update",
            Description: verificationResult.alreadyVerified
              ? "ZarinPal gateway verify succeeded (already verified)"
              : "ZarinPal gateway verify succeeded",
            Changes: {
              authority,
              refId: verificationResult.refId,
              code: verificationResult.code,
            },
          },
        });
      } catch (error) {
        strapi.log.error("Failed to log ZarinPal success", error);
      }

      await clearCartAfterPayment(strapi, orderId);

      return ctx.redirect(
        buildPaymentRedirectUrl("success", {
          orderId,
          transactionId: finalReference,
        }),
      );
    }

    const isSamanFlow =
      !paymentTokenInput &&
      !transactionIdInput &&
      !ResCode &&
      (samanStateInput !== undefined ||
        samanStatusInput !== undefined ||
        samanRefNumInput !== undefined ||
        samanResNumInput !== undefined);

    if (isSamanFlow) {
      const samanService = strapi.service("api::payment-gateway.saman-kish") as any;
      const refNum =
        samanRefNumInput !== undefined && samanRefNumInput !== null
          ? String(samanRefNumInput).trim()
          : "";
      const resNumRaw =
        samanResNumInput !== undefined && samanResNumInput !== null
          ? String(samanResNumInput).trim()
          : "";
      const normalizedState =
        samanStateInput !== undefined && samanStateInput !== null
          ? String(samanStateInput).trim().toUpperCase()
          : "";
      const statusNumeric =
        samanStatusInput !== undefined &&
        samanStatusInput !== null &&
        String(samanStatusInput).trim() !== ""
          ? Number(String(samanStatusInput).replace(/\s+/g, ""))
          : NaN;
      const terminalNumber =
        samanTerminalInput !== undefined && samanTerminalInput !== null
          ? Number(String(samanTerminalInput).replace(/\s+/g, ""))
          : undefined;

      let orderId: number | undefined;
      if (resNumRaw) {
        const candidate = Number(resNumRaw.split("-")[0]);
        if (!Number.isNaN(candidate)) {
          orderId = candidate;
        }
      }

      let contractTransaction: any = undefined;
      if (resNumRaw) {
        try {
          const txMatches = (await strapi.entityService.findMany(
            "api::contract-transaction.contract-transaction",
            {
              filters: {
                external_source: "SamanKish",
                external_id: resNumRaw,
              },
              populate: { contract: { populate: { order: true } } },
              sort: { createdAt: "desc" },
              limit: 1,
            },
          )) as any[];
          if (txMatches?.length) {
            contractTransaction = txMatches[0];

            // Idempotency check: If transaction already processed successfully, skip
            if (contractTransaction.Status === "Success") {
              const existingOrderId =
                contractTransaction.contract?.order?.id || contractTransaction.contract?.order;
              if (existingOrderId) {
                strapi.log.info(
                  `Saman callback already processed (idempotency check): resNum=${resNumRaw}, orderId=${existingOrderId}`,
                  {
                    resNum: resNumRaw,
                    orderId: existingOrderId,
                    existingTxId: contractTransaction.id,
                  },
                );
                // Redirect to success page - transaction already processed
                return ctx.redirect(
                  buildPaymentRedirectUrl("success", { orderId: existingOrderId }),
                );
              }
            }
          }
        } catch (err) {
          strapi.log.error("Failed to locate Saman contract transaction by resNum", err);
        }
      }

      if (!contractTransaction && refNum) {
        try {
          const txMatches = (await strapi.entityService.findMany(
            "api::contract-transaction.contract-transaction",
            {
              filters: {
                external_source: "SamanKish",
                TrackId: refNum,
              },
              populate: { contract: { populate: { order: true } } },
              sort: { createdAt: "desc" },
              limit: 1,
            },
          )) as any[];
          if (txMatches?.length) {
            contractTransaction = txMatches[0];
          }
        } catch (err) {
          strapi.log.error("Failed to locate Saman contract transaction by refNum", err);
        }
      }

      if ((!orderId || Number.isNaN(orderId)) && contractTransaction?.contract?.order) {
        const co = contractTransaction.contract.order;
        const derivedOrderId = typeof co === "object" && co ? Number(co.id) : Number(co);
        if (!Number.isNaN(derivedOrderId)) {
          orderId = derivedOrderId;
        }
      }

      if (!orderId || Number.isNaN(orderId)) {
        strapi.log.error("Saman callback missing orderId", {
          refNum,
          resNumRaw,
          normalizedState,
        });
        return ctx.badRequest("Invalid order reference", {
          data: {
            success: false,
            error: "Invalid order reference (Saman)",
          },
        });
      }

      const orderEntity = (await strapi.entityService.findOne("api::order.order", orderId, {
        populate: {
          contract: true,
          order_items: {
            populate: {
              product_variation: { populate: { product_stock: true } },
            },
          },
        },
      })) as any;

      if (!orderEntity) {
        strapi.log.error("Saman order not found", { orderId });
        return ctx.badRequest("Order not found", {
          data: { success: false, error: "Order not found (Saman)" },
        });
      }

      const contractId =
        contractTransaction?.contract?.id ||
        (typeof orderEntity.contract === "object" && orderEntity.contract
          ? orderEntity.contract.id
          : orderEntity.contract);

      const contractAmountToman = Math.round((orderEntity.contract?.Amount ?? 0) as number);
      const contractAmountIrr = contractAmountToman * 10;

      const markOrderCancelled = async (reason: string) => {
        try {
          await strapi.entityService.update("api::order.order", orderId!, {
            data: { Status: "Cancelled" },
          });
        } catch (err) {
          strapi.log.error("Failed to mark order cancelled (Saman)", err);
        }
        try {
          await releaseOrderReservation(strapi as any, Number(orderId), "Released");
        } catch {}
        if (contractId) {
          try {
            await strapi.entityService.update("api::contract.contract", contractId, {
              data: { Status: "Cancelled", external_source: "SamanKish" },
            });
          } catch (err) {
            strapi.log.error("Failed to cancel contract (Saman)", err);
          }
        }
        if (contractTransaction?.id) {
          try {
            await strapi.entityService.update(
              "api::contract-transaction.contract-transaction",
              contractTransaction.id,
              { data: { Status: "Failed" } },
            );
          } catch (err) {
            strapi.log.error("Failed to update contract transaction status (Saman)", err);
          }
        }
        try {
          await strapi.entityService.create("api::order-log.order-log", {
            data: {
              order: orderId,
              Action: "Update",
              Description: `Saman gateway failure: ${reason}`,
              Changes: {
                refNum,
                resNum: resNumRaw,
                state: normalizedState,
                status: samanStatusInput,
              },
            },
          });
        } catch (err) {
          strapi.log.error("Failed to log Saman cancellation", err);
        }
      };

      const stateSuccessful =
        normalizedState === "OK" ||
        normalizedState === "SUCCESS" ||
        (!Number.isNaN(statusNumeric) && statusNumeric === 2);

      if (!stateSuccessful) {
        await markOrderCancelled(normalizedState || `Status ${samanStatusInput || "Unknown"}`);
        return ctx.redirect(
          buildPaymentRedirectUrl("failure", {
            orderId,
            error: normalizedState || String(samanStatusInput || "FAILED"),
          }),
        );
      }

      const verifyResult = await samanService.verifyTransaction({
        refNum,
        terminalNumber,
      });

      if (!verifyResult?.success || verifyResult?.resultCode !== 0) {
        await markOrderCancelled(verifyResult?.resultDescription || "Verification failed");
        try {
          await samanService.reverseTransaction({
            refNum,
            terminalNumber,
          });
        } catch (reverseErr) {
          strapi.log.error("Saman reverse attempt failed", reverseErr);
        }
        return ctx.redirect(
          buildPaymentRedirectUrl("failure", {
            orderId,
            error: verifyResult?.resultDescription || "Verification failed",
          }),
        );
      }

      const detail = verifyResult.transactionDetail || verifyResult.TransactionDetail || {};
      const affectiveAmountIrr = Number(detail?.AffectiveAmount ?? detail?.OrginalAmount ?? 0);

      // If order is already expired/cancelled (reservation released), reverse and inform user.
      if (
        String(orderEntity?.Status) === "Cancelled" ||
        (orderEntity?.ReservationStatus &&
          !["Reserved", "Consumed"].includes(String(orderEntity.ReservationStatus)))
      ) {
        try {
          await samanService.reverseTransaction({ refNum, terminalNumber });
        } catch (reverseErr) {
          strapi.log.error("Saman reverse attempt failed (invalid reservation)", reverseErr);
        }
        await markOrderCancelled("reservation_invalid");
        return ctx.redirect(
          buildPaymentRedirectUrl("issue", {
            orderId,
            code: "reservation_invalid_reversed",
          }),
        );
      }

      // Stock handling:
      // - Reserved orders: consume reservation (Count-- and ReservedCount--) atomically
      // - Legacy orders: fallback to direct decrement
      const stockResult = await handlePostPaymentStock(strapi, orderId, "Saman");

      if (!stockResult.success) {
        if (stockResult.expired) {
          // Reservation expired -> reverse transaction (automatic refund) and inform user
          try {
            await releaseOrderReservation(strapi as any, Number(orderId), "Expired");
          } catch {}
          try {
            await samanService.reverseTransaction({ refNum, terminalNumber });
          } catch (reverseErr) {
            strapi.log.error("Saman reverse attempt failed (expired reservation)", reverseErr);
          }
          await markOrderCancelled("reservation_expired");
          return ctx.redirect(
            buildPaymentRedirectUrl("issue", {
              orderId,
              code: "reservation_expired_reversed",
            }),
          );
        } else {
          // Consume failure -> reverse transaction and inform user
          try {
            await releaseOrderReservation(strapi as any, Number(orderId), "Expired");
          } catch {}
          try {
            await samanService.reverseTransaction({ refNum, terminalNumber });
          } catch (reverseErr) {
            strapi.log.error("Saman reverse attempt failed (consume failure)", reverseErr);
          }
          await markOrderCancelled("reservation_consume_failed");
          return ctx.redirect(
            buildPaymentRedirectUrl("issue", {
              orderId,
              code: "reservation_consume_failed",
            }),
          );
        }
      } else if (stockResult.errors && stockResult.errors.length > 0) {
        return handleStockDecrementFailure(strapi, ctx, {
          orderId,
          stockErrors: stockResult.errors,
          refNum,
          paymentMethod: "SamanKish",
          externalSource: "SamanKish",
          externalId: refNum,
        });
      }

      // Only proceed to "Started" if no stock errors occurred
      try {
        await strapi.entityService.update("api::order.order", orderId, {
          data: {
            Status: "Started",
            external_source: "SamanKish",
            external_id: refNum,
          },
        });
      } catch (err) {
        strapi.log.error("Failed to update order status for Saman", err);
      }

      // Increment discount usage counter if discount was applied
      if (orderEntity?.DiscountCode) {
        await incrementDiscountUsageCounter(strapi, orderEntity.DiscountCode, orderId);
      }

      if (contractId) {
        try {
          await strapi.entityService.update("api::contract.contract", contractId, {
            data: {
              Status: "Confirmed",
              external_source: "SamanKish",
              external_id: refNum,
            },
          });
        } catch (err) {
          strapi.log.error("Failed to update contract for Saman", err);
        }
      }

      if (!contractTransaction && contractId) {
        try {
          contractTransaction = await strapi.entityService.create(
            "api::contract-transaction.contract-transaction",
            {
              data: {
                Type: "Gateway",
                Amount: contractAmountIrr,
                DiscountAmount: 0,
                Step: 1,
                Status: "Pending",
                TrackId: refNum,
                external_id: resNumRaw || refNum,
                external_source: "SamanKish",
                contract: contractId,
                Date: new Date(),
              },
            },
          );
        } catch (err) {
          strapi.log.error("Failed to create Saman contract transaction at verify", err);
        }
      }

      if (contractTransaction?.id) {
        try {
          await strapi.entityService.update(
            "api::contract-transaction.contract-transaction",
            contractTransaction.id,
            {
              data: {
                Status: "Success",
                TrackId: refNum,
                external_id: resNumRaw || contractTransaction.external_id,
                Amount: affectiveAmountIrr || contractAmountIrr,
              },
            },
          );
        } catch (err) {
          strapi.log.error("Failed to mark Saman contract transaction success", err);
        }
      }

      // Barcode generation is now a manual super-admin action.

      try {
        await strapi.entityService.create("api::order-log.order-log", {
          data: {
            order: orderId,
            Action: "Update",
            Description: "Saman gateway verify succeeded",
            Changes: {
              refNum,
              resNum: resNumRaw,
              resultCode: verifyResult.resultCode,
              detail,
            },
          },
        });
      } catch (err) {
        strapi.log.error("Failed to log Saman success", err);
      }

      await clearCartAfterPayment(strapi, orderId);

      return ctx.redirect(
        buildPaymentRedirectUrl("success", {
          orderId,
          transactionId: refNum || "",
        }),
      );
    }

    // If this is a SnappPay flow (state provided or paymentToken present), follow SnappPay verify+settle
    if (state || paymentTokenInput || transactionIdInput) {
      // Resolve orderId and token using transactionId first (exact match), then fallback to paymentToken
      let orderId: number | undefined = OrderId ? parseInt(OrderId, 10) : undefined;
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
            },
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
            },
          )) as any[];
          if (byToken?.length) {
            chosenTx = byToken[0];
            const co = chosenTx?.contract?.order;
            orderId = typeof co === "object" && co ? Number(co.id) : Number(co);
          }
        }
      } catch (e) {
        strapi.log.error("Failed to resolve order from SnappPay transaction", e);
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
            },
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

      // Idempotency check: Check if this SnappPay callback has already been processed
      const transactionIdForIdempotency = transactionIdInput || paymentTokenInput || tokenForOps;
      if (transactionIdForIdempotency) {
        try {
          const existingTx = await strapi.entityService.findMany(
            "api::contract-transaction.contract-transaction",
            {
              filters: {
                external_source: "SnappPay",
                external_id: String(transactionIdForIdempotency),
                Status: "Success",
              },
              limit: 1,
            },
          );

          if (existingTx && existingTx.length > 0) {
            strapi.log.info(
              `SnappPay callback already processed (idempotency check): transactionId=${transactionIdForIdempotency}, orderId=${orderId}`,
              {
                transactionId: String(transactionIdForIdempotency),
                orderId,
                existingTxId: existingTx[0].id,
              },
            );
            // Redirect to success page - transaction already processed
            return ctx.redirect(buildPaymentRedirectUrl("success", { orderId }));
          }
        } catch (idempotencyErr) {
          strapi.log.error("Failed to check SnappPay callback idempotency", idempotencyErr);
          // Continue processing if idempotency check fails
        }
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
          await releaseOrderReservation(strapi as any, Number(orderId), "Released");
        } catch {}
        try {
          const orderForContract: any = await strapi.entityService.findOne("api::order.order", orderId, {
            populate: { contract: true },
          });
          const contractId =
            typeof orderForContract?.contract === "object" && orderForContract.contract
              ? orderForContract.contract.id
              : orderForContract?.contract;
          if (contractId) {
            await strapi.entityService.update("api::contract.contract", contractId, {
              data: { Status: "Cancelled", external_source: "SnappPay" },
            });
          }
        } catch {}
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
          buildPaymentRedirectUrl("failure", {
            orderId,
            transactionId: transactionIdInput || "",
          }),
        );
      }

      // Check payment status before verify
      const statusBeforeVerify = await snappay.status(tokenForOps);
      try {
        strapi.log.info("SnappPay status before verify", {
          successful: statusBeforeVerify?.successful,
          status: statusBeforeVerify?.response?.status,
          transactionId: statusBeforeVerify?.response?.transactionId,
          error: statusBeforeVerify?.errorData,
        });
      } catch {}

      let verifyResult = await snappay.verify(tokenForOps);
      try {
        strapi.log.info("SnappPay verify result", {
          successful: verifyResult?.successful,
          error: verifyResult?.errorData,
        });
      } catch {}

      let verified = !!verifyResult?.successful;
      let statusAfterVerifyFail: any = null;
      let retryVerifyResult: any = null;
      let statusAfterRetry: any = null;

      if (!verified) {
        // SnapPay guidance: on verify failure/timeout, check status before deciding failure.
        statusAfterVerifyFail = await snappay.status(tokenForOps);
        const verifyFailStatus = String(
          statusAfterVerifyFail?.response?.status || ""
        ).toUpperCase();

        try {
          strapi.log.warn("SnappPay verify fallback status", {
            successful: statusAfterVerifyFail?.successful,
            status: statusAfterVerifyFail?.response?.status,
            transactionId: statusAfterVerifyFail?.response?.transactionId,
            error: statusAfterVerifyFail?.errorData,
          });
        } catch {}

        if (verifyFailStatus === "VERIFY") {
          verified = true;
        } else if (
          verifyFailStatus === "PENDING" ||
          verifyFailStatus.endsWith("_PENDING")
        ) {
          retryVerifyResult = await snappay.verify(tokenForOps);
          try {
            strapi.log.info("SnappPay verify retry result", {
              successful: retryVerifyResult?.successful,
              error: retryVerifyResult?.errorData,
            });
          } catch {}

          if (retryVerifyResult?.successful) {
            verifyResult = retryVerifyResult;
            verified = true;
          } else {
            statusAfterRetry = await snappay.status(tokenForOps);
            const retryStatus = String(
              statusAfterRetry?.response?.status || ""
            ).toUpperCase();
            try {
              strapi.log.warn("SnappPay verify retry fallback status", {
                successful: statusAfterRetry?.successful,
                status: statusAfterRetry?.response?.status,
                transactionId: statusAfterRetry?.response?.transactionId,
                error: statusAfterRetry?.errorData,
              });
            } catch {}
            if (retryStatus === "VERIFY") {
              verified = true;
            }
          }
        }
      }

      if (!verified) {
        await strapi.entityService.update("api::order.order", orderId, {
          data: { Status: "Cancelled" },
        });
        try {
          await releaseOrderReservation(strapi as any, Number(orderId), "Released");
        } catch {}
        try {
          await strapi.entityService.create("api::order-log.order-log", {
            data: {
              order: orderId,
              Action: "Update",
              Description: "SnappPay verify failed",
              Changes: {
                verifyResult,
                statusAfterVerifyFail,
                retryVerifyResult,
                statusAfterRetry,
              },
            },
          });
        } catch {}
        return ctx.redirect(
          buildPaymentRedirectUrl("failure", {
            orderId,
            transactionId: transactionIdInput || "",
          }),
        );
      }

      // If reservation expired, revert before settlement and inform the user
      try {
        const orderForReservation: any = await strapi.entityService.findOne(
          "api::order.order",
          orderId,
          { fields: ["Status", "ReservationStatus", "ReservedUntil"], populate: { contract: true } } as any,
        );

        const reservationStatus = orderForReservation?.ReservationStatus;
        if (reservationStatus && reservationStatus !== "Consumed") {
          const until = orderForReservation?.ReservedUntil
            ? new Date(orderForReservation.ReservedUntil)
            : null;
          const orderCancelled = String(orderForReservation?.Status) === "Cancelled";
          const invalidReservation =
            reservationStatus !== "Reserved" || orderCancelled || !until || until.getTime() < Date.now();

          if (invalidReservation) {
            try {
              await releaseOrderReservation(strapi as any, Number(orderId), "Expired");
            } catch {}
            try {
              await snappay.revert(tokenForOps);
            } catch (revertErr) {
              strapi.log.error(
                "SnappPay revert attempt failed (invalid/expired reservation)",
                revertErr,
              );
            }
            try {
              await strapi.entityService.update("api::order.order", orderId, {
                data: { Status: "Cancelled" },
              });
            } catch {}
            const contractId =
              typeof orderForReservation?.contract === "object" && orderForReservation.contract
                ? orderForReservation.contract.id
                : orderForReservation?.contract;
            if (contractId) {
              try {
                await strapi.entityService.update("api::contract.contract", contractId, {
                  data: { Status: "Cancelled", external_source: "SnappPay" },
                });
              } catch {}
            }

            return ctx.redirect(
              buildPaymentRedirectUrl("issue", {
                orderId,
                code: "reservation_expired_reversed",
              }),
            );
          }
        }
      } catch (reservationErr) {
        strapi.log.error("Failed to validate reservation before SnappPay settlement", reservationErr);
      }

      // Auto-settle SnappPay transaction (like Mellat)
      const settleResult = await snappay.settle(tokenForOps);
      try {
        strapi.log.info("SnappPay settle result", {
          successful: settleResult?.successful,
          error: settleResult?.errorData,
        });
      } catch {}

      const newlySettled = settleResult?.successful;
      const alreadySettled =
        newlySettled ||
        settleResult?.errorData?.errorCode === 409 ||
        /already\s+settled/i.test(
          settleResult?.errorData?.message || settleResult?.errorData?.data || "",
        );

      // Retry settlement if it failed (not already settled)
      const MAX_RETRIES = 2; // 2 retries = 3 total attempts
      const RETRY_DELAY_MS = 30000; // 30 seconds as recommended by SnappPay
      let retryCount = 0;
      let finalSettleResult = settleResult;
      let retrySettled = alreadySettled;
      let retryNewlySettled = newlySettled;

      if (!alreadySettled) {
        while (retryCount < MAX_RETRIES) {
          retryCount++;
          strapi.log.warn(
            `Settlement failed, retrying (${retryCount}/${MAX_RETRIES}) after ${RETRY_DELAY_MS}ms`,
            {
              orderId,
              tokenForOps,
              previousError: finalSettleResult?.errorData,
            },
          );

          // Wait 30 seconds before retry
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));

          // Retry settlement
          finalSettleResult = await snappay.settle(tokenForOps);

          try {
            strapi.log.info(`SnappPay settle retry ${retryCount} result`, {
              successful: finalSettleResult?.successful,
              error: finalSettleResult?.errorData,
            });
          } catch {}

          // Check if this retry succeeded or was already settled
          retryNewlySettled = finalSettleResult?.successful;
          retrySettled =
            retryNewlySettled ||
            finalSettleResult?.errorData?.errorCode === 409 ||
            /already\s+settled/i.test(
              finalSettleResult?.errorData?.message || finalSettleResult?.errorData?.data || "",
            );

          if (retrySettled) {
            break; // Success! Exit retry loop
          }
        }

        // If all retries failed, log for manual review
        if (!retrySettled) {
          strapi.log.error(
            `Settlement failed after ${retryCount + 1} attempts. Manual review required.`,
            {
              orderId,
              tokenForOps,
              finalError: finalSettleResult?.errorData,
            },
          );

          try {
            await strapi.entityService.create("api::order-log.order-log", {
              data: {
                order: orderId,
                Action: "Update",
                Description: `SnappPay settlement failed after ${
                  retryCount + 1
                } attempts - MANUAL REVIEW REQUIRED`,
                Changes: {
                  totalAttempts: retryCount + 1,
                  error: finalSettleResult?.errorData,
                  transactionId: transactionIdInput,
                },
              },
            });
          } catch {}
        }
      }

      // Check payment status after settle to confirm final state
      const statusAfterSettle = await snappay.status(tokenForOps);
      try {
        strapi.log.info("SnappPay status after settle", {
          successful: statusAfterSettle?.successful,
          status: statusAfterSettle?.response?.status,
          transactionId: statusAfterSettle?.response?.transactionId,
          error: statusAfterSettle?.errorData,
          retriesPerformed: retryCount,
        });
      } catch {}

      // If newly settled (including after retries), decrement stock atomically
      if (retryNewlySettled) {
        const stockResult = await handlePostPaymentStock(strapi, orderId, "SnappPay");
        const stockErrors =
          stockResult.errors && stockResult.errors.length > 0
            ? stockResult.errors
            : stockResult.success
            ? []
            : [
                {
                  error: stockResult.expired
                    ? "Reservation expired"
                    : "Stock decrement failed",
                },
              ];

        if (!stockResult.success || stockErrors.length > 0) {
          const referenceId =
            transactionIdInput ||
            statusAfterSettle?.response?.transactionId ||
            tokenForOps;
          return handleStockDecrementFailure(strapi, ctx, {
            orderId,
            stockErrors,
            refNum: referenceId,
            paymentMethod: "SnappPay",
            externalSource: "SnappPay",
            externalId: referenceId,
          });
        }

        // Barcode generation now only occurs when triggered manually from the admin panel.
      }

      await strapi.entityService.update("api::order.order", orderId, {
        data: { Status: "Started" },
      });

      // Log payment success to user activity feed
      try {
        const order = await strapi.entityService.findOne("api::order.order", orderId, {
          populate: { user: true, contract: true },
        }) as any;
        const userId = order?.user?.id ? Number(order.user.id) : null;
        const amount = order?.contract?.Amount ? Number(order.contract.Amount) : order?.Total ? Number(order.Total) : 0;

        if (userId) {
          const activityService = strapi.service("api::user-activity.user-activity") as any;
          if (activityService?.logPaymentSuccess) {
            await activityService.logPaymentSuccess(userId, orderId, amount);
          }
        }
      } catch (activityError) {
        strapi.log.error("Failed to log payment success to user activity", {
          orderId,
          error: (activityError as Error).message,
        });
      }

      // Increment discount usage counter if discount was applied
      try {
        const orderWithDiscount = await strapi.entityService.findOne("api::order.order", orderId);
        if (orderWithDiscount?.DiscountCode) {
          await incrementDiscountUsageCounter(strapi, orderWithDiscount.DiscountCode, orderId);
        }
      } catch (err) {
        strapi.log.error("Failed to increment discount for SnappPay order", err);
      }

      try {
        await strapi.entityService.create("api::order-log.order-log", {
          data: {
            order: orderId,
            Action: "Update",
            Description: retryNewlySettled
              ? `SnappPay verify+settle succeeded${
                  retryCount > 0 ? ` (after ${retryCount} retries)` : ""
                }`
              : "SnappPay verify succeeded (already settled)",
            Changes: {
              transactionId: transactionIdInput,
              retries: retryCount,
            },
          },
        });
      } catch {}

      await clearCartAfterPayment(strapi, orderId);

      return ctx.redirect(
        buildPaymentRedirectUrl("success", {
          orderId,
          transactionId: transactionIdInput || "",
        }),
      );
    }

    // Check if payment was successful (ResCode = 0) - Mellat
    if (ResCode !== "0") {
      // Handle different failure scenarios
      const orderId = parseInt(OrderId || SaleOrderId, 10);

      // Update order status to Cancelled if we have a valid order ID
      if (!isNaN(orderId)) {
        try {
          // Log payment failure to user activity feed before cancelling
          try {
            const order = await strapi.entityService.findOne("api::order.order", orderId, {
              populate: { user: true },
            }) as any;
            const userId = order?.user?.id ? Number(order.user.id) : null;

            if (userId) {
              const activityService = strapi.service("api::user-activity.user-activity") as any;
              const reason = ResCode === "17" ? "لغو شده توسط کاربر" : "خطا در پرداخت";
              if (activityService?.logPaymentFailed) {
                await activityService.logPaymentFailed(userId, orderId, reason);
              }
            }
          } catch (activityError) {
            strapi.log.error("Failed to log payment failure to user activity", {
              orderId,
              error: (activityError as Error).message,
            });
          }

          await strapi.entityService.update("api::order.order", orderId, {
            data: { Status: "Cancelled" },
          });
          try {
            await releaseOrderReservation(strapi as any, Number(orderId), "Released");
          } catch {}
          strapi.log.info(
            `Order ${orderId} marked as Cancelled due to payment failure/cancellation`,
          );
        } catch (updateError) {
          strapi.log.error(`Failed to update order ${orderId} status:`, updateError);
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
        ctx.redirect(buildPaymentRedirectUrl("cancelled", { orderId, reason: "user-cancelled" }));
      } else {
        strapi.log.error("Payment failed with ResCode:", ResCode);
        // Other payment failures - redirect to frontend failure page
        ctx.redirect(
          buildPaymentRedirectUrl("failure", {
            orderId,
            error: `Payment failed with code: ${ResCode}`,
          }),
        );
      }
      return;
    }

    // Idempotency check: Check if this Mellat callback has already been processed
    if (SaleReferenceId) {
      try {
        const existingTx = await strapi.entityService.findMany(
          "api::contract-transaction.contract-transaction",
          {
            filters: {
              external_source: "Mellat",
              external_id: String(SaleReferenceId),
              Status: "Success",
            },
            limit: 1,
          },
        );

        if (existingTx && existingTx.length > 0) {
          const orderId = parseInt(OrderId || SaleOrderId, 10);
          strapi.log.info(
            `Mellat callback already processed (idempotency check): SaleReferenceId=${SaleReferenceId}, orderId=${orderId}`,
            {
              saleReferenceId: String(SaleReferenceId),
              orderId,
              existingTxId: existingTx[0].id,
            },
          );
          // Redirect to success page - transaction already processed
          if (!isNaN(orderId)) {
            return ctx.redirect(buildPaymentRedirectUrl("success", { orderId }));
          }
          return ctx.badRequest("Callback already processed");
        }
      } catch (idempotencyErr) {
        strapi.log.error("Failed to check Mellat callback idempotency", idempotencyErr);
        // Continue processing if idempotency check fails
      }
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
      // Reservation check BEFORE settlement: if reservation expired, reverse payment and inform user.
      try {
	        const orderForReservation: any = await strapi.entityService.findOne(
	          "api::order.order",
	          orderId,
	          { fields: ["Status", "ReservationStatus", "ReservedUntil"], populate: { contract: true } } as any,
	        );
	        const reservationStatus = orderForReservation?.ReservationStatus;
	        if (reservationStatus && reservationStatus !== "Consumed") {
	          const until = orderForReservation?.ReservedUntil
	            ? new Date(orderForReservation.ReservedUntil)
	            : null;
	          const orderCancelled = String(orderForReservation?.Status) === "Cancelled";
	          const invalidReservation =
	            reservationStatus !== "Reserved" || orderCancelled || !until || until.getTime() < Date.now();

	          if (invalidReservation) {
	            try {
	              await releaseOrderReservation(strapi as any, Number(orderId), "Expired");
	            } catch {}

            try {
              await paymentService.reverseTransaction({
                orderId: OrderId || SaleOrderId,
                saleOrderId: SaleOrderId,
                saleReferenceId: SaleReferenceId,
              });
            } catch (reverseErr) {
              strapi.log.error("Mellat reversal attempt failed (expired reservation)", reverseErr);
            }

            try {
              await strapi.entityService.update("api::order.order", orderId, {
                data: { Status: "Cancelled" },
              });
            } catch {}
            const contractId =
              typeof orderForReservation?.contract === "object" && orderForReservation.contract
                ? orderForReservation.contract.id
                : orderForReservation?.contract;
            if (contractId) {
              try {
                await strapi.entityService.update("api::contract.contract", contractId, {
                  data: { Status: "Cancelled", external_source: "Mellat" },
                });
              } catch {}
            }

            try {
              await strapi.entityService.create("api::order-log.order-log", {
                data: {
                  order: orderId,
                  Action: "Update",
                  Description: "Reservation expired; Mellat payment reversed before settlement",
                  Changes: { SaleOrderId, SaleReferenceId, ResCode, RefId },
                },
              });
            } catch {}

	            return ctx.redirect(
	              buildPaymentRedirectUrl("issue", {
	                orderId,
	                code: "reservation_expired_reversed",
	              }),
	            );
	          }
	        }
	      } catch (reservationErr) {
	        strapi.log.error("Failed to validate reservation before Mellat settlement", reservationErr);
	      }

      const settlementResult = await paymentService.settleTransaction({
        orderId: OrderId || SaleOrderId,
        saleOrderId: SaleOrderId,
        saleReferenceId: SaleReferenceId,
      });

      if (settlementResult.success) {
        // Update order status to Started (Paid)
        // Stock handling:
        // - Reserved orders: consume reservation (Count-- and ReservedCount--) atomically
        // - Legacy orders: fallback to direct decrement
        const stockResult = await handlePostPaymentStock(strapi, orderId, "Mellat");
        const stockErrors =
          stockResult.errors && stockResult.errors.length > 0
            ? stockResult.errors
            : stockResult.success
            ? []
            : [
                {
                  error: stockResult.expired
                    ? "Reservation expired"
                    : "Stock decrement failed",
                },
              ];

        if (!stockResult.success || stockErrors.length > 0) {
          const referenceId = SaleReferenceId || RefId || OrderId || SaleOrderId;
          return handleStockDecrementFailure(strapi, ctx, {
            orderId,
            stockErrors,
            refNum: referenceId,
            paymentMethod: "Mellat",
            externalSource: "Mellat",
            externalId: SaleReferenceId || referenceId,
          });
        }

        await strapi.entityService.update("api::order.order", orderId, {
          data: {
            Status: "Started",
          },
        });

        // Increment discount usage counter if discount was applied
        try {
          const orderWithDiscount = await strapi.entityService.findOne("api::order.order", orderId);
          if (orderWithDiscount?.DiscountCode) {
            await incrementDiscountUsageCounter(strapi, orderWithDiscount.DiscountCode, orderId);
          }
        } catch (err) {
          strapi.log.error("Failed to increment discount for Mellat order", err);
        }

        // Barcode generation is now a manual super-admin action.

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

        await clearCartAfterPayment(strapi, orderId);

        // Redirect to frontend success page
        ctx.redirect(buildPaymentRedirectUrl("success", { orderId }));
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
          strapi.log.error("Failed to persist gateway settlement failure log", e);
        }
        ctx.redirect(
          buildPaymentRedirectUrl("failure", {
            error: settlementResult.error || "Settlement failed",
          }),
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
        strapi.log.error("Failed to persist gateway verification failure log", e);
      }

      // Redirect to frontend failure page
      ctx.redirect(
        buildPaymentRedirectUrl("failure", {
          error: verificationResult.error || "Verification failed",
        }),
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
    ctx.redirect(buildPaymentRedirectUrl("failure", { error: "Internal server error" }));
  }
}
