/**
 * local-user-wallet controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::local-user-wallet.local-user-wallet",
  ({ strapi }) => ({
    async getCurrentUserWallet(ctx) {
      try {
        // Resolve legacy local-user id from plugin user
        const pluginUserId = ctx.state.user?.id;
        if (!pluginUserId) return ctx.unauthorized("Authentication required");

        // Find user's wallet
        const wallet = await strapi.db.query("api::local-user-wallet.local-user-wallet").findOne({
          where: {
            user: pluginUserId,
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
