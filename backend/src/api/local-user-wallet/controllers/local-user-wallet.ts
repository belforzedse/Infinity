/**
 * local-user-wallet controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::local-user-wallet.local-user-wallet",
  ({ strapi }) => ({
    async getCurrentUserWallet(ctx) {
      try {
        // Resolve plugin user id via ctx.state or Authorization header
        let pluginUserId = ctx.state.user?.id;
        if (!pluginUserId) {
          const authHeader = ctx.request.header.authorization || "";
          const token = authHeader.toLowerCase().startsWith("bearer ")
            ? authHeader.split(" ")[1]
            : null;
          if (token) {
            try {
              const payload = await strapi
                .plugin("users-permissions")
                .service("jwt")
                .verify(token);
              pluginUserId = payload?.id;
            } catch (err) {
              strapi.log.debug("Failed to verify JWT for wallet", err);
            }
          }
        }

        if (!pluginUserId) return ctx.unauthorized("Authentication required");

        // Find user's wallet
        const wallet = await strapi.db.query("api::local-user-wallet.local-user-wallet").findOne({
          where: {
            user: Number(pluginUserId),
          },
        });

        if (!wallet) {
          return ctx.notFound("Wallet not found for this user");
        }

        return ctx.send({
          success: true,
          data: {
            id: wallet.id,
            balance: wallet.Balance,
            lastTransactionDate: wallet.LastTransactionDate,
            description: wallet.Description,
          },
        });
      } catch (error) {
        strapi.log.error(error);
        return ctx.internalServerError(
          "An error occurred while fetching the wallet"
        );
      }
    },
  })
);
