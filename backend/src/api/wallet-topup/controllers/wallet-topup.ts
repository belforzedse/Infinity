/**
 * wallet-topup controller
 */

import { factories } from "@strapi/strapi";
import type { Strapi } from "@strapi/strapi";

const FRONTEND_BASE = "https://new.infinitycolor.co";

export default factories.createCoreController(
  "api::wallet-topup.wallet-topup",
  ({ strapi }: { strapi: Strapi }) => ({
    async chargeIntent(ctx) {
      try {
        const userId = ctx.state.user?.id;
        if (!userId) return ctx.unauthorized("Unauthorized");

        const { amount } = ctx.request.body || {};
        const amountIrr = Number(amount);
        if (!amountIrr || amountIrr <= 0)
          return ctx.badRequest("amount is required (IRR)");

        // Create a more robust unique numeric SaleOrderId for Mellat
        const randomSuffix = Math.floor(Math.random() * 900) + 100; // 3 digits
        const saleOrderId = `${Date.now()}${randomSuffix}`;

        // Persist pending topup
        const topup = await strapi.entityService.create(
          "api::wallet-topup.wallet-topup",
          {
            data: {
              Amount: Math.round(amountIrr),
              Status: "Pending",
              SaleOrderId: saleOrderId,
              user: userId,
              Date: new Date(),
            },
          }
        );

        const paymentService = strapi.service("api::payment-gateway.mellat-v3");

        // Build absolute callback URL and avoid duplicate "/api" prefixes
        const configuredBase = String(
          strapi.config.get("server.url", "https://api.new.infinitycolor.co")
        );
        let baseUrl = configuredBase.trim();
        if (!/^https?:\/\//i.test(baseUrl)) {
          baseUrl = "https://api.new.infinitycolor.co";
        }
        baseUrl = baseUrl.replace(/\/$/, "").replace(/\/api$/i, "");
        const callbackURL = `${baseUrl}/api/wallet/payment-callback`;

        const response = await paymentService.requestPayment({
          orderId: Number(saleOrderId),
          amount: Math.round(amountIrr),
          userId,
          callbackURL,
        } as any);

        if (!response?.success) {
          await strapi.entityService.update(
            "api::wallet-topup.wallet-topup",
            topup.id,
            { data: { Status: "Failed" } }
          );
          return ctx.badRequest("Gateway error", {
            data: { success: false, error: response?.error },
          });
        }

        // Save RefId for tracking
        try {
          await strapi.entityService.update(
            "api::wallet-topup.wallet-topup",
            topup.id,
            { data: { RefId: response.refId } }
          );
        } catch (e) {
          strapi.log.error("Failed to persist wallet topup RefId", {
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
      // Mellat callback fields
      const { ResCode, SaleOrderId, SaleReferenceId } = (ctx.request as any)
        .body;

      try {
        // Load topup by SaleOrderId
        const topups = (await strapi.entityService.findMany(
          "api::wallet-topup.wallet-topup",
          { filters: { SaleOrderId: String(SaleOrderId) }, limit: 1 }
        )) as any[];
        const topup = topups?.[0];

        if (!topup) {
          return ctx.redirect(
            `${FRONTEND_BASE}/wallet?status=failure&reason=not_found`
          );
        }

        // If user cancelled or error code
        if (String(ResCode) !== "0") {
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
                resCode: String(ResCode || ""),
                error: (e as any)?.message || String(e),
              }
            );
          }
          return ctx.redirect(
            `${FRONTEND_BASE}/wallet?status=failure&code=${encodeURIComponent(
              String(ResCode || "")
            )}`
          );
        }

        const paymentService = strapi.service("api::payment-gateway.mellat-v3");

        // Verify
        const verification = await paymentService.verifyTransaction({
          orderId: String(SaleOrderId),
          saleOrderId: String(SaleOrderId),
          saleReferenceId: String(SaleReferenceId),
        } as any);

        if (!verification?.success) {
          try {
            await strapi.entityService.update(
              "api::wallet-topup.wallet-topup",
              topup.id,
              { data: { Status: "Failed" } }
            );
          } catch (e) {
            strapi.log.error("Failed to mark wallet topup as Failed (verify)", {
              topupId: topup.id,
              saleOrderId: String(SaleOrderId || ""),
              saleReferenceId: String(SaleReferenceId || ""),
              error: (e as any)?.message || String(e),
            });
          }
          return ctx.redirect(
            `${FRONTEND_BASE}/wallet?status=failure&reason=verify`
          );
        }

        // Settle
        const settlement = await paymentService.settleTransaction({
          orderId: String(SaleOrderId),
          saleOrderId: String(SaleOrderId),
          saleReferenceId: String(SaleReferenceId),
        } as any);

        if (!settlement?.success) {
          try {
            await strapi.entityService.update(
              "api::wallet-topup.wallet-topup",
              topup.id,
              { data: { Status: "Failed" } }
            );
          } catch (e) {
            strapi.log.error("Failed to mark wallet topup as Failed (settle)", {
              topupId: topup.id,
              saleOrderId: String(SaleOrderId || ""),
              saleReferenceId: String(SaleReferenceId || ""),
              error: (e as any)?.message || String(e),
            });
          }
          return ctx.redirect(
            `${FRONTEND_BASE}/wallet?status=failure&reason=settle`
          );
        }

        // Success: update topup and wallet balance + transaction
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
            saleReferenceId: String(SaleReferenceId || ""),
            error: (e as any)?.message || String(e),
          });
        }

        // Load or create user wallet
        const wallet = await strapi.db
          .query("api::local-user-wallet.local-user-wallet")
          .findOne({ where: { user: topup.user?.id || topup.user } });
        let walletId = wallet?.id;
        if (!walletId) {
          const created = await strapi.entityService.create(
            "api::local-user-wallet.local-user-wallet",
            { data: { user: topup.user, Balance: 0 } }
          );
          walletId = created.id;
        }

        const currentBalance = Number(wallet?.Balance || 0);
        const newBalance = currentBalance + Number(topup.Amount || 0); // TODO: Confirm units are IRR end-to-end for topups

        try {
          await strapi.entityService.update(
            "api::local-user-wallet.local-user-wallet",
            walletId,
            {
              data: {
                Balance: newBalance,
                LastTransactionDate: new Date(),
              },
            }
          );
        } catch (e) {
          strapi.log.error("Failed to update wallet balance after topup", {
            walletId,
            topupId: topup.id,
            saleOrderId: String(SaleOrderId || ""),
            saleReferenceId: String(SaleReferenceId || ""),
            error: (e as any)?.message || String(e),
          });
          return ctx.redirect(
            `${FRONTEND_BASE}/wallet?status=failure&reason=wallet_update`
          );
        }

        // Create transaction record
        try {
          await strapi.entityService.create(
            "api::local-user-wallet-transaction.local-user-wallet-transaction",
            {
              data: {
                Amount: Number(topup.Amount || 0), // TODO: Validate IRR scale from frontend
                Type: "Add",
                Date: new Date(),
                Cause: "Wallet Topup",
                ReferenceId: `${String(SaleOrderId || "")}-${String(
                  SaleReferenceId || ""
                )}`,
                user_wallet: walletId,
              },
            }
          );
        } catch (e) {
          strapi.log.error(
            "Failed to create wallet transaction after successful topup",
            {
              walletId,
              topupId: topup.id,
              saleOrderId: String(SaleOrderId || ""),
              saleReferenceId: String(SaleReferenceId || ""),
              error: (e as any)?.message || String(e),
            }
          );
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
