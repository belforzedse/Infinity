/**
 * auth service
 */

import { RedisClient } from "../../..";
import {
  generateOtpCode,
  generateOtpToken,
  hashOtpCode,
} from "../utils/security";

export default () => ({
  async hasUser(ctx, { phone }) {
    const merchant = await strapi.db
      .query("api::local-user.local-user")
      .findOne({
        where: {
          Phone: {
            $endsWith: phone.substring(1),
          },
        },
      });

    return !!merchant?.id;
  },
  async otp(ctx, { phone }) {
    try {
      const merchant = await strapi.db
        .query("api::local-user.local-user")
        .findOne({
          where: {
            Phone: {
              $endsWith: phone.substring(1),
            },
          },
        });

      const code = generateOtpCode();
      const otpToken = generateOtpToken();
      const redis = await RedisClient;

      await redis.set(
        otpToken,
        JSON.stringify({
          hash: hashOtpCode(code),
          merchant: merchant?.id,
          phone,
          isVerified: merchant?.IsVerified,
          version: 1,
        }),
        {
          EX: 300,
          NX: true,
        }
      );

      const smsStatus = await strapi
        .service("api::messaging.messaging")
        .sendSMS(ctx, {
          phone,
          message: code,
          isOTP: true,
        });

      if (smsStatus !== 200) {
        ctx.badGateway("Failed to send SMS");
        return;
      }

      return otpToken;
    } catch (err) {
      strapi.log.error(err);
      ctx.status = 500;
      ctx.body = {
        message: err.message,
      };
    }
  },
});
