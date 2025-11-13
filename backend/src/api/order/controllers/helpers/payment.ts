import type { Strapi } from "@strapi/strapi";
import type { Strapi } from "@strapi/strapi";

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
  const samanStateInput: any =
    b.State ?? q.State ?? b.STATE ?? q.STATE ?? b.state ?? q.state;
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
      samanState: samanStateInput,
      samanStatus: samanStatusInput,
      samanRefNum: samanRefNumInput,
      samanResNum: samanResNumInput,
      timestamp: new Date().toISOString(),
    });

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
            }
          )) as any[];
          if (txMatches?.length) {
            contractTransaction = txMatches[0];
          }
        } catch (err) {
          strapi.log.error(
            "Failed to locate Saman contract transaction by resNum",
            err
          );
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
            }
          )) as any[];
          if (txMatches?.length) {
            contractTransaction = txMatches[0];
          }
        } catch (err) {
          strapi.log.error(
            "Failed to locate Saman contract transaction by refNum",
            err
          );
        }
      }

      if (
        (!orderId || Number.isNaN(orderId)) &&
        contractTransaction?.contract?.order
      ) {
        const co = contractTransaction.contract.order;
        const derivedOrderId =
          typeof co === "object" && co ? Number(co.id) : Number(co);
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

      const orderEntity = (await strapi.entityService.findOne(
        "api::order.order",
        orderId,
        {
          populate: {
            contract: true,
            order_items: {
              populate: {
                product_variation: { populate: { product_stock: true } },
              },
            },
          },
        }
      )) as any;

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

      const contractAmountToman = Math.round(
        (orderEntity.contract?.Amount ?? 0) as number
      );
      const contractAmountIrr = contractAmountToman * 10;

      const markOrderCancelled = async (reason: string) => {
        try {
          await strapi.entityService.update("api::order.order", orderId!, {
            data: { Status: "Cancelled" },
          });
        } catch (err) {
          strapi.log.error("Failed to mark order cancelled (Saman)", err);
        }
        if (contractId) {
          try {
            await strapi.entityService.update(
              "api::contract.contract",
              contractId,
              {
                data: { Status: "Cancelled", external_source: "SamanKish" },
              }
            );
          } catch (err) {
            strapi.log.error("Failed to cancel contract (Saman)", err);
          }
        }
        if (contractTransaction?.id) {
          try {
            await strapi.entityService.update(
              "api::contract-transaction.contract-transaction",
              contractTransaction.id,
              { data: { Status: "Failed" } }
            );
          } catch (err) {
            strapi.log.error(
              "Failed to update contract transaction status (Saman)",
              err
            );
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
        await markOrderCancelled(
          normalizedState || `Status ${samanStatusInput || "Unknown"}`
        );
        return ctx.redirect(
          `https://infinity.rgbgroup.ir/payment/failure?orderId=${orderId}&error=${encodeURIComponent(
            normalizedState || String(samanStatusInput || "FAILED")
          )}`
        );
      }

      const verifyResult = await samanService.verifyTransaction({
        refNum,
        terminalNumber,
      });

      if (!verifyResult?.success || verifyResult?.resultCode !== 0) {
        await markOrderCancelled(
          verifyResult?.resultDescription || "Verification failed"
        );
        try {
          await samanService.reverseTransaction({
            refNum,
            terminalNumber,
          });
        } catch (reverseErr) {
          strapi.log.error("Saman reverse attempt failed", reverseErr);
        }
        return ctx.redirect(
          `https://infinity.rgbgroup.ir/payment/failure?orderId=${orderId}&error=${encodeURIComponent(
            verifyResult?.resultDescription || "Verification failed"
          )}`
        );
      }

      const detail =
        verifyResult.transactionDetail || verifyResult.TransactionDetail || {};
      const affectiveAmountIrr = Number(
        detail?.AffectiveAmount ?? detail?.OrginalAmount ?? 0
      );

      try {
        for (const it of orderEntity?.order_items || []) {
          const variation = it?.product_variation;
          if (variation?.product_stock?.id && typeof it?.Count === "number") {
            const stockId = variation.product_stock.id as number;
            const current = Number(variation.product_stock.Count || 0);
            const dec = Number(it.Count || 0);
            await strapi.entityService.update(
              "api::product-stock.product-stock",
              stockId,
              { data: { Count: current - dec } }
            );
          }
        }
      } catch (stockErr) {
        strapi.log.error("Failed to decrement stock after Saman payment", stockErr);
      }

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

      if (contractId) {
        try {
          await strapi.entityService.update(
            "api::contract.contract",
            contractId,
            {
              data: {
                Status: "Confirmed",
                external_source: "SamanKish",
                external_id: refNum,
              },
            }
          );
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
            }
          );
        } catch (err) {
          strapi.log.error(
            "Failed to create Saman contract transaction at verify",
            err
          );
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
            }
          );
        } catch (err) {
          strapi.log.error(
            "Failed to mark Saman contract transaction success",
            err
          );
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

      return ctx.redirect(
        `https://infinity.rgbgroup.ir/payment/success?orderId=${orderId}&transactionId=${encodeURIComponent(
          refNum || ""
        )}`
      );
    }

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
          settleResult?.errorData?.message ||
            settleResult?.errorData?.data ||
            ""
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
            }
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
              finalSettleResult?.errorData?.message ||
                finalSettleResult?.errorData?.data ||
                ""
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
            }
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

      // If newly settled (including after retries), decrement stock and generate barcode
      if (retryNewlySettled) {
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

        // Barcode generation now only occurs when triggered manually from the admin panel.
      }

      await strapi.entityService.update("api::order.order", orderId, {
        data: { Status: "Started" },
      });
      try {
        await strapi.entityService.create("api::order-log.order-log", {
          data: {
            order: orderId,
            Action: "Update",
            Description: retryNewlySettled
              ? `SnappPay verify+settle succeeded${retryCount > 0 ? ` (after ${retryCount} retries)` : ""}`
              : "SnappPay verify succeeded (already settled)",
            Changes: {
              transactionId: transactionIdInput,
              retries: retryCount,
            },
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
