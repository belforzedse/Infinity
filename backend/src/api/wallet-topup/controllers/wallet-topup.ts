/**
 * wallet-topup controller
 */

import { factories } from "@strapi/strapi";
import type { Strapi } from "@strapi/strapi";

const FRONTEND_BASE =
  process.env.FRONTEND_URL || "https://new.infinitycolor.co";
export default factories.createCoreController(
  "api::wallet-topup.wallet-topup",
  ({ strapi }: { strapi: Strapi }) => ({
    async chargeIntent(ctx) {
      try {
        const pluginUserId = ctx.state.user?.id;
        if (!pluginUserId) return ctx.unauthorized("Authentication required");

        const { amount } = ctx.request.body || {};
        const amountIrr = Number(amount);
        if (!amountIrr || amountIrr <= 0) return ctx.badRequest("amount is required (IRR)");

        const randomSuffix = Math.floor(Math.random() * 900) + 100; // 3 digits
        const saleOrderId = `${Date.now()}${randomSuffix}`;

        const topup = await strapi.entityService.create("api::wallet-topup.wallet-topup", {
          data: {
            Amount: Math.round(amountIrr),
            Status: "Pending",
            SaleOrderId: saleOrderId,
            user: pluginUserId,
            Date: new Date(),
          },
        });

        const paymentService = strapi.service("api::payment-gateway.mellat-v3");
        if (!paymentService) {
          return ctx.badRequest("Payment service unavailable", {
            data: { success: false, error: "mellat service missing" },
          });
        }

        const configuredBase = String(
          strapi.config.get("server.url", process.env.URL || "https://api.infinitycolor.co/"),
        );
        let baseUrl = configuredBase.trim();
        if (!/^https?:\/\//i.test(baseUrl)) {
          baseUrl = process.env.URL || "https://api.infinitycolor.co/";
        }
        baseUrl = baseUrl.replace(/\/$/, "").replace(/\/api$/i, "");
        const callbackURL = `${baseUrl}/api/wallet/payment-callback`;

        const response = await paymentService.requestPayment({
          orderId: Number(saleOrderId),
          amount: Math.round(amountIrr),
          userId: pluginUserId,
          callbackURL,
          contractId: undefined,
          amountInRial: true, // Amount is already in IRR
        });

        if (!response?.success) {
          await strapi.entityService.update("api::wallet-topup.wallet-topup", topup.id, {
            data: { Status: "Failed" },
          });
          return ctx.badRequest("Gateway error", {
            data: { success: false, error: response?.error },
          });
        }

        try {
          await strapi.entityService.update("api::wallet-topup.wallet-topup", topup.id, {
            data: { RefId: response.refId },
          });
        } catch (e) {
          strapi.log.error("Failed to persist wallet topup token", {
            topupId: topup.id,
            saleOrderId,
            error: (e as any)?.message || String(e),
          });
        }

        return ctx.send({
          data: {
            success: true,
            redirectUrl: response.redirectUrl,
            refId: response.refId,
            saleOrderId,
          },
        });
      } catch (error) {
        return ctx.badRequest((error as any).message, {
          data: { success: false, error: (error as any).message },
        });
      }
    },

    async paymentCallback(ctx) {
      const { ResCode, SaleOrderId, SaleReferenceId } = (ctx.request as any).body || {};

      try {
        const topups = (await strapi.entityService.findMany(
          "api::wallet-topup.wallet-topup",
          { filters: { SaleOrderId: String(SaleOrderId) }, limit: 1, populate: { user: true } }
        )) as any[];
        const topup = topups?.[0];

        if (!topup) {
          return ctx.redirect(
            `${FRONTEND_BASE}/wallet?status=failure&reason=not_found`
          );
        }

        if (topup.Status === "Success") {
          return ctx.redirect(`${FRONTEND_BASE}/wallet?status=success`);
        }

        const paymentService = strapi.service("api::payment-gateway.mellat-v3");

        const resCode = String(ResCode ?? "").trim();
        if (resCode !== "0") {
          try {
            await strapi.entityService.update(
              "api::wallet-topup.wallet-topup",
              topup.id,
              { data: { Status: "Failed" } }
            );
          } catch (e) {
            strapi.log.error(
              "Failed to mark wallet topup as Failed (cancelled)",
              {
                topupId: topup.id,
                saleOrderId: String(SaleOrderId || ""),
                error: (e as any)?.message || String(e),
              }
            );
          }
          return ctx.redirect(
            `${FRONTEND_BASE}/wallet?status=failure&code=${encodeURIComponent(resCode)}`
          );
        }

        // Verify transaction - MUST succeed
        const verifyResult = await paymentService.verifyTransaction({
          orderId: String(SaleOrderId || ""),
          saleOrderId: String(SaleOrderId || ""),
          saleReferenceId: String(SaleReferenceId || ""),
        });

        if (!verifyResult?.success) {
          strapi.log.error("Wallet topup verify failed", {
            topupId: topup.id,
            saleOrderId: String(SaleOrderId || ""),
            verifyResult,
          });
          try {
            await strapi.entityService.update(
              "api::wallet-topup.wallet-topup",
              topup.id,
              { data: { Status: "Failed" } }
            );
          } catch (e) {
            strapi.log.error("Failed to mark topup as Failed after verify failure", {
              topupId: topup.id,
              error: (e as any)?.message || String(e),
            });
          }
          return ctx.redirect(
            `${FRONTEND_BASE}/wallet?status=failure&reason=verify`
          );
        }

        // Settle transaction - MUST succeed
        const settleResult = await paymentService.settleTransaction({
          orderId: String(SaleOrderId || ""),
          saleOrderId: String(SaleOrderId || ""),
          saleReferenceId: String(SaleReferenceId || ""),
          allowResCode45Success: true,
        });

        if (!settleResult?.success) {
          strapi.log.error("Wallet topup settle failed", {
            topupId: topup.id,
            saleOrderId: String(SaleOrderId || ""),
            settleResult,
          });
          try {
            await strapi.entityService.update(
              "api::wallet-topup.wallet-topup",
              topup.id,
              { data: { Status: "Failed" } }
            );
          } catch (e) {
            strapi.log.error("Failed to mark topup as Failed after settle failure", {
              topupId: topup.id,
              error: (e as any)?.message || String(e),
            });
          }
          return ctx.redirect(
            `${FRONTEND_BASE}/wallet?status=failure&reason=settle`
          );
        }

        // Fetch or create wallet
        let wallet = await strapi.db
          .query("api::local-user-wallet.local-user-wallet")
          .findOne({ where: { user: topup.user.id } });

        if (!wallet) {
          wallet = await strapi.entityService.create(
            "api::local-user-wallet.local-user-wallet",
            { data: { user: topup.user.id, Balance: 0 } }
          );
        }

        // Update wallet balance
        const newBalance = (wallet.Balance || 0) + topup.Amount;
        await strapi.entityService.update(
          "api::local-user-wallet.local-user-wallet",
          wallet.id,
          { data: { Balance: newBalance, LastTransactionDate: new Date() } }
        );

        // Create transaction record
        await strapi.entityService.create(
          "api::local-user-wallet-transaction.local-user-wallet-transaction",
          {
            data: {
              Amount: topup.Amount,
              Type: "Add",
              Date: new Date(),
              Cause: "Wallet Topup",
              ReferenceId: String(SaleReferenceId || ""),
              user_wallet: wallet.id,
            },
          }
        );

        // Mark topup as Success
        try {
          await strapi.entityService.update(
            "api::wallet-topup.wallet-topup",
            topup.id,
            {
              data: {
                Status: "Success",
                SaleReferenceId: String(SaleReferenceId || ""),
              },
            }
          );
        } catch (e) {
          strapi.log.error("Failed to update wallet topup as Success", {
            topupId: topup.id,
            saleOrderId: String(SaleOrderId || ""),
            error: (e as any)?.message || String(e),
          });
        }

        return ctx.redirect(`${FRONTEND_BASE}/wallet?status=success`);
      } catch (error) {
        return ctx.redirect(
          `${FRONTEND_BASE}/wallet?status=failure&reason=internal`
        );
      }
    },
  })
);
