/**
 * wallet-topup controller
 */

import { factories } from "@strapi/strapi";
import type { Strapi } from "@strapi/strapi";

const FRONTEND_BASE =
  process.env.FRONTEND_URL || "https://infinitycolor.org";

export default factories.createCoreController(
  "api::wallet-topup.wallet-topup",
  ({ strapi }: { strapi: Strapi }) => ({
    async chargeIntent(ctx) {
      try {
        // Resolve legacy local-user id from plugin user
        const pluginUserId = ctx.state.user?.id;
        if (!pluginUserId) return ctx.unauthorized("Authentication required");

        const { amount } = ctx.request.body || {};
        const amountIrr = Number(amount);
        if (!amountIrr || amountIrr <= 0) return ctx.badRequest("amount is required (IRR)");

        // Create a more robust unique numeric SaleOrderId for Mellat
        const randomSuffix = Math.floor(Math.random() * 900) + 100; // 3 digits
        const saleOrderId = `${Date.now()}${randomSuffix}`;

        // Persist pending topup
        const topup = await strapi.entityService.create("api::wallet-topup.wallet-topup", {
          data: {
            Amount: Math.round(amountIrr),
            Status: "Pending",
            SaleOrderId: saleOrderId,
            user: pluginUserId,
            Date: new Date(),
          },
        });

        const paymentService = strapi.service("api::payment-gateway.saman-kish");

        // Build absolute callback URL and avoid duplicate "/api" prefixes
        const configuredBase = String(
          strapi.config.get("server.url", process.env.URL || "https://api.infinitycolor.org/"),
        );
        let baseUrl = configuredBase.trim();
        if (!/^https?:\/\//i.test(baseUrl)) {
          baseUrl = process.env.URL || "https://api.infinitycolor.org/";
        }
        baseUrl = baseUrl.replace(/\/$/, "").replace(/\/api$/i, "");
        const callbackURL = `${baseUrl}/api/wallet/payment-callback`;

        const response = await paymentService.requestPayment({
          orderId: Number(saleOrderId),
          amount: Math.round(amountIrr),
          callbackURL,
          resNum: saleOrderId,
        } as any);

        if (!response?.success) {
          await strapi.entityService.update("api::wallet-topup.wallet-topup", topup.id, {
            data: { Status: "Failed" },
          });
          return ctx.badRequest("Gateway error", {
            data: { success: false, error: response?.error },
          });
        }

        // Save token for tracking
        try {
          await strapi.entityService.update("api::wallet-topup.wallet-topup", topup.id, {
            data: { RefId: response.token || response.resNum },
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
            refId: response.token || response.resNum,
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
      // Saman Kish callback fields
      const { State, RefNum, ResNum } = (ctx.request as any).body;

      try {
        // Load topup by ResNum (our SaleOrderId)
        const topups = (await strapi.entityService.findMany(
          "api::wallet-topup.wallet-topup",
          { filters: { SaleOrderId: String(ResNum) }, limit: 1 }
        )) as any[];
        const topup = topups?.[0];

        if (!topup) {
          return ctx.redirect(
            `${FRONTEND_BASE}/wallet?status=failure&reason=not_found`
          );
        }

        // Idempotency check: If topup already succeeded, skip processing
        if (topup.Status === "Success") {
          strapi.log.info(
            `Wallet topup callback already processed (idempotency check): ResNum=${ResNum}, RefNum=${RefNum}`,
            {
              topupId: topup.id,
              resNum: String(ResNum || ""),
              refNum: String(RefNum || ""),
            }
          );
          return ctx.redirect(`${FRONTEND_BASE}/wallet?status=success`);
        }

        const paymentService = strapi.service("api::payment-gateway.saman-kish");

        // Check if user cancelled or error state
        const stateNormalized = String(State || "").replace(/\s+/g, "").toUpperCase();
        if (stateNormalized !== "OK") {
          const stateDesc = paymentService.describeState(stateNormalized);
          strapi.log.info("Wallet topup cancelled or failed", {
            topupId: topup.id,
            resNum: String(ResNum || ""),
            state: stateNormalized,
            stateDesc,
          });

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
                resNum: String(ResNum || ""),
                state: stateNormalized,
                error: (e as any)?.message || String(e),
              }
            );
          }
          return ctx.redirect(
            `${FRONTEND_BASE}/wallet?status=failure&state=${encodeURIComponent(
              stateNormalized
            )}`
          );
        }

        // Verify transaction
        const verification = await paymentService.verifyTransaction({
          refNum: String(RefNum),
        });

        if (!verification?.success || verification.resultCode !== 0) {
          const resultDesc = paymentService.describeResultCode(verification.resultCode);
          strapi.log.error("Wallet topup verification failed", {
            topupId: topup.id,
            resNum: String(ResNum || ""),
            refNum: String(RefNum || ""),
            resultCode: verification.resultCode,
            resultDesc,
          });

          try {
            await strapi.entityService.update(
              "api::wallet-topup.wallet-topup",
              topup.id,
              { data: { Status: "Failed" } }
            );
          } catch (e) {
            strapi.log.error("Failed to mark wallet topup as Failed (verify)", {
              topupId: topup.id,
              resNum: String(ResNum || ""),
              refNum: String(RefNum || ""),
              error: (e as any)?.message || String(e),
            });
          }
          return ctx.redirect(
            `${FRONTEND_BASE}/wallet?status=failure&reason=verify`
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
                SaleReferenceId: String(RefNum || ""),
              },
            }
          );
        } catch (e) {
          strapi.log.error("Failed to update wallet topup as Success", {
            topupId: topup.id,
            resNum: String(ResNum || ""),
            refNum: String(RefNum || ""),
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
            resNum: String(ResNum || ""),
            refNum: String(RefNum || ""),
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
                Amount: Number(topup.Amount || 0),
                Type: "Add",
                Date: new Date(),
                Cause: "Wallet Topup",
                ReferenceId: `${String(ResNum || "")}-${String(RefNum || "")}`,
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
              resNum: String(ResNum || ""),
              refNum: String(RefNum || ""),
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
