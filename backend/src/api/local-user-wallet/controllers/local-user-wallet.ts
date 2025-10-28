/**
 * local-user-wallet controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::local-user-wallet.local-user-wallet",
  ({ strapi }) => ({
    async getCurrentUserWallet(ctx) {
      try {
        // Get user from context (set by authentication middleware)
        const user = ctx.state.localUser ?? ctx.state.user;

        if (!user) {
          return ctx.unauthorized("Authentication required");
        }

        // Find user's wallet
        const wallet = await strapi.db
          .query("api::local-user-wallet.local-user-wallet")
          .findOne({
            where: {
              user: user.id,
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
