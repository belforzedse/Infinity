/**
 * local-user service
 */

import { factories } from "@strapi/strapi";
import { ensurePasswordHash } from "../../auth/utils/security";

export default factories.createCoreService("api::local-user.local-user", {
  async createUser(ctx, { userData, userInfoData }) {
    try {
      let user = null;
      await strapi.db.transaction(async (trx) => {
        try {
          const sanitizedUserData = { ...userData };

          if (Object.prototype.hasOwnProperty.call(sanitizedUserData, "Password")) {
            sanitizedUserData.Password = await ensurePasswordHash(
              sanitizedUserData.Password
            );
          }

          user = await strapi.entityService.create(
            "api::local-user.local-user",
            {
              user_role: 0,
              data: sanitizedUserData,
            }
          );

          // create user info
          await strapi.entityService.create(
            "api::local-user-info.local-user-info",
            {
              data: {
                user: user.id,
                ...userInfoData,
              },
            }
          );

          // create local-user-wallet
          await strapi.entityService.create(
            "api::local-user-wallet.local-user-wallet",
            {
              data: {
                user: user.id,
                Balance: 0,
              },
            }
          );

          // create user cart
          await strapi.entityService.create("api::cart.cart", {
            data: {
              user: user.id,
            },
          });
        } catch (err) {
          strapi.log.error(err);
          ctx.conflict("Failed to create user");
          return null;
        }
      });

      return user;
    } catch (err) {
      strapi.log.error(err);
      ctx.conflict("Failed to create user");
      return null;
    }
  },
  async updateUser(ctx, { userData, userInfoData }) {
    try {
      let user = null;
      await strapi.db.transaction(async (trx) => {
        try {
          user = await strapi.entityService.update(
            "api::local-user.local-user",
            ctx.params.id,
            {
              data: userData,
            }
          );

          const userInfo = await strapi.db
            .query("api::local-user-info.local-user-info")
            .findOne({
              where: {
                user: +ctx.params.id,
              },
            });

          // create user info
          await strapi.entityService.update(
            "api::local-user-info.local-user-info",
            userInfo.id,
            {
              data: {
                ...userInfoData,
              },
            }
          );
        } catch (err) {
          strapi.log.error(err);
          ctx.conflict("Failed to create user");
          return null;
        }
      });

      return user;
    } catch (err) {
      strapi.log.error(err);
      ctx.conflict("Failed to create user");
      return null;
    }
  },
});
